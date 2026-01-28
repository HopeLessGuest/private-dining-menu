import React, { useState, useMemo } from 'react';
import { Clock, X, Trash2, ChevronDown, ChevronUp, Calendar, CheckCircle2, CircleDashed } from 'lucide-react';
import { Order, Language } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSLATIONS } from '../constants';
import { clsx } from 'clsx';

interface OrderHistoryProps {
  orders: Order[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: 'Submitted' | 'Completed') => void;
  language: Language;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  isOpen,
  setIsOpen,
  onDeleteOrder,
  onUpdateStatus,
  language,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const t = TRANSLATIONS[language];

  // Filter orders by selected date
  const displayOrders = useMemo(() => {
    if (!filterDate) return orders;
    return orders.filter(order => {
        const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
        return orderDate === filterDate;
    });
  }, [orders, filterDate]);

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
               <div className="flex items-center gap-2">
                  <h3 className="serif text-lg text-slate-800">{t.orderHistory}</h3>
                  {/* Date Filter Icon Trigger */}
                  <div className="relative group">
                    <label htmlFor="dateFilter" className="cursor-pointer text-slate-400 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-200 block">
                        <Calendar size={16} />
                    </label>
                    <input 
                        id="dateFilter"
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="absolute top-full left-0 mt-1 opacity-0 w-8 h-8 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus:opacity-100 z-10"
                        style={{ width: '1px', height: '1px', opacity: 0, position: 'absolute' }} // Hide visually but keep accessible via label
                    />
                    {/* Actually, let's make a real visible input popup or just trigger the browser picker */}
                    <input 
                        type="date" 
                        className="absolute left-0 top-0 w-6 h-6 opacity-0 cursor-pointer"
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  {filterDate && (
                      <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                          {filterDate}
                          <button onClick={() => setFilterDate('')} className="hover:text-slate-300"><X size={8}/></button>
                      </span>
                  )}
               </div>
              <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                {displayOrders.length}
              </span>
            </div>

            <div className="overflow-y-auto p-0 flex-1 bg-slate-50/50">
              {displayOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm italic">
                  {filterDate ? 'No orders found for this date.' : t.noOrders}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const date = new Date(order.timestamp);
                    const dateStr = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                    
                    const isCompleted = order.status === 'Completed';

                    return (
                      <div key={order.id} className="bg-white">
                        <div 
                          onClick={() => toggleOrderExpansion(order.id)}
                          className={clsx(
                            "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                            isExpanded && "bg-slate-50",
                            isCompleted && "bg-slate-50/50"
                          )}
                        >
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className={clsx("text-sm font-semibold", isCompleted ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700")}>
                                    {dateStr}
                                </span>
                                <span className="text-xs text-slate-400">{timeStr}</span>
                                {isCompleted ? (
                                    <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Done</span>
                                ) : (
                                    <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1 rounded">New</span>
                                )}
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
                                
                                {/* Status Toggle */}
                                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end">
                                    <button
                                        onClick={() => onUpdateStatus(order.id, isCompleted ? 'Submitted' : 'Completed')}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                                            isCompleted 
                                                ? "bg-white text-slate-500 border-slate-200 hover:bg-slate-100" 
                                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                        )}
                                    >
                                        {isCompleted ? <CircleDashed size={14}/> : <CheckCircle2 size={14}/>}
                                        {isCompleted ? "Mark as Active" : "Mark as Completed"}
                                    </button>
                                </div>
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