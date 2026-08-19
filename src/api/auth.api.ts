import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.hamddu.online';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'naver';

export interface OAuthResult {
  accessToken: string;
  surveyRequired: boolean;
}

export async function loginWithOAuth(provider: OAuthProvider): Promise<OAuthResult> {
  const redirectUri = Linking.createURL('auth/success');

  const result = await WebBrowser.openAuthSessionAsync(
    `${API_BASE_URL}/api/auth/${provider}?app_redirect=${encodeURIComponent(redirectUri)}`,
    redirectUri,
  );

  if (result.type !== 'success') {
    throw new Error('로그인이 취소되었습니다.');
  }

  const url = result.url;
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const accessToken = params.get('access_token');
  const surveyRequired = params.get('survey_required') === 'true';

  if (!accessToken) {
    throw new Error('토큰을 받지 못했습니다.');
  }

  return { accessToken, surveyRequired };
}

export async function logout(): Promise<void> {
  const { apiClient } = await import('./client');
  await apiClient.post('/api/auth/logout');
}
