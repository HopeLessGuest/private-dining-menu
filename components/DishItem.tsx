import React from 'react';
import { Dish, Language } from '../types';
import { Plus, Minus, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '../constants';
import { getLocalizedText } from '../utils';

export type HeaderType = 'none' | 'standard' | 'subtle-page' | 'subtle-column';

interface DishItemProps {
  dish: Dish;
  headerType: HeaderType;
  quantity: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  language: Language;
  selectedTag?: string | null;
}

export const DishItem: React.FC<DishItemProps> = ({
  dish,
  headerType,
  quantity,
  onUpdateQuantity,
  language,
  selectedTag,
}) => {
  const t = TRANSLATIONS[language];

  // tags: featured tag 始终在首位
  const tags = dish.tags ? [...dish.tags] : [];
  if (dish.featured && tags.length && tags[0].zh !== '主厨推荐') {
    // 主厨推荐始终在首位
    const idx = tags.findIndex(t => t.zh === '主厨推荐' || t.en === "Chef's Special");
    if (idx > 0) {
      const chefTag = tags.splice(idx, 1)[0];
      tags.unshift(chefTag);
    }
  }

  return (
    <div className="mb-8 w-full break-inside-avoid">
      {/* Standard Header (New Section) */}
      {headerType === 'standard' && (
        <h3
          id={`category-${dish.category.en}`}
          className="serif text-2xl text-slate-500 mb-6 border-b border-slate-200 pb-1 mt-2"
        >
          {getLocalizedText(dish.category, language)}
        </h3>
      )}

      {/* Subtle Header (Continuation across Page or Column) */}
      {/* We hide 'subtle-column' on mobile because columns stack vertically, making it look like an arbitrary split. */}
      {/* We show 'subtle-page' always because page breaks are distinct cards. */}
      {(headerType === 'subtle-page' || headerType === 'subtle-column') && (
        <div 
          className={clsx(
            "flex-col gap-2 mb-8 mt-4 pt-4",
            headerType === 'subtle-column' ? "hidden md:flex" : "flex"
          )}
        >
           {/* Visual separator */}
           <div className="w-8 h-1 bg-slate-100 rounded-full mb-1"></div>
           <span className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-medium">
             {getLocalizedText(dish.category, language)}
           </span>
        </div>
      )}

      {/* Dish Content Container */}
      <div 
        className={clsx(
          "group relative pl-4 border-l-2 transition-all duration-300",
          dish.featured 
            ? "border-amber-300/50 bg-amber-50/60 rounded-r-lg py-3 -my-3" 
            : "border-transparent hover:border-slate-200"
        )}
      >
        
        {/* Text Content */}
        <div className="pr-12">
            {/* Title Row - Only dish name */}
          <div className="mb-1">
            <h4 className="serif text-lg font-semibold text-slate-800 tracking-wide leading-snug">
              {dish.video_url ? (
                <a 
                  href={dish.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-slate-300 hover:text-slate-600 hover:border-slate-500 transition-colors cursor-pointer decoration-0 pb-0.5"
                  title={t.watchVideo}
                >
                  {getLocalizedText(dish.name, language)}
                </a>
              ) : (
                <span>{getLocalizedText(dish.name, language)}</span>
              )}
            </h4>
          </div>
          {/* tags 展示 - 在下一行 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag.en}
                  className={clsx(
                    "px-2 py-0.5 rounded-full text-xs border",
                    tag.zh === '主厨推荐' || tag.en === "Chef's Special"
                      ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                      : selectedTag && (tag.zh === selectedTag || tag.en === selectedTag)
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  {(tag.zh === '主厨推荐' || tag.en === "Chef's Special") && (
                    <span className="text-amber-400 mr-1">★</span>
                  )}
                  {getLocalizedText(tag, language)}
                </span>
              ))}
            </div>
          )}

          {/* Featured Badge 已由 tag 高亮替代，不再单独显示 */}
          
          {/* Description */}
          <p className="text-xs text-slate-600 font-light leading-relaxed italic">
            {getLocalizedText(dish.description, language)}
          </p>
          
          {/* Spiciness or Sweetness Indicator */}
          {dish.spiciness > 0 ? (
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: dish.spiciness }).map((_, i) => (
                <span key={i} className="text-red-400 text-xs">🌶</span>
              ))}
            </div>
          ) : dish.sweetness > 0 ? (
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: dish.sweetness }).map((_, i) => (
                <span key={i} className="text-pink-400 text-xs">🍬</span>
              ))}
            </div>
          ) : null}

        </div>

        {/* Interactive Controls */}
        <div className="absolute right-0 top-0 mt-0 mr-0 z-10 p-2">
          {quantity === 0 ? (
            <button
              onClick={() => onUpdateQuantity(dish.id, 1)}
              className="
                w-8 h-8 flex items-center justify-center rounded-full
                bg-slate-100 text-slate-600
                hover:bg-slate-800 hover:text-white
                transition-all

                opacity-100
                md:opacity-0
                md:group-hover:opacity-100
                focus:opacity-100
              "
              aria-label="Add to cart"
            >
              <Plus size={16} />
            </button>
          ) : (
            <div className="flex items-center bg-white border border-slate-200 rounded-full px-1 py-1 h-8 animate-in fade-in zoom-in duration-200 shadow-sm">
              <button
                onClick={() => onUpdateQuantity(dish.id, -1)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-medium text-slate-800">
                {quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(dish.id, 1)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};