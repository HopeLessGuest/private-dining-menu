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
import { generateId, getLocalizedText } from '../utils';
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
  categoryStats: Record<string, ImportStats>;
}

export const ManagementPanel: React.FC<ManagementPanelProps> = ({ dishes, setDishes, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const onTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  const t = TRANSLATIONS[language];

  const normalizeLocalizedField = (value: any): { zh?: string; en?: string } => {
    if (value && typeof value === 'object') {
      const zh = typeof value.zh === 'string' ? value.zh : undefined;
      const en = typeof value.en === 'string' ? value.en : undefined;
      return { zh: zh ?? en ?? '', en: en ?? zh ?? '' };
    }
    if (typeof value === 'string') {
      return { zh: value, en: value };
    }
    return { zh: '', en: '' };
  };

  const normalizeCategory = (value: any): { zh: string; en: string } => {
    const localized = normalizeLocalizedField(value);
    const fallback = { zh: '未分类', en: 'Uncategorized' };
    if (!localized.zh && !localized.en) return fallback;
    return {
      zh: localized.zh || localized.en || fallback.zh,
      en: localized.en || localized.zh || fallback.en,
    };
  };

  const normalizeTags = (value: any): { zh: string; en: string }[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((tag) => {
        if (typeof tag === 'string') {
          return { zh: tag, en: tag };
        }
        if (tag && typeof tag === 'object') {
          const zh = typeof tag.zh === 'string' ? tag.zh : undefined;
          const en = typeof tag.en === 'string' ? tag.en : undefined;
          if (!zh && !en) return null;
          return { zh: zh || en || '', en: en || zh || '' };
        }
        return null;
      })
      .filter((tag): tag is { zh: string; en: string } => !!tag);
  };

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

  // Derived state: Unique Categories (by English name)
  const categoryObjects = useMemo<{ zh: string; en: string }[]>(() => {
    const unique = new Map<string, { zh: string; en: string }>();
    dishes.forEach(d => {
      const key = d.category.en;
      if (!unique.has(key)) {
        unique.set(key, d.category);
      }
    });
    return Array.from(unique.values());
  }, [dishes]);

  const allTags = useMemo<{ zh: string; en: string }[]>(() => {
    const tagsMap = new Map<string, { zh: string; en: string }>();
    dishes.forEach((dish) => {
      (dish.tags || []).forEach((tag) => {
        const key = tag.en || tag.zh || '';
        if (!key) return;
        if (!tagsMap.has(key)) {
          tagsMap.set(key, {
            zh: tag.zh || tag.en || '',
            en: tag.en || tag.zh || ''
          });
        }
      });
    });
    return Array.from(tagsMap.values());
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

    let targetCategory: string | null = null;

    // Check if over is a Section
    if (over.data.current?.type === 'Section') {
      targetCategory = overId.replace('section-', '');
    } else {
      // Over is likely another dish
      const overDish = dishes.find(d => d.id === overId);
      if (overDish) targetCategory = overDish.category.en;
    }

    // If we moved to a different category, update the state immediately
    if (targetCategory && activeDish.category.en !== targetCategory) {
      setDishes((prev) => {
        // Find the target category object
        const targetCategoryObj = categoryObjects.find(c => c.en === targetCategory);
        return prev.map(d => {
          if (d.id === activeDishId && targetCategoryObj) {
            return { ...d, category: targetCategoryObj };
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
       const activeCategoryEn = (active.id as string).replace('section-', '');
       let overCategoryEn: string | null = null;
       
       // Determine overCategoryEn properly even if we are hovering over a dish inside that section
       if ((over.id as string).startsWith('section-')) {
          overCategoryEn = (over.id as string).replace('section-', '');
       } else {
          // Find the dish we are hovering over and get its category
          const overDish = dishes.find(d => d.id === over.id);
          if (overDish) {
            overCategoryEn = overDish.category.en;
          }
       }
       
       if (overCategoryEn && activeCategoryEn !== overCategoryEn) {
         const oldIndex = categoryObjects.findIndex(c => c.en === activeCategoryEn);
         const newIndex = categoryObjects.findIndex(c => c.en === overCategoryEn);
         
         if (oldIndex !== -1 && newIndex !== -1) {
            const newCategoryOrder = arrayMove<{ zh: string; en: string }>(categoryObjects, oldIndex, newIndex);
            
            // Reconstruct the full dishes array
            const newDishes: Dish[] = [];
            newCategoryOrder.forEach(c => {
                newDishes.push(...dishes.filter(d => d.category.en === c.en));
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

       if (activeDish && overDish && activeDish.category.en === overDish.category.en) {
           const currentCategoryEn = activeDish.category.en;
           const categoryDishes = dishes.filter(d => d.category.en === currentCategoryEn);
           const oldIndex = categoryDishes.findIndex(d => d.id === activeDishId);
           const newIndex = categoryDishes.findIndex(d => d.id === overDishId);

           const reorderedSubset = arrayMove<Dish>(categoryDishes, oldIndex, newIndex);

           const newFullList: Dish[] = [];
           categoryObjects.forEach(c => {
               if (c.en === currentCategoryEn) {
                   newFullList.push(...reorderedSubset);
               } else {
                   newFullList.push(...dishes.filter(d => d.category.en === c.en));
               }
           });
           setDishes(newFullList);
       }
    }
  };

  const handleAddDish = () => {
    const newDish: Dish = {
      id: generateId(),
      category: { zh: t.newSection, en: t.newSection },
      name: { zh: t.newDish, en: t.newDish },
      description: { zh: '', en: '' },
      tags: [],
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
              const normalizedName = normalizeLocalizedField(importedDish.name ?? importedDish.dish_name);
              const nameKey = normalizedName.en || normalizedName.zh;
              if (!nameKey) return;

              const categoryValue = importedDish.category ?? importedDish.category;
              const normalizedCategory = normalizeCategory(categoryValue);
              const categoryKey = normalizedCategory.en || normalizedCategory.zh || 'Uncategorized';
              if (!stats[categoryKey]) stats[categoryKey] = { added: 0, updated: 0 };

              const normalizedDish: Dish = {
                id: generateId(),
                category: normalizedCategory,
                name: { zh: normalizedName.zh || '', en: normalizedName.en || '' },
                description: normalizeLocalizedField(importedDish.description),
                tags: normalizeTags(importedDish.tags),
                spiciness: Number(importedDish.spiciness ?? 0) || 0,
                sweetness: Number(importedDish.sweetness ?? 0) || 0,
                featured: Boolean(importedDish.featured),
                enabled: importedDish.enabled !== false,
                video_url: importedDish.video_url ?? null,
              };

              // Match by Dish Name (either language)
              const matchIndex = updatedDishes.findIndex(d => (d.name.en || d.name.zh) === nameKey);

              if (matchIndex !== -1) {
                updatedDishes[matchIndex] = { 
                  ...updatedDishes[matchIndex], 
                  ...normalizedDish, 
                  id: updatedDishes[matchIndex].id
                };
                updatedCount++;
                stats[categoryKey].updated++;
              } else {
                updatedDishes.push(normalizedDish);
                addedCount++;
                stats[categoryKey].added++;
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
            isOpen ? "left-[calc(100%-40px)] md:left-[400px]" : "left-0"
        )}
      >
        {isOpen ? <ChevronLeft size={20} /> : <Settings size={20} />}
      </button>

      {/* Panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 border-r border-slate-200 overflow-hidden flex flex-col",
          // Fix width for mobile: 100% on small screens, 400px on medium+
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
            <SortableContext 
              items={categoryObjects.map(c => `section-${c.en}`)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 pb-20">
                {categoryObjects.map((category) => (
                  <SortableCategorySection 
                    key={category.en} 
                    category={category}
                    dishes={dishes.filter(d => d.category.en === category.en)}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    onUpdate={handleUpdateDish}
                    onDelete={handleDeleteDish}
                    language={language}
                    allTags={allTags}
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
                               <span className="font-medium text-sm text-slate-900">{getLocalizedText((activeOverlayItem as Dish).name, language)}</span>
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
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">{t.categoryBreakdown}</h4>
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2 text-sm">
                            {(Object.entries(importSummary.categoryStats) as [string, ImportStats][]).map(([category, stats]) => (
                                <div key={category} className="flex justify-between items-center py-1">
                                    <span className="text-slate-700 font-medium">{category}</span>
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

interface SortableCategorySectionProps {
  category: { zh: string; en: string };
  dishes: Dish[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, data: Partial<Dish>) => void;
  onDelete: (id: string) => void;
  language: Language;
  allTags: { zh: string; en: string }[];
  t: any;
}

const SortableCategorySection: React.FC<SortableCategorySectionProps> = ({ 
    category, dishes, editingId, setEditingId, onUpdate, onDelete, language, allTags, t 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
      id: `section-${category.en}`,
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
             <h3 className="serif font-semibold text-slate-700 flex-1">{getLocalizedText(category, language)}</h3>
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
                      language={language}
                      allTags={allTags}
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
  language: Language;
  allTags: { zh: string; en: string }[];
  t: any;
}

const SortableDishItem: React.FC<SortableDishItemProps> = ({ dish, isEditing, onToggleEdit, onUpdate, onDelete, language, allTags, t }) => {
  const [customTag, setCustomTag] = useState('');

  const tagLabel = language === 'zh' ? '标签' : 'Tags';
  const addTagLabel = language === 'zh' ? '添加标签' : 'Add tag';
  const addLabel = language === 'zh' ? '添加' : 'Add';

  const isTagSelected = (tag: { zh: string; en: string }) =>
    (dish.tags || []).some(t => (t.en && tag.en && t.en === tag.en) || (t.zh && tag.zh && t.zh === tag.zh));

  const toggleTag = (tag: { zh: string; en: string }) => {
    const existing = dish.tags || [];
    if (isTagSelected(tag)) {
      onUpdate(dish.id, { tags: existing.filter(t => !((t.en && t.en === tag.en) || (t.zh && t.zh === tag.zh))) });
      return;
    }
    onUpdate(dish.id, { tags: [...existing, tag] });
  };

  const handleAddCustomTag = () => {
    const value = customTag.trim();
    if (!value) return;
    const newTag = { zh: value, en: value };
    if (isTagSelected(newTag)) {
      setCustomTag('');
      return;
    }
    onUpdate(dish.id, { tags: [...(dish.tags || []), newTag] });
    setCustomTag('');
  };
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
                    <span className="font-medium text-sm text-slate-800 truncate">{getLocalizedText(dish.name, language) || t.untitled}</span>
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
                      value={getLocalizedText(dish.category, language)}
                      onChange={e => onUpdate(dish.id, { category: { ...dish.category, [language]: e.target.value } })}
                    />
                    <input 
                      className="p-1.5 border border-slate-300 rounded font-medium" 
                      placeholder={t.dishName} 
                      value={getLocalizedText(dish.name, language)}
                      onChange={e => onUpdate(dish.id, { name: { ...dish.name, [language]: e.target.value } })}
                    />
                </div>
                
                <div className="relative">
                    <textarea 
                      className="w-full p-1.5 border border-slate-300 rounded h-20 resize-none" 
                      placeholder={t.description}
                      value={getLocalizedText(dish.description, language)}
                      onChange={e => onUpdate(dish.id, { description: { ...dish.description, [language]: e.target.value } })}
                    />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-500">{tagLabel}</div>
                  <div className="flex flex-wrap gap-1">
                    {allTags.map((tag) => (
                      <button
                        key={tag.en}
                        onClick={() => onTagSelect(selectedTag === tag.en ? null : tag.en)}
                        className={clsx(
                          "px-2 py-0.5 rounded-full border text-xs truncate max-w-[120px]",
                          selectedTag === tag.en
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {isTagSelected(tag) && <CheckCircle size={12} className="text-emerald-300" />}
                        {getLocalizedText(tag, language)} <span className="ml-1 text-slate-400">{tagCounts[tag.en]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-1.5 border border-slate-300 rounded"
                      placeholder={addTagLabel}
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700"
                    >
                      {addLabel}
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