import React, { useState, useEffect, useMemo } from 'react';
import { Dish, CartState, Language, Order, NoteState, CartItem } from './types';
import { DISHES_PER_PAGE, TRANSLATIONS, CATEGORY_TRANSLATIONS } from './constants';
import { groupDishesIntoPages, getUniqueCategories, generateId, sortDishesByCategory } from './utils';
import { MenuPage } from './components/MenuPage';
import { ManagementPanel } from './components/ManagementPanel';
import { FloatingCart } from './components/FloatingCart';
import { OrderHistory } from './components/OrderHistory';
import { CuisineDirectory } from './components/CuisineDirectory';
import { subscribeToOrders, addOrderToCloud, removeOrderFromCloud, updateOrderInCloud } from './services/firebase';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartState>({});
  const [cartNotes, setCartNotes] = useState<NoteState>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [language, setLanguage] = useState<Language>('zh');

  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  // Subscribe to Firebase Order History
  useEffect(() => {
    // This listener triggers whenever the database changes (add/delete by any user)
    const unsubscribe = subscribeToOrders((orders) => {
      setOrderHistory(orders);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Filter out custom dishes (orders) but append the "Builder" placeholder to the end of the menu
  const menuDishes = useMemo(() => {
    const standardDishes = dishes.filter(d => !d.isCustom);
    // Sort dishes so they are grouped by category
    const sortedDishes = sortDishesByCategory(standardDishes);
    
    const customBuilderDish: Dish = {
      id: 'custom-builder-placeholder',
      category: 'Custom', // Set to Custom category
      tags: [],
      dish_name: '', // Placeholder, logic handled in DishItem
      description: '',
      video_url: null,
      spiciness: 0,
      sweetness: 0,
      enabled: true,
      featured: false,
      isCustomBuilder: true
    };

    return [...sortedDishes, customBuilderDish];
  }, [dishes, t.customDishTitle]);

  const pages = useMemo(() => groupDishesIntoPages(menuDishes, DISHES_PER_PAGE), [menuDishes]);
  
  // Note: We use unique categories for the directory now, translated to string via utils
  const uniqueCategoryStrings = useMemo(() => {
       const cats = getUniqueCategories(menuDishes);
       // Filter out 'Custom' from directory
       return cats
          .filter(c => c !== 'Custom')
          .map(c => CATEGORY_TRANSLATIONS[c]?.[language] || c);
  }, [menuDishes, language]);


  // Cart Logic
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleUpdateNote = (id: string, note: string) => {
    setCartNotes((prev) => ({
      ...prev,
      [id]: note
    }));
  };

  const handleClearCart = () => {
    setCart({});
    setCartNotes({});
  };

  const handleAddCustomDish = (name: string, description: string) => {
      const id = `custom-${generateId()}`;
      const newDish: Dish = {
          id: id,
          category: 'Custom', // Custom Category for orders too
          tags: [t.customDishTitle],
          dish_name: name,
          description: '', 
          video_url: null,
          spiciness: 0,
          sweetness: 0,
          enabled: false,
          featured: false,
          isCustom: true
      };

      setDishes(prev => [...prev, newDish]);
      handleUpdateQuantity(newDish.id, 1);
      
      if (description && description.trim() !== '') {
          handleUpdateNote(id, description);
      }
      
      setIsCartOpen(true);
      setIsHistoryOpen(false);
  };

  const toggleCart = (open: boolean) => {
      setIsCartOpen(open);
      if (open) setIsHistoryOpen(false);
  };

  const toggleHistory = (open: boolean) => {
      setIsHistoryOpen(open);
      if (open) setIsCartOpen(false);
  };

  const handlePlaceOrder = () => {
    const items = (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]): CartItem | null => {
        const dish = dishes.find((d) => d.id === id);
        return dish ? { ...dish, quantity: qty, note: cartNotes[id] } : null;
      })
      .filter((item): item is CartItem => item !== null);

    if (items.length === 0) return;

    const newOrderData = {
      timestamp: Date.now(),
      items: items,
      totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
      status: 'Submitted'
    };

    const sanitizedOrder = JSON.parse(JSON.stringify(newOrderData));

    addOrderToCloud(sanitizedOrder);

    setCart({});
    setCartNotes({});
  };

  const handleDeleteOrder = (orderId: string) => {
    removeOrderFromCloud(orderId);
  };
  
  const handleUpdateOrderStatus = (orderId: string, status: 'Submitted' | 'Completed') => {
      updateOrderInCloud(orderId, { status });
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
      <CuisineDirectory cuisines={uniqueCategoryStrings} language={language} />
      <ManagementPanel dishes={dishes} setDishes={setDishes} language={language} />
      
      <OrderHistory 
        orders={orderHistory} 
        isOpen={isHistoryOpen}
        setIsOpen={toggleHistory}
        onDeleteOrder={handleDeleteOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        language={language}
      />
      
      <FloatingCart 
        cart={cart} 
        cartNotes={cartNotes}
        dishes={dishes} 
        isOpen={isCartOpen}
        setIsOpen={toggleCart}
        onClear={handleClearCart} 
        onUpdateQuantity={handleUpdateQuantity} 
        onUpdateNote={handleUpdateNote}
        onPlaceOrder={handlePlaceOrder}
        language={language}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        {pages.length === 0 ? (
           <div className="mt-20 text-slate-500 serif italic text-xl">{t.noDishes}</div>
        ) : (
          pages.map((pageDishes, index) => {
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
                onAddCustomDish={handleAddCustomDish}
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