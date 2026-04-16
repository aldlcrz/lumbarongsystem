import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  selectedTotal: number;
  addToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  toggleSelection: (productId: string, color?: string, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const saved = await AsyncStorage.getItem('cart');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems);
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const selectedTotal = items
    .filter(i => i.isSelected)
    .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const addToCart = (product: Product, quantity: number, color?: string, size?: string) => {
    const existingIdx = items.indexWhere(i => 
      i.product.id === product.id && 
      i.color === color && 
      i.size === size
    );

    let newItems = [...items];
    if (existingIdx > -1) {
      newItems[existingIdx].quantity += quantity;
      // Move to top
      const item = newItems.splice(existingIdx, 1)[0];
      newItems.unshift(item);
    } else {
      newItems.unshift({
        product,
        quantity,
        color,
        size,
        isSelected: true
      });
    }
    saveCart(newItems);
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    const newItems = items.filter(i => 
      !(i.product.id === productId && i.color === color && i.size === size)
    );
    saveCart(newItems);
  };

  const updateQuantity = (productId: string, quantity: number, color?: string, size?: string) => {
    if (quantity < 1) return;
    const newItems = items.map(i => {
      if (i.product.id === productId && i.color === color && i.size === size) {
        return { ...i, quantity };
      }
      return i;
    });
    saveCart(newItems);
  };

  const toggleSelection = (productId: string, color?: string, size?: string) => {
    const newItems = items.map(i => {
      if (i.product.id === productId && i.color === color && i.size === size) {
        return { ...i, isSelected: !i.isSelected };
      }
      return i;
    });
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      cartCount, 
      cartTotal, 
      selectedTotal,
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      toggleSelection,
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Extension for Array to match Dart's indexWhere if needed, 
// but we'll use findIndex for standard JS
declare global {
  interface Array<T> {
    indexWhere(predicate: (value: T, index: number, obj: T[]) => boolean): number;
  }
}

if (!Array.prototype.indexWhere) {
  Array.prototype.indexWhere = function(predicate) {
    return this.findIndex(predicate);
  };
}
