import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {type LoginCredentials,type RegisterData,type User } from '../types/auth.types';

export const authApi = {
  register: (data: RegisterData) => 
    api.post<{ user: User; token: string }>(ENDPOINTS.REGISTER, data),
  
  login: (data: LoginCredentials) => 
    api.post<{ user: User; token: string }>(ENDPOINTS.LOGIN, data),
  
  logout: () => api.post(ENDPOINTS.LOGOUT),
  
  getProfile: () => api.get<User>(ENDPOINTS.PROFILE),
};