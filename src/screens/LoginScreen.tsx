import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { loginWithOAuth } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'naver' | null>(null);
  const { setAccessToken, setSurveyRequired } = useAuthStore();

  async function handleLogin(provider: 'google' | 'naver') {
    setLoading(provider);
    try {
      const { accessToken, surveyRequired } = await loginWithOAuth(provider);
      setAccessToken(accessToken);
      setSurveyRequired(surveyRequired);
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>함뚜</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>로그인하고 시작하세요</Text>

      <Button
        mode="outlined"
        onPress={() => handleLogin('google')}
        loading={loading === 'google'}
        disabled={!!loading}
        style={styles.button}
        icon="google"
      >
        Google로 로그인
      </Button>

      <Button
        mode="contained"
        onPress={() => handleLogin('naver')}
        loading={loading === 'naver'}
        disabled={!!loading}
        style={[styles.button, styles.naverButton]}
        buttonColor="#03C75A"
        icon="alpha-n-box"
      >
        네이버로 로그인
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    marginBottom: 48,
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  naverButton: {
    marginBottom: 0,
  },
});
