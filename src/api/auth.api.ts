import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.hamddu.online';
const APP_REDIRECT_URI = 'hamddu://auth/success';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'naver';

export interface OAuthResult {
  accessToken: string;
  refreshToken: string | null;
  surveyRequired: boolean;
}

export async function loginWithOAuth(provider: OAuthProvider): Promise<OAuthResult> {
  const result = await WebBrowser.openAuthSessionAsync(
    `${API_BASE_URL}/api/auth/${provider}`,
    APP_REDIRECT_URI,
  );

  if (result.type !== 'success') {
    throw new Error('로그인이 취소되었습니다.');
  }

  const url = result.url;
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const surveyRequired = params.get('survey_required') === 'true';

  if (!accessToken) {
    throw new Error('토큰을 받지 못했습니다.');
  }

  return { accessToken, refreshToken, surveyRequired };
}

/** 이 기기에서 Sign in with Apple을 쓸 수 있는지 (iOS 13+ 에서만 true) */
export async function isAppleLoginAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Sign in with Apple.
 *
 * 구글·네이버와 달리 인앱 브라우저를 거치지 않고 시스템 UI가 바로 identityToken을 준다.
 * 그 토큰을 서버로 보내면 서버가 Apple 공개키로 검증한 뒤 세션을 발급한다.
 * Apple은 최초 1회만 이메일을 내려주므로 서버는 이메일 없이도 로그인이 되도록 되어 있다.
 */
export async function loginWithApple(): Promise<OAuthResult> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;

  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('로그인이 취소되었습니다.');
    }
    throw new Error('Apple 로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
  }

  if (!credential.identityToken) {
    throw new Error('토큰을 받지 못했습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identityToken: credential.identityToken,
      // 탈퇴 시 Apple에 토큰 폐기를 요청하려면 서버가 이 코드를 refresh token으로 바꿔 둬야 한다.
      ...(credential.authorizationCode
        ? { authorizationCode: credential.authorizationCode }
        : {}),
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message ?? '로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
  }

  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken ?? null,
    surveyRequired: body.surveyRequired === true,
  };
}

export async function logout(): Promise<void> {
  const { apiClient } = await import('./client');
  const { useAuthStore } = await import('../store/authStore');
  const refreshToken = useAuthStore.getState().refreshToken;
  await apiClient.post('/api/auth/logout', { refreshToken });
}
