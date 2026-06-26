import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user, token } = response.data;
    await AsyncStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name);
    const { user, token } = response.data;
    await AsyncStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await authApi.getProfile();
        set({ user: response.data, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
      set({ isLoading: false });
    }
  },
}));