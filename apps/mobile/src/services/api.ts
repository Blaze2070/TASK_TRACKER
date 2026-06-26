import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Task, TaskHistory } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  getProfile: () => api.get('/auth/profile'),
};

export const tasksApi = {
  getAll: (params?: { status?: string; priority?: string }) =>
    api.get<Task[]>('/tasks', { params }),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`),

  create: (data: Partial<Task>) =>
    api.post<Task>('/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    api.put<Task>(`/tasks/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),

  getHistory: (id: string) =>
    api.get<TaskHistory[]>(`/tasks/${id}/history`),
};

export const exportApi = {
  csv: () => api.get('/export/csv'),
};

export const pushApi = {
  registerToken: (token: string) =>
    api.post('/push-token', { token }),
  testNotification: () =>
    api.post('/notifications/test'),
};

export default api;