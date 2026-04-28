import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  surveyRequired: boolean;
  setAccessToken: (token: string) => void;
  setSurveyRequired: (required: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  surveyRequired: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setSurveyRequired: (required) => set({ surveyRequired: required }),
  logout: () => set({ accessToken: null, surveyRequired: false }),
}));
