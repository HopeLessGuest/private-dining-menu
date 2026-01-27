import React, { useState } from 'react';
import { Dish, Language } from '../types';
import { Plus, Minus, Star, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '../constants';

export type HeaderType = 'none' | 'standard' | 'subtle-page' | 'subtle-column';

interface DishItemProps {
  dish: Dish;
  headerType: HeaderType;
  quantity: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddCustomDish?: (name: string, description: string) => void;
  language: Language;
}

export const DishItem: React.FC<DishItemProps> = ({
  dish,
  headerType,
  quantity,
  onUpdateQuantity,
  onAddCustomDish,
  language,
}) => {
  const t = TRANSLATIONS[language];
  
  // Local state for Custom Builder Mode
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const handleAddCustom = () => {
    if (customName.trim() && onAddCustomDish) {
        onAddCustomDish(customName, customDesc);
        setCustomName('');
        setCustomDesc('');
    }
  };

  return (
    <div className="mb-8 w-full break-inside-avoid">
      {/* Standard Header (New Section) */}
      {headerType === 'standard' && (
        <h3
          id={`cuisine-${dish.cuisine}`}
          className="serif text-2xl text-slate-500 mb-6 border-b border-slate-200 pb-1 mt-2"
        >
          {dish.cuisine}
        </h3>
      )}

      {/* Subtle Header (Continuation across Page or Column) */}
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
             {dish.cuisine}
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
        
        {/* Render Builder Mode OR Standard Mode */}
        {dish.isCustomBuilder ? (
           <div className="pr-2">
                <input 
                    type="text" 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={t.customDishNamePlaceholder}
                    className="w-full bg-transparent border-b border-slate-200 focus:border-slate-800 focus:outline-none placeholder:text-slate-300 serif text-lg font-semibold text-slate-800 tracking-wide leading-snug mb-2 py-1"
                />
                <textarea 
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder={t.customDishDescPlaceholder}
                    rows={2}
                    className="w-full bg-transparent border-b border-slate-200 focus:border-slate-800 focus:outline-none placeholder:text-slate-300 text-sm text-slate-600 font-light leading-relaxed italic resize-none py-1"
                />
                <div className="mt-3 flex justify-end">
                    <button 
                        onClick={handleAddCustom}
                        disabled={!customName.trim()}
                        className="w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Plus size={12} />
                        {t.addToCart}
                    </button>
                </div>
           </div>
        ) : (
           <>
                {/* Standard Dish Content */}
                <div className="pr-12">
                {/* Title Row */}
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
                        {dish.dish_name}
                        </a>
                    ) : (
                        <span>{dish.dish_name}</span>
                    )}
                    </h4>
                </div>

                {/* Featured Badge */}
                {dish.featured && (
                    <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-medium text-amber-700 tracking-wide uppercase">
                        <Star size={8} className="fill-amber-700" /> {t.chefsSpecial}
                    </span>
                    </div>
                )}
                
                {/* Description */}
                <p className="text-sm text-slate-600 font-light leading-relaxed italic">
                    {dish.description}
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
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 mt-0 mr-0 z-10 p-2 scale-80">
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
           </>
        )}
      </div>
    </div>
  );
};