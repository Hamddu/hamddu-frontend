import React, { useState } from 'react';
import { StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAddPost } from '../hooks/usePosts';
import { useNavigation } from '@react-navigation/native';

export default function AddPostScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [author, setAuthor] = useState('');

  const addPostMutation = useAddPost();
  const navigation = useNavigation();

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !imageUri || !author) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }

    try {
      await addPostMutation.mutateAsync({
        title,
        description,
        imageUri,
        author,
      });

      Alert.alert('성공', '작품이 등록되었습니다!');

      // Reset form
      setTitle('');
      setDescription('');
      setImageUri('');
      setAuthor('');

      // Navigate back to home
      navigation.navigate('Home' as never);
    } catch (error) {
      Alert.alert('오류', '작품 등록에 실패했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>새 작품 등록</Title>
      
      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.imageButton}
        icon="camera"
      >
        {imageUri ? '사진 변경' : '사진 선택'}
      </Button>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      <TextInput
        label="작품 제목"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="작성자"
        value={author}
        onChangeText={setAuthor}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="작품 설명"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={addPostMutation.isPending}
        disabled={addPostMutation.isPending}
      >
        {addPostMutation.isPending ? '등록 중...' : '등록하기'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    marginBottom: 24,
    color: '#5A37A2',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageButton: {
    marginBottom: 20,
    borderColor: '#5A37A2',
    borderWidth: 1.5,
    borderRadius: 12,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 30,
    backgroundColor: '#5A37A2',
    borderRadius: 12,
    paddingVertical: 6,
  },
});
