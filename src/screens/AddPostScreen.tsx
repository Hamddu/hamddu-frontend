import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAddPost, usePost, useUpdatePost } from '../hooks/usePosts';
import type { CommunityStackParamList } from '../types/navigation';
import { categoriesApi } from '../services/api';
import { RichEditor } from 'react-native-pell-rich-editor';
import { pickAndUploadImage } from '../services/imageUpload';
import type { ImageSource } from '../services/imageUpload';
import Ionicons from '@expo/vector-icons/Ionicons';

const TITLE_MAX = 30;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function removeImages(html: string): string {
  return html.replace(/<img[^>]*>/gi, '');
}

export default function AddPostScreen() {
  const route = useRoute<RouteProp<CommunityStackParamList, 'AddPost'>>();
  const postId = route.params?.postId;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ id: string; url: string }[]>([]);
  const [mediaChanged, setMediaChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const richEditorRef = useRef<RichEditor>(null);
  const initializedPostId = useRef<string | undefined>(undefined);
  const addPostMutation = useAddPost();
  const updatePostMutation = useUpdatePost();
  const { data: editingPost, isLoading: postLoading } = usePost(postId ?? '');
  const navigation = useNavigation();

  const uploadImage = async (source: ImageSource) => {
    setUploading(true);
    const result = await pickAndUploadImage(source);
    setUploading(false);
    if (!result.ok) {
      if (result.error !== 'cancelled') Alert.alert('사진 업로드 실패', result.error);
      return;
    }
    setMediaIds((ids) => [...ids, result.mediaId]);
    setMediaPreviews((previews) => [...previews, { id: result.mediaId, url: result.url }]);
    setMediaChanged(true);
  };

  const handleInsertImage = () => {
    Alert.alert('사진 추가', '사진을 선택할 방법을 선택하세요.', [
      { text: '카메라', onPress: () => void uploadImage('camera') },
      { text: '갤러리', onPress: () => void uploadImage('gallery') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const handleSelectCategory = () => {
    if (categoriesLoading || categories.length === 0) return;
    setCategoryModalVisible(true);
  };

  useEffect(() => {
    if (!postId || !editingPost || initializedPostId.current === postId) return;
    initializedPostId.current = postId;
    setTitle(editingPost.title);
    setBody(removeImages(editingPost.body));
    setCategoryId(editingPost.category?.id ?? '');
    const editableMedia = editingPost.media?.filter((item) => item.id !== item.url) ?? [];
    setMediaIds(editableMedia.map((item) => item.id));
    setMediaPreviews(editableMedia.map((item) => ({ id: item.id, url: item.url })));
  }, [editingPost, postId]);

  const bodyText = stripHtml(body);
  const isValid = title.trim().length > 0 && bodyText.length > 0 && !!categoryId;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('입력 오류', '카테고리, 제목, 내용을 모두 입력해주세요.');
      return;
    }
    try {
      const post = { title: title.trim(), body, categoryId };
      if (postId) {
        await updatePostMutation.mutateAsync({
          id: postId,
          ...post,
          ...(mediaChanged ? { mediaIds } : {}),
        });
      } else {
        await addPostMutation.mutateAsync({ ...post, mediaIds });
      }
      navigation.goBack();
    } catch {
      Alert.alert('오류', `게시글 ${postId ? '수정' : '등록'}에 실패했습니다. 다시 시도해주세요.`);
    }
  };

  const isPending = addPostMutation.isPending || updatePostMutation.isPending;

  if (postId && postLoading) {
    return <View style={styles.loading}><ActivityIndicator color={PRIMARY} /></View>;
  }

  if (postId && !editingPost) {
    return <View style={styles.loading}><Text style={styles.catError}>게시글을 불러오지 못했어요.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="작성 취소"
          >
            <Ionicons name="close" size={28} color={INK1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleSubmit}
            disabled={!isValid || isPending}
            accessibilityRole="button"
            accessibilityLabel={postId ? '수정 완료' : '등록 완료'}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Text style={[styles.completeText, !isValid && styles.completeTextDisabled]}>완료</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.topicSelector} onPress={handleSelectCategory} activeOpacity={0.7}>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Text style={[styles.topicText, !selectedCategory && styles.topicPlaceholder]}>
                {selectedCategory?.label ?? '주제를 선택해주세요.'}
              </Text>
            )}
            <Ionicons name="chevron-down" size={22} color={INK2} />
          </TouchableOpacity>
          {categoriesError ? <Text style={styles.catError}>주제를 불러오지 못했어요.</Text> : null}
          <View style={styles.divider} />

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
            placeholder="제목을 입력해주세요"
            placeholderTextColor={INK3}
            returnKeyType="next"
          />

          <View style={styles.editorWrap}>
            <RichEditor
              ref={richEditorRef}
              initialContentHTML={editingPost ? removeImages(editingPost.body) : undefined}
              style={styles.editor}
              initialHeight={220}
              placeholder="뜨개 이야기를 자유롭게 나눠보세요."
              onChange={setBody}
              editorStyle={{
                backgroundColor: '#FFFFFF',
                color: INK1,
                placeholderColor: INK3,
                contentCSSText: 'font-family: -apple-system, sans-serif; font-size: 16px; line-height: 1.65; padding: 8px 0;',
                cssText: 'body { margin: 0; padding: 0; }',
              }}
              useContainer={false}
            />
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoSectionHeader}>
              <Text style={styles.photoSectionTitle}>사진</Text>
              {mediaPreviews.length > 0 ? <Text style={styles.photoCount}>{mediaPreviews.length}장</Text> : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              <TouchableOpacity
                style={styles.photoAddButton}
                onPress={handleInsertImage}
                disabled={uploading}
                activeOpacity={0.75}
                accessibilityLabel="사진 추가"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color={INK2} />
                    <Text style={styles.photoAddText}>사진 추가</Text>
                  </>
                )}
              </TouchableOpacity>
              {mediaPreviews.map((media) => (
                <View key={media.id} style={styles.photoPreviewWrap}>
                  <Image source={{ uri: media.url }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.photoRemoveButton}
                    onPress={() => {
                      setMediaIds((ids) => ids.filter((id) => id !== media.id));
                      setMediaPreviews((previews) => previews.filter((item) => item.id !== media.id));
                      setMediaChanged(true);
                    }}
                    accessibilityLabel="첨부 사진 삭제"
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.topicBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <TouchableOpacity style={styles.topicSheet} activeOpacity={1}>
            <View style={styles.topicHandle} />
            <Text style={styles.topicSheetTitle}>어떤 이야기인가요?</Text>
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.topicOption}
                  onPress={() => {
                    setCategoryId(category.id);
                    setCategoryModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.topicOptionText, selected && styles.topicOptionTextSelected]}>
                    {category.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={22} color={PRIMARY} /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const PRIMARY = '#FF7325';
const INK1 = '#1A1A1A';
const INK2 = '#404040';
const INK3 = '#8A8A8A';
const LINE = '#ECECEC';

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  completeButton: { minWidth: 58, height: 44, alignItems: 'center', justifyContent: 'center' },
  completeText: { fontSize: 17, fontWeight: '800', color: PRIMARY },
  completeTextDisabled: { color: '#B8BEC5' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  topicSelector: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicText: { flex: 1, fontSize: 17, fontWeight: '700', color: INK1 },
  topicPlaceholder: { color: INK3 },
  divider: { height: 1, backgroundColor: LINE },
  catError: { fontSize: 12, color: '#E55B4B', marginTop: 8, fontWeight: '600' },
  titleInput: {
    minHeight: 82,
    paddingHorizontal: 0,
    paddingVertical: 18,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
    color: INK1,
  },
  editorWrap: {
    minHeight: 320,
    backgroundColor: '#FFFFFF',
  },
  editor: {
    flex: 1,
    minHeight: 320,
  },
  photoSection: { paddingTop: 20, borderTopWidth: 1, borderTopColor: LINE },
  photoSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  photoSectionTitle: { fontSize: 16, fontWeight: '800', color: INK1 },
  photoCount: { fontSize: 12, fontWeight: '700', color: INK3 },
  photoRow: { gap: 10, paddingRight: 4 },
  photoPreviewWrap: { width: 108, height: 108, borderRadius: 16, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoRemoveButton: {
    position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center',
  },
  photoAddButton: {
    width: 108, height: 108, borderRadius: 16,
    backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  photoAddText: { fontSize: 12, fontWeight: '700', color: INK2 },
  topicBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,22,26,0.36)',
  },
  topicSheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  topicHandle: { alignSelf: 'center', width: 38, height: 5, borderRadius: 999, backgroundColor: '#D9DDE1' },
  topicSheetTitle: { marginTop: 22, marginBottom: 12, fontSize: 21, fontWeight: '800', color: INK1 },
  topicOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  topicOptionText: { fontSize: 16, fontWeight: '700', color: INK2 },
  topicOptionTextSelected: { color: PRIMARY, fontWeight: '800' },
});
