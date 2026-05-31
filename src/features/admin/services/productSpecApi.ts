import api from '../../../services/api';

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  category_id?: number;
  category?: { name: string };
}

export interface BrandModel {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  brand?: { name: string };
}

export interface BodyType {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
}

export const productSpecApi = {
  // Public
  publicBrands: () => api.get<Brand[]>('/brands'),
  publicModels: () => api.get<BrandModel[]>('/brand-models'),
  publicBodyTypes: () => api.get<BodyType[]>('/body-types'),

  // Admin - using FormData for image support
  getBrands: () => api.get<Brand[]>('/admin/brands'),
  createBrand: (data: FormData) => api.post<Brand>('/admin/brands', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateBrand: (id: number, data: FormData) => api.post<Brand>(`/admin/brands/${id}?_method=PUT`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteBrand: (id: number) => api.delete(`/admin/brands/${id}`),

  getModels: () => api.get<BrandModel[]>('/admin/brand-models'),
  createModel: (data: any) => api.post<BrandModel>('/admin/brand-models', data),
  updateModel: (id: number, data: any) => api.put<BrandModel>(`/admin/brand-models/${id}`, data),
  deleteModel: (id: number) => api.delete(`/admin/brand-models/${id}`),

  getBodyTypes: () => api.get<BodyType[]>('/admin/body-types'),
  createBodyType: (data: FormData) => api.post<BodyType>('/admin/body-types', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateBodyType: (id: number, data: FormData) => api.post<BodyType>(`/admin/body-types/${id}?_method=PUT`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteBodyType: (id: number) => api.delete(`/admin/body-types/${id}`),

  // Attributes
  getAttributes: () => api.get<any[]>('/admin/attributes'),
  createAttribute: (data: any) => api.post('/admin/attributes', data),
  updateAttribute: (id: number, data: any) => api.put(`/admin/attributes/${id}`, data),
  deleteAttribute: (id: number) => api.delete(`/admin/attributes/${id}`),
};
