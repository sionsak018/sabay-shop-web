// src/features/products/services/productApi.ts
import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {type Product,type PaginatedResponse } from '../types/product.types';

export const productApi = {
  getAll: (page: number = 1) => 
    api.get<PaginatedResponse<Product>>(`${ENDPOINTS.PRODUCTS}?page=${page}`),
  
  getOne: (id: number) => api.get<Product>(ENDPOINTS.PRODUCT_DETAIL(id)),
  
  create: (formData: FormData) => api.post<Product>(ENDPOINTS.PRODUCTS, formData),
  
  update: (id: number, formData: FormData) =>
    api.post<Product>(`${ENDPOINTS.PRODUCTS}/${id}?_method=PUT`, formData),
  
  delete: (id: number) => api.delete(ENDPOINTS.PRODUCT_DETAIL(id)),

  getMyProducts: () => api.get<Product[]>('/my-products'),

  getFiltered: (query: string) => api.get<PaginatedResponse<Product>>(`${ENDPOINTS.PRODUCTS}?${query}`),
};