import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Menu, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CuisineDirectoryProps {
  cuisines: string[];
  language: Language;
}

export const CuisineDirectory: React.FC<CuisineDirectoryProps> = ({ cuisines, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const scrollToCuisine = (cuisine: string) => {
    const element = document.getElementById(`cuisine-${cuisine}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsOpen(false);
    }
  };

  if (cuisines.length === 0) return null;

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
                <ul className="space-y-3">
                    {cuisines.map((cuisine) => (
                    <li key={cuisine}>
                        <button
                        onClick={() => scrollToCuisine(cuisine)}
                        className="text-sm text-slate-500 hover:text-slate-900 hover:translate-x-1 transition-all text-left w-full block font-light"
                        >
                        {cuisine}
                        </button>
                    </li>
                    ))}
                </ul>
            </div>
        </div>
    </>
  );
};