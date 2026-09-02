import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  surveyRequired: boolean;
  /**
   * 로그인 없이 둘러보는 중인지.
   *
   * App Store 가이드라인 5.1.1(v) — 계정이 필요 없는 기능(코카운터, 커뮤니티 읽기)은
   * 로그인 없이 쓸 수 있어야 한다. 앱을 다시 켤 때마다 로그인 화면이 뜨면 같은 지적을
   * 다시 받으므로 이 값도 함께 저장한다.
   */
  isGuest: boolean;
  setSession: (accessToken: string, refreshToken: string | null, surveyRequired: boolean) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setProfileRequired: (required: boolean) => void;
  setSurveyRequired: (required: boolean) => void;
  enterGuestMode: () => void;
  /** 게스트가 로그인을 선택했을 때 — 로그인 화면으로 돌아간다. */
  exitGuestMode: () => void;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'auth-storage';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      surveyRequired: false,
      isGuest: false,
      setSession: (accessToken, refreshToken, surveyRequired) =>
        set({ accessToken, refreshToken, surveyRequired, isGuest: false }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setProfileRequired: (required) => set({ surveyRequired: required }),
      setSurveyRequired: (required) => set({ surveyRequired: required }),
      enterGuestMode: () => set({ isGuest: true }),
      exitGuestMode: () => set({ isGuest: false }),
      logout: async () => {
        set({ accessToken: null, refreshToken: null, surveyRequired: false, isGuest: false });
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isGuest: state.isGuest,
      }),
    }
  )
);
