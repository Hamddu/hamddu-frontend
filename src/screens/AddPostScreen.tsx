import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAddPost } from '../hooks/usePosts';
import { categoriesApi } from '../services/api';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

const TITLE_MAX = 200;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function AddPostScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const richEditorRef = useRef<RichEditor>(null);
  const addPostMutation = useAddPost();
  const navigation = useNavigation();

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const bodyText = stripHtml(body);
  const isValid = title.trim().length > 0 && bodyText.length > 0 && !!categoryId;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('입력 오류', '카테고리, 제목, 내용을 모두 입력해주세요.');
      return;
    }
    try {
      await addPostMutation.mutateAsync({
        title: title.trim(),
        body,
        categoryId,
      });
      navigation.goBack();
    } catch {
      Alert.alert('오류', '게시글 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {/* 카테고리 */}
          <Text style={styles.label}>카테고리 <Text style={styles.required}>*</Text></Text>
          {categoriesLoading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginBottom: 16 }} />
          ) : categoriesError ? (
            <Text style={styles.catError}>카테고리 로드 실패: {String(categoriesError)}</Text>
          ) : categories.length === 0 ? (
            <Text style={styles.catError}>등록된 카테고리가 없어요 (서버에 카테고리를 추가해주세요)</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
                  onPress={() => setCategoryId(cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catChipText, categoryId === cat.id && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 제목 */}
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>제목 <Text style={styles.required}>*</Text></Text>
            <Text style={[styles.count, title.length > TITLE_MAX * 0.9 && styles.countWarn]}>
              {title.length} / {TITLE_MAX}
            </Text>
          </View>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
            placeholder="제목을 입력하세요"
            placeholderTextColor={INK3}
            returnKeyType="next"
          />

          {/* 내용 */}
          <Text style={[styles.label, { marginBottom: 0 }]}>내용 <Text style={styles.required}>*</Text></Text>

          {/* 툴바 */}
          <RichToolbar
            editor={richEditorRef}
            style={styles.toolbar}
            selectedIconTint={PRIMARY}
            iconTint={INK2}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.setStrikethrough,
              actions.insertOrderedList,
              actions.insertBulletsList,
              actions.indent,
              actions.outdent,
              actions.undo,
              actions.redo,
            ]}
          />

          {/* 에디터 */}
          <View style={styles.editorWrap}>
            <RichEditor
              ref={richEditorRef}
              style={styles.editor}
              initialHeight={220}
              placeholder="내용을 입력하세요"
              onChange={setBody}
              editorStyle={{
                backgroundColor: '#fff',
                color: INK1,
                placeholderColor: INK3,
                contentCSSText: 'font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; padding: 4px 0;',
              }}
              useContainer={false}
            />
          </View>
        </ScrollView>

        {/* 등록 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || addPostMutation.isPending) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || addPostMutation.isPending}
            activeOpacity={0.85}
          >
            {addPostMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>등록하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#FF7325';
const PRIMARY_DEEP = '#C7521A';
const INK1 = '#1A1A1A';
const INK2 = '#404040';
const INK3 = '#8A8A8A';
const LINE = '#ECECEC';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: INK1, marginBottom: 8 },
  required: { color: PRIMARY },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  count: { fontSize: 11, color: INK3, fontWeight: '600' },
  countWarn: { color: '#E55B4B' },
  catError: { fontSize: 12, color: '#E55B4B', marginBottom: 16, fontWeight: '600' },
  catScroll: { marginBottom: 20, flexShrink: 0 },
  catRow: { gap: 8, paddingRight: 4 },
  catChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LINE,
  },
  catChipActive: { backgroundColor: INK1, borderColor: INK1 },
  catChipText: { fontSize: 13, fontWeight: '600', color: INK1 },
  catChipTextActive: { color: '#fff', fontWeight: '800' },
  titleInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LINE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: INK1,
    marginBottom: 20,
  },
  toolbar: {
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.5,
    borderBottomWidth: 1,
    borderColor: LINE,
    marginTop: 10,
    height: 44,
  },
  editorWrap: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: LINE,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 220,
    backgroundColor: '#fff',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 4,
  },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#D0D0D0', shadowColor: 'transparent', elevation: 0 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
