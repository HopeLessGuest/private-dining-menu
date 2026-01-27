import React, { useState } from 'react';
import { Clock, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Order, Language } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSLATIONS } from '../constants';
import { clsx } from 'clsx';

interface OrderHistoryProps {
  orders: Order[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDeleteOrder: (orderId: string) => void;
  language: Language;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  isOpen,
  setIsOpen,
  onDeleteOrder,
  language,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleDelete = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t.deleteOrderConfirm)) {
      onDeleteOrder(orderId);
    }
  };

  return (
    <>
      {/* Floating History Button - Positioned above the cart */}
      <div className="fixed right-8 bottom-24 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 bg-white text-slate-600 border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all"
          title={t.orderHistory}
        >
          {isOpen ? <X size={20} /> : <Clock size={20} />}
          {!isOpen && orders.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed right-8 bottom-40 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[60vh]"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="serif text-lg text-slate-800">{t.orderHistory}</h3>
              <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                {orders.length}
              </span>
            </div>

            <div className="overflow-y-auto p-0 flex-1 bg-slate-50/50">
              {orders.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm italic">
                  {t.noOrders}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const date = new Date(order.timestamp);
                    const dateStr = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={order.id} className="bg-white">
                        <div 
                          onClick={() => toggleOrderExpansion(order.id)}
                          className={clsx(
                            "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                            isExpanded && "bg-slate-50"
                          )}
                        >
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">{dateStr}</span>
                                <span className="text-xs text-slate-400">{timeStr}</span>
                             </div>
                             <div className="text-xs text-slate-500 mt-0.5">
                               {t.total}: {order.totalQuantity} {t.items}
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => handleDelete(order.id, e)}
                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50 border-t border-slate-100 border-dashed"
                            >
                              <div className="p-4 pt-2 space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={`${order.id}-${item.id}-${idx}`} className="flex flex-col text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                    <div className="flex justify-between">
                                      <span className="text-slate-600 line-clamp-1 flex-1 pr-4">{item.dish_name}</span>
                                      <span className="font-mono text-slate-400">x{item.quantity}</span>
                                    </div>
                                    {item.note && (
                                        <div className="text-[10px] text-amber-600 italic mt-0.5">
                                            {t.note}: {item.note}
                                        </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};