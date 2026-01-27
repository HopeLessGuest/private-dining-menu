import React, { useState } from 'react';
import { ShoppingCart, X, Trash2, Send } from 'lucide-react';
import { Dish, CartState, Language } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSLATIONS } from '../constants';

interface FloatingCartProps {
  cart: CartState;
  dishes: Dish[];
  onClear: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onPlaceOrder: () => void;
  language: Language;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  cart,
  dishes,
  onClear,
  onUpdateQuantity,
  onPlaceOrder,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = TRANSLATIONS[language];

  // Derive cart items
  const cartItems = (Object.entries(cart) as [string, number][])
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const dish = dishes.find((d) => d.id === id);
      return dish ? { ...dish, quantity: qty } : null;
    })
    .filter((item): item is (Dish & { quantity: number }) => item !== null);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSend = () => {
    onPlaceOrder();
    setIsOpen(false);
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
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1 pr-2">
                      <div className="text-sm font-medium text-slate-800 line-clamp-1">
                        {item.dish_name}
                      </div>
                      <div className="text-xs text-slate-500">{item.cuisine}</div>
                    </div>
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
                ))
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