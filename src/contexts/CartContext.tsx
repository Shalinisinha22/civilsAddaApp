import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  totalQuestions: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    };
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart:', e);
      }
    };
    saveCart();
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      // Check if item already exists
      if (prev.find((i) => i.id === item.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        getTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

