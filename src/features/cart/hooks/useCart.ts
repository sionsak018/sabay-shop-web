import { useState, useEffect } from 'react';
import { cartApi } from '../services/cartApi';
import {type Cart } from '../types/cart.types';

export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartApi.getCart();
      setCart(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = async (productId: number, quantity: number) => {
    await cartApi.addItem(productId, quantity);
    await fetchCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    await cartApi.updateItem(itemId, quantity);
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    await cartApi.removeItem(itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    await fetchCart();
  };

  return { cart, loading, addItem, updateQuantity, removeItem, clearCart, refetch: fetchCart };
};