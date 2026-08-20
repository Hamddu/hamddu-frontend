import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.hamddu.online';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // 웹은 쿠키, 모바일은 저장해둔 refresh 토큰을 body로 전달
        const refreshToken = useAuthStore.getState().refreshToken;
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );
        const newToken = res.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        // 서버가 회전한 새 refresh 토큰을 내려주면 저장 (재사용 감지 회피)
        if (res.data.refreshToken) {
          useAuthStore.getState().setRefreshToken(res.data.refreshToken);
        }
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
