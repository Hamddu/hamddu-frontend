import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  surveyRequired: boolean;
  setSession: (accessToken: string, refreshToken: string | null, surveyRequired: boolean) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setProfileRequired: (required: boolean) => void;
  setSurveyRequired: (required: boolean) => void;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'auth-storage';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      surveyRequired: false,
      setSession: (accessToken, refreshToken, surveyRequired) =>
        set({ accessToken, refreshToken, surveyRequired }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setProfileRequired: (required) => set({ surveyRequired: required }),
      setSurveyRequired: (required) => set({ surveyRequired: required }),
      logout: async () => {
        set({ accessToken: null, refreshToken: null, surveyRequired: false });
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
