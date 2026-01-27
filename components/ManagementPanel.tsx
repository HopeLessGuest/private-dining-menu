import React, { useState, useMemo } from 'react';
import { Dish, Language } from '../types';
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
import { TRANSLATIONS } from '../constants';
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

  // Derived state: Unique Cuisines
  const cuisines = useMemo(() => {
    const unique = new Set<string>();
    dishes.forEach(d => unique.add(d.cuisine));
    return Array.from(unique);
  }, [dishes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // If dragging a Section, we don't do anything in DragOver (handled in DragEnd)
    if (active.data.current?.type === 'Section') return;

    const activeDishId = active.id as string;
    const overId = over.id as string;

    // Identify source and target
    const activeDish = dishes.find(d => d.id === activeDishId);
    if (!activeDish) return; 

    let targetCuisine: string | null = null;

    // Check if over is a Section
    if (over.data.current?.type === 'Section') {
      targetCuisine = overId.replace('section-', '');
    } else {
      // Over is likely another dish
      const overDish = dishes.find(d => d.id === overId);
      if (overDish) targetCuisine = overDish.cuisine;
    }

    // If we moved to a different cuisine, update the state immediately
    if (targetCuisine && activeDish.cuisine !== targetCuisine) {
      setDishes((prev) => {
        return prev.map(d => {
          if (d.id === activeDishId) {
            return { ...d, cuisine: targetCuisine! };
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

    // 1. Handling Section Reordering
    if (active.data.current?.type === 'Section') {
       const activeCuisine = (active.id as string).replace('section-', '');
       let overCuisine: string | null = null;
       
       // Determine overCuisine properly even if we are hovering over a dish inside that section
       if ((over.id as string).startsWith('section-')) {
          overCuisine = (over.id as string).replace('section-', '');
       } else {
          // Find the dish we are hovering over and get its cuisine
          const overDish = dishes.find(d => d.id === over.id);
          if (overDish) {
            overCuisine = overDish.cuisine;
          }
       }
       
       if (overCuisine && activeCuisine !== overCuisine) {
         const oldIndex = cuisines.indexOf(activeCuisine);
         const newIndex = cuisines.indexOf(overCuisine);
         
         if (oldIndex !== -1 && newIndex !== -1) {
            const newCuisineOrder = arrayMove(cuisines, oldIndex, newIndex);
            
            // Reconstruct the full dishes array
            const newDishes: Dish[] = [];
            newCuisineOrder.forEach(c => {
                newDishes.push(...dishes.filter(d => d.cuisine === c));
            });
            setDishes(newDishes);
         }
       }
       return;
    }

    // 2. Handling Dish Reordering
    const activeDishId = active.id as string;
    const overDishId = over.id as string;

    if (activeDishId !== overDishId) {
       const activeDish = dishes.find(d => d.id === activeDishId);
       const overDish = dishes.find(d => d.id === overDishId);

       if (activeDish && overDish && activeDish.cuisine === overDish.cuisine) {
           const currentCuisine = activeDish.cuisine;
           const cuisineDishes = dishes.filter(d => d.cuisine === currentCuisine);
           const oldIndex = cuisineDishes.findIndex(d => d.id === activeDishId);
           const newIndex = cuisineDishes.findIndex(d => d.id === overDishId);

           const reorderedSubset = arrayMove(cuisineDishes, oldIndex, newIndex);

           const newFullList: Dish[] = [];
           cuisines.forEach(c => {
               if (c === currentCuisine) {
                   newFullList.push(...reorderedSubset);
               } else {
                   newFullList.push(...dishes.filter(d => d.cuisine === c));
               }
           });
           setDishes(newFullList);
       }
    }
  };

  const handleAddDish = () => {
    const newDish: Dish = {
      id: generateId(),
      cuisine: t.newSection,
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
          // Fix trailing commas which are common syntax errors in manual JSON editing
          content = content.replace(/,\s*([\]}])/g, '$1');

          const parsed = JSON.parse(content);
          const importedDishesRaw = Array.isArray(parsed) ? parsed : (parsed.dishes || []);

          if (Array.isArray(importedDishesRaw)) {
            let addedCount = 0;
            let updatedCount = 0;
            const stats: Record<string, ImportStats> = {};

            // We perform logic on a copy of current dishes
            // Note: We access 'dishes' from the component scope.
            const updatedDishes = [...dishes];

            importedDishesRaw.forEach((importedDish: any) => {
                // Skip invalid entries
                if (!importedDish.dish_name) return;

                const cuisine = importedDish.cuisine || 'Uncategorized';
                if (!stats[cuisine]) stats[cuisine] = { added: 0, updated: 0 };

                // Match by Dish Name
                const matchIndex = updatedDishes.findIndex(d => d.dish_name === importedDish.dish_name);

                if (matchIndex !== -1) {
                    // Update existing
                    // Ensure we do not overwrite the ID with the imported ID if it's different
                    updatedDishes[matchIndex] = { 
                        ...updatedDishes[matchIndex], 
                        ...importedDish, 
                        id: updatedDishes[matchIndex].id // Force keep existing ID
                    };
                    updatedCount++;
                    stats[cuisine].updated++;
                } else {
                    // Add new
                    updatedDishes.push({
                        id: generateId(),
                        sweetness: 0,
                        spiciness: 0,
                        video_url: null,
                        description: '',
                        cuisine: cuisine,
                        enabled: true,
                        featured: false,
                        ...importedDish
                    });
                    addedCount++;
                    stats[cuisine].added++;
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
    if (activeId.startsWith('section-')) {
       return { type: 'Section', id: activeId, title: activeId.replace('section-', '') };
    }
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
            isOpen ? "left-[400px]" : "left-0"
        )}
      >
        {isOpen ? <ChevronLeft size={20} /> : <Settings size={20} />}
      </button>

      {/* Panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full w-[400px] bg-white shadow-2xl z-40 transform transition-transform duration-300 border-r border-slate-200 overflow-hidden flex flex-col",
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
            <SortableContext 
              items={cuisines.map(c => `section-${c}`)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 pb-20">
                {cuisines.map((cuisine) => (
                  <SortableCuisineSection 
                    key={cuisine} 
                    cuisine={cuisine}
                    dishes={dishes.filter(d => d.cuisine === cuisine)}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    onUpdate={handleUpdateDish}
                    onDelete={handleDeleteDish}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
            
            {createPortal(
              <DragOverlay dropAnimation={dropAnimation}>
                {activeOverlayItem ? (
                   activeOverlayItem.type === 'Section' ? (
                       <div className="bg-slate-800 text-white p-3 rounded shadow-lg flex items-center gap-3 opacity-90 w-[300px]">
                            <GripHorizontal size={20} />
                            <span className="font-bold font-serif">{activeOverlayItem.title}</span>
                       </div>
                   ) : (
                       <div className="bg-white border border-slate-300 p-3 rounded shadow-lg opacity-90 w-[300px]">
                           <div className="flex items-center gap-2">
                               <span className="font-medium text-sm text-slate-900">{(activeOverlayItem as Dish).dish_name}</span>
                           </div>
                       </div>
                   )
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </div>
      </div>

      {/* Import Summary Modal */}
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

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">{t.cuisineBreakdown}</h4>
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2 text-sm">
                            {(Object.entries(importSummary.cuisineStats) as [string, ImportStats][]).map(([cuisine, stats]) => (
                                <div key={cuisine} className="flex justify-between items-center py-1">
                                    <span className="text-slate-700 font-medium">{cuisine}</span>
                                    <div className="flex gap-2 text-xs">
                                        {stats.added > 0 && <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">+{stats.added} {t.newBadge}</span>}
                                        {stats.updated > 0 && <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">^{stats.updated} {t.updateBadge}</span>}
                                    </div>
                                </div>
                            ))}
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
  cuisine: string;
  dishes: Dish[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, data: Partial<Dish>) => void;
  onDelete: (id: string) => void;
  t: any;
}

const SortableCuisineSection: React.FC<SortableCuisineSectionProps> = ({ 
    cuisine, dishes, editingId, setEditingId, onUpdate, onDelete, t 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
      id: `section-${cuisine}`,
      data: { type: 'Section' }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200 group">
             <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-700 p-1">
                 <GripHorizontal size={16} />
             </div>
             <h3 className="serif font-semibold text-slate-700 flex-1">{cuisine}</h3>
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
  t: any;
}

const SortableDishItem: React.FC<SortableDishItemProps> = ({ dish, isEditing, onToggleEdit, onUpdate, onDelete, t }) => {
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
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-800 truncate">{dish.dish_name || t.untitled}</span>
                    {dish.featured && <Star size={10} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <input 
                        className="p-1.5 border border-slate-300 rounded" 
                        placeholder={t.cuisine} 
                        value={dish.cuisine}
                        onChange={e => onUpdate(dish.id, { cuisine: e.target.value })}
                    />
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
                                  // Mutually exclusive: If setting spiciness, reset sweetness
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
                                  // Mutually exclusive: If setting sweetness, reset spiciness
                                  const val = Number(e.target.value);
                                  onUpdate(dish.id, { sweetness: val, spiciness: val > 0 ? 0 : dish.spiciness });
                                }}
                            />
                        </label>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            <input 
                                type="checkbox"
                                className="accent-amber-500 rounded-sm"
                                checked={dish.featured || false}
                                onChange={e => onUpdate(dish.id, { featured: e.target.checked })}
                            />
                            <Star size={12} className={clsx("transition-colors", dish.featured ? "fill-amber-500 text-amber-500" : "text-slate-400")} />
                            {t.featured}
                        </label>
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