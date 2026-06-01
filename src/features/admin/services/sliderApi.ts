import api from '../../../services/api';

export interface Slider {
  id: number;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const sliderApi = {
  getAll: () => api.get<Slider[]>('/admin/sliders'),
  getPublic: () => api.get<Slider[]>('/sliders'),
  create: (formData: FormData) => api.post<Slider>('/admin/sliders', formData),
  update: (id: number, formData: FormData) => api.post<Slider>(`/admin/sliders/${id}?_method=PUT`, formData),
  delete: (id: number) => api.delete(`/admin/sliders/${id}`),
};
