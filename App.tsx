import React, { useState, useEffect, useMemo } from 'react';
import { Dish, CartState, Language, Order } from './types';
import { DISHES_PER_PAGE, TRANSLATIONS } from './constants';
import { groupDishesIntoPages, getUniqueCuisines, generateId } from './utils';
import { MenuPage } from './components/MenuPage';
import { ManagementPanel } from './components/ManagementPanel';
import { FloatingCart } from './components/FloatingCart';
import { OrderHistory } from './components/OrderHistory';
import { CuisineDirectory } from './components/CuisineDirectory';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartState>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [language, setLanguage] = useState<Language>('zh');

  const t = TRANSLATIONS[language];

  // Fetch menu data on mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('/defaultMenu.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDishes(data);
      } catch (error) {
        console.error("Failed to load menu data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Pagination Logic
  const pages = useMemo(() => groupDishesIntoPages(dishes, DISHES_PER_PAGE), [dishes]);
  const uniqueCuisines = useMemo(() => getUniqueCuisines(dishes), [dishes]);

  // Cart Logic
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleClearCart = () => setCart({});

  const handlePlaceOrder = () => {
    const items = (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const dish = dishes.find((d) => d.id === id);
        return dish ? { ...dish, quantity: qty } : null;
      })
      .filter((item): item is (Dish & { quantity: number }) => item !== null);

    if (items.length === 0) return;

    const newOrder: Order = {
      id: generateId(),
      timestamp: Date.now(),
      items: items,
      totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
    };

    setOrderHistory((prev) => [newOrder, ...prev]);
    setCart({});
    
    // Optional: Show a brief toast or alert, though the UI update is usually enough
    // alert(t.orderPlaced); 
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderHistory((prev) => prev.filter(o => o.id !== orderId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <div className="serif text-xl text-slate-500 italic">Loading Menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans pb-24">
      {/* Navigation & Utilities */}
      <CuisineDirectory cuisines={uniqueCuisines} language={language} />
      <ManagementPanel dishes={dishes} setDishes={setDishes} language={language} />
      
      <OrderHistory 
        orders={orderHistory} 
        onDeleteOrder={handleDeleteOrder} 
        language={language}
      />
      
      <FloatingCart 
        cart={cart} 
        dishes={dishes} 
        onClear={handleClearCart} 
        onUpdateQuantity={handleUpdateQuantity} 
        onPlaceOrder={handlePlaceOrder}
        language={language}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        {pages.length === 0 ? (
           <div className="mt-20 text-slate-500 serif italic text-xl">{t.noDishes}</div>
        ) : (
          pages.map((pageDishes, index) => {
             // Get the last dish of the previous page to determine continuity for headers
             const previousPage = index > 0 ? pages[index - 1] : undefined;
             const previousDish = previousPage ? previousPage[previousPage.length - 1] : undefined;

             return (
              <MenuPage
                key={index}
                pageNumber={index + 1}
                dishes={pageDishes}
                previousDish={previousDish}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                language={language}
                onLanguageChange={setLanguage}
              />
            );
          })
        )}
      </main>
    </div>
  );
};

export default App;