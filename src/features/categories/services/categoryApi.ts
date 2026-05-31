import api from '../../../services/api';
import { type Category } from '../types/category.types';

export const categoryApi = {
  getAll: () => api.get<Category[]>('/categories'),

  // Admin endpoints - using FormData for image support
  adminCreate: (data: FormData) =>
    api.post<Category>('/admin/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  adminUpdate: (id: number, data: FormData) =>
    api.post<Category>(`/admin/categories/${id}?_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  adminDelete: (id: number) =>
    api.delete(`/admin/categories/${id}`),
};
