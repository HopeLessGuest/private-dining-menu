import { initializeApp } from "firebase/app";
import * as firebaseDatabase from "firebase/database";
import { Order } from "../types";

// Workaround for TypeScript errors where named exports from firebase/database are not detected
const { getDatabase, ref, onValue, push, remove } = firebaseDatabase as any;

// ⚠️ IMPORTANT: Replace this with your own Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyC3lypyRe0XTC5uHwvflFN27OKwpNSTqTA",
  authDomain: "private-dining-menu.firebaseapp.com",
  projectId: "private-dining-menu",
  storageBucket: "private-dining-menu.firebasestorage.app",
  messagingSenderId: "19478532940",
  appId: "1:19478532940:web:9b6da2584166c6431635e9",
  measurementId: "G-37VDBTV12K",
  // Updated to match your specific region (asia-southeast1)
  databaseURL: "https://private-dining-menu-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase only if config is valid to prevent crashes during dev without keys
let db: any = null;
try {
    if (Object.keys(firebaseConfig).length > 0) {
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    } else {
        console.warn("Firebase config is empty. Order syncing will not work until configured in services/firebase.ts");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

/**
 * Subscribes to the 'orders' node in Firebase.
 * Returns an unsubscribe function.
 */
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  if (!db) return () => {};

  const ordersRef = ref(db, 'orders');
  
  return onValue(ordersRef, (snapshot: any) => {
    const data = snapshot.val();
    const loadedOrders: Order[] = [];

    if (data) {
      // Map Firebase object { key: Order } to Array [Order]
      // We use the Firebase Key as the Order ID ensuring consistency across devices
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
            loadedOrders.push({
                ...(value as any),
                id: key // Overwrite the local random ID with the global Firebase Key
            });
        }
      });
    }

    // Sort by timestamp descending (newest first)
    loadedOrders.sort((a: Order, b: Order) => b.timestamp - a.timestamp);
    
    callback(loadedOrders);
  });
};

/**
 * Pushes a new order to Firebase.
 */
export const addOrderToCloud = async (order: Omit<Order, 'id'>) => {
  if (!db) {
    alert("Database not configured. Check console.");
    return;
  }

  try {
    const ordersRef = ref(db, 'orders');
    // Sanitize one last time just in case, though App.tsx handles it.
    // Firebase rejects undefined, so we replace it with null or strip it.
    const safeOrder = JSON.parse(JSON.stringify(order));
    const result = await push(ordersRef, safeOrder);
    console.log("Order pushed, key =", result.key);
  } catch (err) {
    console.error("Failed to push order:", err);
    alert("Order failed to send. Please check your network connection.");
  }
};

/**
 * Removes an order from Firebase by ID.
 */
export const removeOrderFromCloud = (orderId: string) => {
  if (!db) return;
  const orderRef = ref(db, `orders/${orderId}`);
  remove(orderRef);
};