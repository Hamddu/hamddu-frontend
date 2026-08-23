import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.hamddu.online';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshRequest: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (refreshRequest) return refreshRequest;

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  refreshRequest = axios
    .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken }, { withCredentials: true })
    .then(({ data }) => {
      if (typeof data.accessToken !== 'string') throw new Error('Invalid refresh response');
      useAuthStore.getState().setAccessToken(data.accessToken);
      if (data.refreshToken) useAuthStore.getState().setRefreshToken(data.refreshToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken && original.headers?.Authorization !== `Bearer ${currentToken}`) {
        original.headers.Authorization = `Bearer ${currentToken}`;
        return apiClient(original);
      }

      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
