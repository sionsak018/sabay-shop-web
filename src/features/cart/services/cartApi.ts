import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {type Cart } from '../types/cart.types';

export const cartApi = {
  getCart: () => api.get<Cart>(ENDPOINTS.CART),
  addItem: (productId: number, quantity: number = 1) =>
    api.post(ENDPOINTS.ADD_TO_CART, { product_id: productId, quantity }),
  updateItem: (itemId: number, quantity: number) =>
    api.put(`${ENDPOINTS.UPDATE_CART_ITEM}/${itemId}`, { quantity }),
  removeItem: (itemId: number) =>
    api.delete(ENDPOINTS.REMOVE_CART_ITEM(itemId)),
  clearCart: () => api.delete(ENDPOINTS.CART),
};