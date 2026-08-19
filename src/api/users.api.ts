import { apiClient } from './client';

export interface UserProfile {
  id: string;
  nickname: string | null;
  email: string | null;
  name: string | null;
  platform: 'google' | 'naver' | null;
  age: string | null;
  gender: string | null;
  interests: string | null;
  ability: string | null;
  profileImageUrl: string | null;
  profileMediaId: string | null;
  surveyCompleted: boolean;
  createdAt: string;
}

export interface SurveyPayload {
  age: string;
  gender: string;
  interests: string;
  ability: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get('/api/users/me');
  return res.data;
}

export async function updateProfile(payload: { nickname?: string; profileMediaId?: string | null }): Promise<UserProfile> {
  const res = await apiClient.patch('/api/users/me', payload);
  return res.data;
}

export const updateNickname = (nickname: string) => updateProfile({ nickname });

export async function submitSurvey(payload: SurveyPayload): Promise<void> {
  await apiClient.post('/api/users/me/survey', payload);
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/api/users/me');
}
