import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {type Order } from '../types/order.types';

export const orderApi = {
  checkout: () => api.post(ENDPOINTS.CHECKOUT),
  getMyOrders: () => api.get<Order[]>(ENDPOINTS.ORDERS),
  getOrderDetail: (id: number) => api.get<Order>(`${ENDPOINTS.ORDERS}/${id}`),
};