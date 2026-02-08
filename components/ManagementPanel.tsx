
import React, { useState, useMemo } from 'react';
import { Dish, Language, DishCategory } from '../types';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Plus, Upload, Download, GripVertical, Trash2, X, ChevronLeft, Star, GripHorizontal, CheckCircle } from 'lucide-react';
import { generateId } from '../utils';
import { clsx } from 'clsx';
import { TRANSLATIONS, CATEGORY_ORDER, CATEGORY_TRANSLATIONS, DEFAULT_TAGS } from '../constants';
import { createPortal } from 'react-dom';

interface ManagementPanelProps {
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  language: Language;
}

interface ImportStats {
  added: number;
  updated: number;
}

interface ImportSummary {
  success: boolean;
  added: number;
  updated: number;
  cuisineStats: Record<string, ImportStats>;
}

export const ManagementPanel: React.FC<ManagementPanelProps> = ({ dishes, setDishes, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  const t = TRANSLATIONS[language];

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Collect all unique tags from current dishes to add to the pool
  const allAvailableTags = useMemo(() => {
    const dishTags = new Set<string>();
    dishes.forEach(d => d.tags?.forEach(tag => dishTags.add(tag)));
    DEFAULT_TAGS.forEach(tag => dishTags.add(tag));
    return Array.from(dishTags).sort();
  }, [dishes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // We only support dragging Dishes now, Categories are fixed.
    // If active item is not a dish (shouldn't happen as sections aren't draggable now), ignore.

    const activeDishId = active.id as string;
    const overId = over.id as string;

    const activeDish = dishes.find(d => d.id === activeDishId);
    if (!activeDish) return; 

    let targetCategory: DishCategory | null = null;

    // Check if over is a Section
    if (overId.startsWith('section-')) {
      targetCategory = overId.replace('section-', '') as DishCategory;
    } else {
      // Over is likely another dish
      const overDish = dishes.find(d => d.id === overId);
      if (overDish) targetCategory = overDish.category;
    }

    // Don't allow dragging into 'Custom' category if it was somehow exposed (though it's filtered)
    if (targetCategory === 'Custom') return;

    // If we moved to a different category, update the state immediately
    if (targetCategory && activeDish.category !== targetCategory) {
      setDishes((prev) => {
        return prev.map(d => {
          if (d.id === activeDishId) {
            return { ...d, category: targetCategory! };
          }
          return d;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    // Handling Dish Reordering within or across categories
    const activeDishId = active.id as string;
    const overDishId = over.id as string;

    if (activeDishId !== overDishId) {
       const activeDish = dishes.find(d => d.id === activeDishId);
       const overDish = dishes.find(d => d.id === overDishId);

       // Note: activeDish.category is already updated by dragOver, so we just need to reorder array
       if (activeDish && overDish && activeDish.category === overDish.category) {
           const currentCategory = activeDish.category;
           const categoryDishes = dishes.filter(d => d.category === currentCategory);
           const oldIndex = categoryDishes.findIndex(d => d.id === activeDishId);
           const newIndex = categoryDishes.findIndex(d => d.id === overDishId);

           const reorderedSubset = arrayMove(categoryDishes, oldIndex, newIndex);

           const newFullList: Dish[] = [];
           // Rebuild full list preserving fixed category order
           CATEGORY_ORDER.forEach(c => {
               if (c === currentCategory) {
                   newFullList.push(...reorderedSubset);
               } else {
                   newFullList.push(...dishes.filter(d => d.category === c));
               }
           });
           setDishes(newFullList);
       }
    }
  };

  const handleAddDish = () => {
    const newDish: Dish = {
      id: generateId(),
      category: 'Main', // Default
      tags: [],
      dish_name: t.newDish,
      description: '',
      video_url: null,
      spiciness: 0,
      sweetness: 0,
      enabled: true,
      featured: false,
    };
    setDishes([newDish, ...dishes]);
    setEditingId(newDish.id);
  };

  const handleUpdateDish = (id: string, updates: Partial<Dish>) => {
    setDishes((items) => items.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleDeleteDish = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setDishes((items) => items.filter((d) => d.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dishes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "menu_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const inputElement = event.target;
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let content = e.target?.result as string;
          content = content.replace(/,\s*([\]}])/g, '$1');

          const parsed = JSON.parse(content);
          const importedDishesRaw = Array.isArray(parsed) ? parsed : (parsed.dishes || []);

          if (Array.isArray(importedDishesRaw)) {
            let addedCount = 0;
            let updatedCount = 0;
            const stats: Record<string, ImportStats> = {};

            const updatedDishes = [...dishes];

            importedDishesRaw.forEach((importedDish: any) => {
                if (!importedDish.dish_name) return;

                // Migration logic: if 'cuisine' exists but 'category' doesn't, try to map it or default
                let category: DishCategory = importedDish.category;
                let tags: string[] = importedDish.tags || [];

                if (!category && importedDish.cuisine) {
                    // Primitive migration heuristic
                    if (importedDish.cuisine.includes('前菜')) category = 'Appetizer';
                    else if (importedDish.cuisine.includes('汤')) category = 'Soup';
                    else if (importedDish.cuisine.includes('主食')) category = 'Staple';
                    else if (importedDish.cuisine.includes('蔬菜') || importedDish.cuisine.includes('配菜')) category = 'Side';
                    else category = 'Main';
                    
                    // Add old cuisine as a tag
                    tags.push(importedDish.cuisine);
                }
                
                if (!CATEGORY_ORDER.includes(category)) category = 'Main'; // Fallback
                if (category === 'Custom') category = 'Main'; // Prevent importing Custom

                const catName = CATEGORY_TRANSLATIONS[category]?.en || category;
                if (!stats[catName]) stats[catName] = { added: 0, updated: 0 };

                const matchIndex = updatedDishes.findIndex(d => d.dish_name === importedDish.dish_name);

                if (matchIndex !== -1) {
                    updatedDishes[matchIndex] = { 
                        ...updatedDishes[matchIndex], 
                        ...importedDish,
                        category,
                        tags, 
                        id: updatedDishes[matchIndex].id
                    };
                    updatedCount++;
                    stats[catName].updated++;
                } else {
                    updatedDishes.push({
                        id: generateId(),
                        sweetness: 0,
                        spiciness: 0,
                        video_url: null,
                        description: '',
                        enabled: true,
                        featured: false,
                        ...importedDish,
                        category,
                        tags
                    });
                    addedCount++;
                    stats[catName].added++;
                }
            });
            
            setDishes(updatedDishes);
            setImportSummary({
                success: true,
                added: addedCount,
                updated: updatedCount,
                cuisineStats: stats
            });
          } else {
             alert(t.errorInvalidJson);
          }
        } catch (err) {
          console.error(err);
          alert(t.errorParsing);
        }
        inputElement.value = '';
      };
      reader.readAsText(file);
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // Helper to find the active item details for the overlay
  const activeOverlayItem = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith('section-')) return null; // Sections are not draggable
    const dish = dishes.find(d => d.id === activeId);
    return dish ? { type: 'Dish', ...dish } : null;
  }, [activeId, dishes]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
            "fixed left-0 top-24 z-50 p-2 bg-slate-800 text-white rounded-r-lg shadow-md transition-all duration-300",
            isOpen ? "left-[calc(100%-40px)] md:left-[400px]" : "left-0"
        )}
      >
        {isOpen ? <ChevronLeft size={20} /> : <Settings size={20} />}
      </button>

      {/* Panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 border-r border-slate-200 overflow-hidden flex flex-col",
          "w-full md:w-[400px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="serif text-xl font-semibold text-slate-800">{t.menuManagement}</h2>
          <button onClick={() => setIsOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-100 flex gap-2 flex-wrap bg-slate-50">
           <button onClick={handleAddDish} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">
             <Plus size={14} /> {t.addDish}
           </button>
           <label className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-50 cursor-pointer">
             <Upload size={14} /> {t.import}
             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
           </label>
           <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-50">
             <Download size={14} /> {t.export}
           </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Filter out 'Custom' category from management view */}
            <div className="space-y-4 pb-20">
            {CATEGORY_ORDER.filter(c => c !== 'Custom').map((category) => (
                <SortableCuisineSection 
                key={category} 
                category={category}
                dishes={dishes.filter(d => d.category === category)}
                editingId={editingId}
                setEditingId={setEditingId}
                onUpdate={handleUpdateDish}
                onDelete={handleDeleteDish}
                availableTags={allAvailableTags}
                language={language}
                t={t}
                />
            ))}
            </div>
            
            {createPortal(
              <DragOverlay dropAnimation={dropAnimation}>
                {activeOverlayItem && (
                   <div className="bg-white border border-slate-300 p-3 rounded shadow-lg opacity-90 w-[300px]">
                       <div className="flex items-center gap-2">
                           <span className="font-medium text-sm text-slate-900">{(activeOverlayItem as Dish).dish_name}</span>
                       </div>
                   </div>
                )}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </div>
      </div>

      {/* Import Summary Modal - Kept same structure */}
      {importSummary && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="serif text-xl font-bold text-slate-800">{t.importSummaryTitle}</h3>
                    <button onClick={() => setImportSummary(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                        <CheckCircle size={24} />
                        <span className="font-medium">{t.importSuccess}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded text-center border border-slate-100">
                            <div className="text-2xl font-bold text-slate-800">{importSummary.added}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{t.itemsAdded}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded text-center border border-slate-100">
                            <div className="text-2xl font-bold text-slate-800">{importSummary.updated}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{t.itemsUpdated}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                    <button 
                        onClick={() => setImportSummary(null)}
                        className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

// --- Subcomponents ---

interface SortableCuisineSectionProps {
  category: DishCategory;
  dishes: Dish[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, data: Partial<Dish>) => void;
  onDelete: (id: string) => void;
  availableTags: string[];
  language: Language;
  t: any;
}

const SortableCuisineSection: React.FC<SortableCuisineSectionProps> = ({ 
    category, dishes, editingId, setEditingId, onUpdate, onDelete, availableTags, language, t 
}) => {
  const { setNodeRef } = useSortable({ 
      id: `section-${category}`,
      data: { type: 'Section' },
      disabled: true // Sections are not draggable
  });

  const categoryName = CATEGORY_TRANSLATIONS[category][language];

  return (
    <div ref={setNodeRef} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200 group">
             {/* Removed GripHorizontal for sections */}
             <h3 className="serif font-semibold text-slate-700 flex-1 pl-2">{categoryName}</h3>
             <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{dishes.length}</span>
        </div>

        {/* Dishes List */}
        <div className="p-2 space-y-2 bg-slate-50/30">
             <SortableContext items={dishes.map(d => d.id)} strategy={verticalListSortingStrategy}>
                 {dishes.map(dish => (
                     <SortableDishItem 
                        key={dish.id}
                        dish={dish}
                        isEditing={editingId === dish.id}
                        onToggleEdit={() => setEditingId(editingId === dish.id ? null : dish.id)}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        availableTags={availableTags}
                        t={t}
                     />
                 ))}
             </SortableContext>
        </div>
    </div>
  );
};

interface SortableDishItemProps {
  dish: Dish;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (id: string, data: Partial<Dish>) => void;
  onDelete: (id: string) => void;
  availableTags: string[];
  t: any;
}

const SortableDishItem: React.FC<SortableDishItemProps> = ({ dish, isEditing, onToggleEdit, onUpdate, onDelete, availableTags, t }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
      id: dish.id,
      data: { type: 'Dish' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [newTagInput, setNewTagInput] = useState('');

  const handleToggleTag = (tag: string) => {
    const currentTags = dish.tags || [];
    if (currentTags.includes(tag)) {
        onUpdate(dish.id, { tags: currentTags.filter(t => t !== tag) });
    } else {
        onUpdate(dish.id, { tags: [...currentTags, tag] });
    }
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
        const currentTags = dish.tags || [];
        if (!currentTags.includes(newTagInput.trim())) {
             onUpdate(dish.id, { tags: [...currentTags, newTagInput.trim()] });
        }
        setNewTagInput('');
    }
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className={clsx(
            "bg-white border rounded shadow-sm transition-all", 
            isEditing ? "border-slate-400 ring-1 ring-slate-200" : "border-slate-200 hover:border-slate-300",
            dish.featured && "ring-1 ring-amber-300 border-amber-300"
        )}
    >
        {/* Header Row */}
        <div className="flex items-center p-2 pl-3 gap-3">
            <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-600 outline-none">
                <GripVertical size={14} />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer py-1" onClick={onToggleEdit}>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800 truncate">{dish.dish_name || t.untitled}</span>
                    </div>
                    {/* Tiny Tags Preview */}
                    <div className="flex flex-wrap gap-1">
                        {dish.featured && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
                        {dish.tags?.map(tag => (
                            <span key={tag} className="text-[10px] text-slate-400 leading-none">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(dish.id, { enabled: !dish.enabled });
                }}
                className={clsx("w-2 h-2 rounded-full mr-1", dish.enabled ? "bg-green-500" : "bg-slate-300")}
                title={t.toggleVisibility}
            />
        </div>

        {/* Edit Form */}
        {isEditing && (
            <div className="p-3 pt-0 border-t border-slate-100 grid gap-3 text-sm cursor-default">
                {/* Category & Name */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <select 
                        className="p-1.5 border border-slate-300 rounded bg-white" 
                        value={dish.category}
                        onChange={e => onUpdate(dish.id, { category: e.target.value as DishCategory })}
                    >
                        {CATEGORY_ORDER.filter(c => c !== 'Custom').map(c => (
                            <option key={c} value={c}>{CATEGORY_TRANSLATIONS[c].zh}</option>
                        ))}
                    </select>
                    <input 
                        className="p-1.5 border border-slate-300 rounded font-medium" 
                        placeholder={t.dishName} 
                        value={dish.dish_name}
                        onChange={e => onUpdate(dish.id, { dish_name: e.target.value })}
                    />
                </div>
                
                <div className="relative">
                    <textarea 
                        className="w-full p-1.5 border border-slate-300 rounded h-20 resize-none" 
                        placeholder={t.description}
                        value={dish.description}
                        onChange={e => onUpdate(dish.id, { description: e.target.value })}
                    />
                </div>
                
                {/* Tag Manager */}
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="text-xs text-slate-500 mb-2 font-medium flex justify-between items-center">
                        <span>{t.tags}</span>
                        {/* Featured Toggle integrated into Tag Area */}
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input 
                                type="checkbox"
                                className="accent-amber-500 rounded-sm"
                                checked={dish.featured || false}
                                onChange={e => onUpdate(dish.id, { featured: e.target.checked })}
                            />
                            <Star size={10} className={clsx("transition-colors", dish.featured ? "fill-amber-500 text-amber-500" : "text-slate-300")} />
                            <span className={clsx("text-[10px]", dish.featured ? "text-amber-700" : "text-slate-400")}>{t.featured}</span>
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                         {availableTags.map(tag => {
                             const isSelected = dish.tags?.includes(tag);
                             return (
                                 <button
                                    key={tag}
                                    onClick={() => handleToggleTag(tag)}
                                    className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                                        isSelected 
                                            ? "bg-slate-700 text-white border-slate-700" 
                                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                    )}
                                 >
                                     {tag}
                                 </button>
                             )
                         })}
                    </div>
                    <div className="flex gap-1">
                        <input 
                            className="flex-1 p-1 text-xs border border-slate-300 rounded"
                            placeholder={t.addTag}
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                        />
                         <button onClick={handleAddNewTag} className="px-2 bg-slate-200 rounded hover:bg-slate-300 text-slate-600">
                            <Plus size={12}/>
                        </button>
                    </div>
                </div>

                <input 
                    className="p-1.5 border border-slate-300 rounded w-full" 
                    placeholder={t.videoUrl} 
                    value={dish.video_url || ''}
                    onChange={e => onUpdate(dish.id, { video_url: e.target.value || null })}
                />

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            {t.spiciness}
                            <input 
                                type="number" 
                                min="0" 
                                max="5" 
                                className="w-12 p-1 border border-slate-300 rounded" 
                                value={dish.spiciness}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  onUpdate(dish.id, { spiciness: val, sweetness: val > 0 ? 0 : dish.sweetness });
                                }}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            {t.sweetness}
                            <input 
                                type="number" 
                                min="0" 
                                max="5" 
                                className="w-12 p-1 border border-slate-300 rounded" 
                                value={dish.sweetness || 0}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  onUpdate(dish.id, { sweetness: val, spiciness: val > 0 ? 0 : dish.spiciness });
                                }}
                            />
                        </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(dish.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
