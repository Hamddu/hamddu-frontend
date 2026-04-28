import { apiClient } from './client';

export interface SurveyPayload {
  age: string;
  gender: string;
  interests: string;
  ability: string;
}

export async function submitSurvey(payload: SurveyPayload): Promise<void> {
  await apiClient.post('/api/users/me/survey', payload);
}
