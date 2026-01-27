import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CustomDishBuilderProps {
  onAddCustomDish: (name: string, description: string) => void;
  language: Language;
}

export const CustomDishBuilder: React.FC<CustomDishBuilderProps> = ({
  onAddCustomDish,
  language,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCustomDish(name, description);
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-12 px-4 md:px-0">
      <div className="bg-white border-2 border-slate-100 rounded-xl p-8 md:p-12 shadow-sm relative overflow-hidden group">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
        
        <div className="relative z-10">
          <h3 className="serif text-2xl md:text-3xl text-slate-800 mb-2">
            {t.customDishTitle}
          </h3>
          <div className="h-1 w-12 bg-slate-800 mb-6"></div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.customDishNamePlaceholder}
                className="w-full text-lg font-serif border-b border-slate-200 py-2 px-1 focus:outline-none focus:border-slate-800 bg-transparent placeholder:text-slate-300 transition-colors"
                required
              />
            </div>
            
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.customDishDescPlaceholder}
                rows={2}
                className="w-full text-sm border-b border-slate-200 py-2 px-1 focus:outline-none focus:border-slate-800 bg-transparent placeholder:text-slate-300 resize-none transition-colors"
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={!name.trim()}
                className="
                  flex items-center gap-2 px-6 py-3 
                  bg-slate-800 text-white rounded-lg 
                  hover:bg-slate-700 transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                "
              >
                <Plus size={18} />
                <span className="font-medium tracking-wide text-sm uppercase">{t.addToCart}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};