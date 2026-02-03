import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Menu, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getLocalizedText } from '../utils';

interface CategoryDirectoryProps {
  categories: { zh: string; en: string }[];
  tags: { zh: string; en: string }[];
  tagCounts: Record<string, number>;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  language: Language;
}

export const CategoryDirectory: React.FC<CategoryDirectoryProps> = ({ categories, tags, tagCounts, selectedTag, onTagSelect, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const scrollToCategory = (category: { zh: string; en: string }) => {
    const element = document.getElementById(`category-${category.en}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsOpen(false);
    }
  };

  if (categories.length === 0) return null;

  return (
    <>
        {/* Mobile Toggle Button (Bottom Left) */}
        <div className="lg:hidden fixed left-4 bottom-8 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-white text-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-200"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>

        {/* Directory Container */}
        <div className={clsx(
            "fixed z-40 transition-all duration-300",
            // Desktop Styles
            "lg:left-8 lg:top-1/2 lg:-translate-y-1/2 lg:w-48 lg:block",
            // Mobile Styles (Drawer-like overlay near bottom left or simple popover)
            isOpen ? "left-4 bottom-24 opacity-100 scale-100" : "hidden lg:block opacity-0 lg:opacity-100"
        )}>
            <div className="bg-white/90 backdrop-blur border border-slate-200 p-6 shadow-xl rounded-lg max-h-[60vh] overflow-y-auto no-scrollbar w-48">
                <h3 className="serif text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">{t.directory}</h3>
                <ul className="space-y-3 mb-4">
                  {categories.map((category) => (
                    <li key={category.en}>
                      <button
                        onClick={() => scrollToCategory(category)}
                        className="text-sm text-slate-500 hover:text-slate-900 hover:translate-x-1 transition-all text-left w-full block font-light"
                      >
                        {getLocalizedText(category, language)}
                      </button>
                    </li>
                  ))}
                </ul>
                {/* Tag 统计区 */}
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <div className="text-[0.7rem] text-slate-400 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1.2">
                    {tags.map(tag => (
                      <button
                        key={tag.en} // Use stable key
                        onClick={() => onTagSelect(selectedTag === tag.en ? null : tag.en)}
                        className={clsx(
                          "px-1.5 py-0.75 rounded-full border text-[0.7rem]",
                          selectedTag === tag.en
                            ? "bg-slate-200 text-slate-800 border-slate-300"
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        {(tag.zh === '主厨推荐' || tag.en === "Chef's Special") && (
                          <span className="text-amber-400 mr-0.75">★</span>
                        )}
                        {getLocalizedText(tag, language)} <span className="ml-0.75 text-slate-400">{tagCounts[tag.en]}</span>
                      </button>
                    ))}
                  </div>
                </div>
            </div>
        </div>
    </>
  );
};
