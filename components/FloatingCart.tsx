import React, { useState, useMemo } from 'react';
import { ShoppingCart, X, Trash2, Send, MessageSquareText, Check } from 'lucide-react';
import { Dish, CartState, Language, NoteState } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSLATIONS } from '../constants';

interface FloatingCartProps {
  cart: CartState;
  cartNotes: NoteState;
  dishes: Dish[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClear: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onPlaceOrder: () => void;
  language: Language;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  cart,
  cartNotes,
  dishes,
  isOpen,
  setIsOpen,
  onClear,
  onUpdateQuantity,
  onUpdateNote,
  onPlaceOrder,
  language,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const t = TRANSLATIONS[language];

  // Derive cart items
  const cartItems = useMemo(() => {
    return (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const dish = dishes.find((d) => d.id === id);
        return dish ? { ...dish, quantity: qty } : null;
      })
      .filter((item): item is (Dish & { quantity: number }) => item !== null);
  }, [cart, dishes]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate Cuisine Stats
  const cuisineStats = useMemo(() => {
    const stats: Record<string, number> = {};
    cartItems.forEach(item => {
      stats[item.cuisine] = (stats[item.cuisine] || 0) + item.quantity;
    });
    return stats;
  }, [cartItems]);

  const handleSend = () => {
    onPlaceOrder();
    setIsOpen(false);
  };

  const startEditingNote = (id: string, currentNote: string) => {
    if (editingNoteId === id) {
      // Close without saving
      setEditingNoteId(null);
    } else {
      setEditingNoteId(id);
      setTempNote(currentNote || '');
    }
  };

  const saveNote = (id: string) => {
    onUpdateNote(id, tempNote);
    setEditingNoteId(null);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed right-8 bottom-8 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isOpen ? <X size={24} /> : <ShoppingCart size={24} />}
          {!isOpen && totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Cart Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed right-8 bottom-24 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="serif text-lg text-slate-800">{t.yourSelection}</h3>
              {totalItems > 0 && (
                <button
                  onClick={onClear}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={12} /> {t.clear}
                </button>
              )}
            </div>

            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {cartItems.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm italic">
                  {t.emptyCart}
                </div>
              ) : (
                <>
                  {cartItems.map((item) => {
                    const currentNote = cartNotes[item.id] || '';
                    const isEditing = editingNoteId === item.id;

                    return (
                      <div key={item.id} className="flex flex-col gap-2 border-b border-slate-50 pb-2 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                               <div className="text-sm font-medium text-slate-800 line-clamp-1">
                                  {item.dish_name}
                               </div>
                               <button 
                                  onClick={() => startEditingNote(item.id, currentNote)}
                                  className={`text-xs flex items-center gap-1 ${currentNote ? 'text-amber-600' : 'text-slate-300 hover:text-slate-500'}`}
                               >
                                  <MessageSquareText size={14} />
                               </button>
                            </div>
                            {/* Note Display if present */}
                            {!isEditing && currentNote && (
                               <div className="text-[10px] text-amber-600 mt-1 italic flex items-start gap-1">
                                 <span className="font-bold shrink-0">{t.note}:</span> {currentNote}
                               </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-3 bg-slate-50 rounded px-2 py-1">
                              <button
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                -
                              </button>
                              <span className="text-sm w-4 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Note Input Area */}
                        <AnimatePresence>
                          {isEditing && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="flex items-center gap-2 overflow-hidden"
                            >
                              <input
                                type="text"
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                placeholder={t.notePlaceholder}
                                autoFocus
                                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-400 bg-slate-50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveNote(item.id);
                                }}
                              />
                              <button 
                                onClick={() => saveNote(item.id)}
                                className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700"
                              >
                                <Check size={12} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  
                  {/* Cuisine Stats (Moved here inside scrollable area) */}
                  <div className="pt-4 mt-2 border-t border-slate-100 border-dashed">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] text-slate-400">
                          {Object.entries(cuisineStats).map(([cuisine, count]) => (
                              <span key={cuisine} className="bg-slate-100 px-1.5 py-0.5 rounded">
                                  {cuisine} x{count}
                              </span>
                          ))}
                      </div>
                  </div>
                </>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="text-xs text-center text-slate-400 mb-2">
                    {t.personalList}
                </div>
                <button 
                  className="w-full py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  onClick={handleSend}
                >
                  <Send size={14} />
                  {t.sendOrder}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};