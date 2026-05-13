import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, SegmentedButtons, RadioButton } from 'react-native-paper';
import { submitSurvey } from '../api/users.api';
import { useAuthStore } from '../store/authStore';

const AGE_OPTIONS = [
  { label: '14-18', value: '1418' },
  { label: '19-24', value: '1924' },
  { label: '25-29', value: '2529' },
  { label: '30-34', value: '3034' },
  { label: '35-39', value: '3539' },
  { label: '40-49', value: '4049' },
  { label: '50+', value: '50+' },
];

const GENDER_OPTIONS = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'F' },
];

const INTEREST_OPTIONS = [
  { label: '코바늘', value: 'crochet' },
  { label: '대바늘', value: 'knitting' },
];

const ABILITY_OPTIONS = [
  { label: '입문', value: 'beginner' },
  { label: '초급', value: 'intermediate' },
  { label: '중급', value: 'advanced' },
  { label: '고급', value: 'expert' },
];

export default function SurveyScreen() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState('');
  const [ability, setAbility] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSurveyRequired } = useAuthStore();

  const isValid = age && gender && interests && ability;

  async function handleSubmit() {
    console.log('submit:', { age, gender, interests, ability, isValid });
    if (!isValid) return;
    setLoading(true);
    try {
      await submitSurvey({ age, gender, interests, ability });
      setSurveyRequired(false);
    } catch {
      Alert.alert('오류', '설문 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>간단한 설문을 완료해주세요</Text>
      <Text variant="bodySmall" style={styles.subtitle}>더 나은 콘텐츠를 추천해드릴게요</Text>

      <Section title="나이대">
        <RadioButton.Group onValueChange={setAge} value={age}>
          {AGE_OPTIONS.map((o) => (
            <RadioButton.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </RadioButton.Group>
      </Section>

      <Section title="성별">
        <SegmentedButtons
          value={gender}
          onValueChange={setGender}
          buttons={GENDER_OPTIONS}
        />
      </Section>

      <Section title="관심 분야">
        <SegmentedButtons
          value={interests}
          onValueChange={setInterests}
          buttons={INTEREST_OPTIONS}
        />
      </Section>

      <Section title="실력">
        <SegmentedButtons
          value={ability}
          onValueChange={setAbility}
          buttons={ABILITY_OPTIONS}
        />
      </Section>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#5A37A2"
      >
        완료
      </Button>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    marginTop: 8,
    marginBottom: 32,
  },
});
