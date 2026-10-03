import api from '../../../services/api';

export interface PublicStats {
  total_products: number;
  total_users: number;
  total_categories: number;
}

export const statsApi = {
  getPublic: () => api.get<PublicStats>('/stats/public'),
};
