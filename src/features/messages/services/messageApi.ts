import api from '../../../services/api';
import {type Message } from '../types/message.types';

export const messageApi = {
  getConversations: () => api.get<Message[]>('/messages'),
  sendMessage: (data: FormData) =>
    api.post('/messages', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  react: (id: number, emoji: string) => api.post(`/messages/${id}/react`, { emoji }),
  deleteMessage: (id: number) => api.delete(`/messages/${id}`),
  markAsRead: (id: number) => api.put(`/messages/${id}/read`),
};