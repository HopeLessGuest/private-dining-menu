
import React, { useMemo } from 'react';
import { Dish, CartState, Language } from '../types';
import { DishItem, HeaderType } from './DishItem';
import { TRANSLATIONS } from '../constants';
import { clsx } from 'clsx';

interface MenuPageProps {
  dishes: Dish[];
  previousDish?: Dish; 
  cart: CartState;
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddCustomDish?: (name: string, description: string) => void;
  pageNumber: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({
  dishes,
  previousDish,
  cart,
  onUpdateQuantity,
  onAddCustomDish,
  pageNumber,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  // Manual Column Split for Desktop
  const { leftCol, rightCol } = useMemo(() => {
    const mid = Math.ceil(dishes.length / 2);
    return {
      leftCol: dishes.slice(0, mid),
      rightCol: dishes.slice(mid),
    };
  }, [dishes]);

  // Helper to determine header type
  const getHeaderType = (
    dish: Dish, 
    index: number, 
    colType: 'left' | 'right', 
    list: Dish[], 
    prevContextDish?: Dish
  ): HeaderType => {
    // 1. First Item of the Page (Top Left)
    if (colType === 'left' && index === 0) {
      if (prevContextDish && prevContextDish.category === dish.category) {
        return 'subtle-page';
      }
      return 'standard';
    }

    // 2. First Item of the Right Column (Top Right)
    if (colType === 'right' && index === 0) {
      if (prevContextDish && prevContextDish.category === dish.category) {
        return 'subtle-column';
      }
      return 'standard';
    }

    // 3. Inner Items
    if (index > 0 && list[index - 1].category !== dish.category) {
      return 'standard';
    }

    return 'none';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#fffefb] shadow-2xl my-8 min-h-[1123px] relative print:shadow-none print:my-0 group/page">
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-8 print:hidden flex items-center gap-2 z-10">
        <button 
          onClick={() => onLanguageChange('zh')} 
          className={clsx(
            "text-xs font-medium transition-colors", 
            language === 'zh' ? "text-slate-900 font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          中文
        </button>
        <span className="text-slate-300 text-xs">|</span>
        <button 
          onClick={() => onLanguageChange('en')} 
          className={clsx(
            "text-xs font-medium transition-colors", 
            language === 'en' ? "text-slate-900 font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          English
        </button>
      </div>

      {/* Paper texture/styling */}
      <div className="p-12 md:p-16 h-full flex flex-col">
        {/* Header/Logo */}
        <header className="text-center mb-10">
          <h1 className="serif text-4xl md:text-5xl text-slate-900 tracking-wider mb-2 uppercase flex items-center justify-center gap-4">
            <span>{t.restaurantName}</span>
            <span 
              className="text-6xl md:text-7xl opacity-90" 
              style={{ fontFamily: '"Ma Shan Zheng", cursive' }}
            >
              {t.restaurantNameZh}
            </span>
          </h1>
          <div className="h-px w-24 bg-slate-300 mx-auto my-4"></div>
          <p className="text-slate-500 text-sm tracking-[0.2em] uppercase">{t.seasonalMenu}</p>
        </header>

        {/* Content Grid (Manual Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 flex-1 items-start">
          
          {/* Left Column */}
          <div className="flex flex-col">
            {leftCol.map((dish, index) => (
              <DishItem
                key={dish.id}
                dish={dish}
                headerType={getHeaderType(dish, index, 'left', leftCol, previousDish)}
                quantity={cart[dish.id] || 0}
                onUpdateQuantity={onUpdateQuantity}
                onAddCustomDish={onAddCustomDish}
                language={language}
              />
            ))}
          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            {rightCol.map((dish, index) => (
              <DishItem
                key={dish.id}
                dish={dish}
                headerType={getHeaderType(
                  dish, 
                  index, 
                  'right', 
                  rightCol, 
                  leftCol[leftCol.length - 1]
                )}
                quantity={cart[dish.id] || 0}
                onUpdateQuantity={onUpdateQuantity}
                onAddCustomDish={onAddCustomDish}
                language={language}
              />
            ))}
          </div>

        </div>

        {/* Footer / Page Number */}
        <footer className="mt-auto pt-8 flex justify-center items-center">
            <span className="serif text-slate-400 italic text-sm">- {pageNumber} -</span>
        </footer>
      </div>
    </div>
  );
};
