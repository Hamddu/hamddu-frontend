import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  surveyRequired: boolean;
  setAccessToken: (token: string) => void;
  setProfileRequired: (required: boolean) => void;
  setSurveyRequired: (required: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      surveyRequired: false,
      setAccessToken: (token) => set({ accessToken: token }),
      setProfileRequired: (required) => set({ surveyRequired: required }),
      setSurveyRequired: (required) => set({ surveyRequired: required }),
      logout: () => set({ accessToken: null, surveyRequired: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
