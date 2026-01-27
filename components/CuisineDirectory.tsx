import React from 'react';
import { clsx } from 'clsx';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CuisineDirectoryProps {
  cuisines: string[];
  language: Language;
}

export const CuisineDirectory: React.FC<CuisineDirectoryProps> = ({ cuisines, language }) => {
  const t = TRANSLATIONS[language];

  const scrollToCuisine = (cuisine: string) => {
    const element = document.getElementById(`cuisine-${cuisine}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (cuisines.length === 0) return null;

  return (
    <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-10 w-48 pointer-events-none">
        <div className="bg-white/90 backdrop-blur border border-slate-200 p-6 shadow-xl rounded-lg pointer-events-auto">
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
  );
};
