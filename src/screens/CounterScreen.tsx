import React, { useState, useCallback, useRef } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  BackHandler,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCounterStore, CounterProject, RowRecord } from "../store/counterStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import RowBadgeActive from "../../assets/counter/row-badge-active.svg";
import RowBadgeDisabled from "../../assets/counter/row-badge-disabled.svg";

// ── 드럼 숫자 ──────────────────────────────────────────────
function DrumDigit({ digit }: { digit: number }) {
  return (
    <View style={drumStyles.reel}>
      <Text style={drumStyles.digit}>{digit}</Text>
    </View>
  );
}

function CounterHandle({ rotation, reverse = false }: { rotation: Animated.Value; reverse?: boolean }) {
  const rotateX = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "-360deg"] : ["0deg", "360deg"],
  });
  return (
    <Animated.View style={[styles.drumHandle, reverse && styles.drumHandleRight, { transform: [{ perspective: 600 }, { rotateX }] }]}>
      {[0, 1, 2, 3, 4].map((ridge) => <View key={ridge} style={styles.handleRidge} />)}
    </Animated.View>
  );
}

// ── 프로젝트 상세 (카운터 화면) ────────────────────────────
function CounterDetail({
  project,
  onClose,
}: {
  project: CounterProject;
  onClose: () => void;
}) {
  const { updateProject, addProject, projects } = useCounterStore();
  const isNew = !projects.find((p) => p.id === project.id);

  const [row, setRow] = useState(project.currentRow);
  const [stitch, setStitch] = useState(project.currentStitch);
  const [rowRecords, setRowRecords] = useState<RowRecord[]>(project.rowRecords);
  const [saveModal, setSaveModal] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [editingName, setEditingName] = useState(false);
  const handleRotation = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const targetRow = project.targetRow ?? 0;
  const drumWidth = Math.min(width - 44, 331);
  const digitGap = Math.max(12, (drumWidth - 232) / 3);

  const tens = Math.floor((stitch % 100) / 10);
  const ones = stitch % 10;

  // 안드로이드 백버튼 → 저장 모달
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const handleBack = () => {
    if (isNew) {
      setSaveModal(true);
    } else {
      handleSave();
    }
  };

  const handleNextRow = (currentStitch = stitch) => {
    const updated = rowRecords.filter((r) => r.row !== row);
    const newRecords = [...updated, { row, stitches: currentStitch }].sort(
      (a, b) => a.row - b.row
    );
    setRowRecords(newRecords);
    setRow(row + 1);
    setStitch(0);
  };

  const handlePlusOne = () => {
    setStitch((current) => current + 1);
    handleRotation.stopAnimation(() => {
      handleRotation.setValue(0);
      Animated.timing(handleRotation, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSave = () => {
    const lastRecords = rowRecords.filter((r) => r.row !== row);
    const finalRecords = [...lastRecords, { row, stitches: stitch }].sort(
      (a, b) => a.row - b.row
    );
    const updated: CounterProject = {
      ...project,
      name: projectName,
      currentRow: row,
      currentStitch: stitch,
      rowRecords: finalRecords,
    };
    if (isNew) {
      addProject(updated);
    } else {
      updateProject(updated);
    }
    onClose();
  };

  const handleDiscard = () => {
    onClose();
  };

  const displayRecords = [...rowRecords];
  if (!displayRecords.find((r) => r.row === row)) {
    displayRecords.push({ row, stitches: stitch });
  }
  const sortedRecords = displayRecords.sort((a, b) => b.row - a.row);

  return (
    <SafeAreaView style={styles.detailSafeArea}>
      {/* 헤더 */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="프로젝트 목록으로 돌아가기"
        >
          <Ionicons name="chevron-back" size={24} color={INK1} />
        </TouchableOpacity>
        {editingName ? (
          <TextInput
            style={styles.detailTitleInput}
            value={projectName}
            onChangeText={setProjectName}
            onBlur={() => setEditingName(false)}
            onSubmitEditing={() => setEditingName(false)}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity
            onPress={() => setEditingName(true)}
            activeOpacity={0.7}
            style={styles.detailTitleBtn}
            accessibilityRole="button"
            accessibilityLabel="프로젝트 이름 수정"
          >
            <Text style={styles.detailTitle}>{projectName}</Text>
          </TouchableOpacity>
        )}
        <View style={{ width: 56 }} />
      </View>

      <FlatList
        style={styles.detailList}
        data={sortedRecords}
        keyExtractor={(item) => String(item.row)}
        contentContainerStyle={styles.detailContent}
        ListHeaderComponent={
          <>
            <View style={styles.counterHero}>
              <View style={styles.drumWrapper}>
                <View style={[styles.drum, { width: drumWidth }]}>
                  <CounterHandle rotation={handleRotation} />
                  <View style={styles.drumCenter}>
                    <View style={[styles.drumScreen, { gap: digitGap }]}>
                      <DrumDigit digit={tens} />
                      <DrumDigit digit={ones} />
                    </View>
                  </View>
                  <CounterHandle rotation={handleRotation} reverse />
                </View>
              </View>

              <View style={styles.counterBtns}>
                <TouchableOpacity
                  style={styles.minusBtn}
                  onPress={() => setStitch(Math.max(0, stitch - 1))}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="한 코 빼기"
                >
                  <Text style={styles.minusBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.plusBtn}
                  onPress={handlePlusOne}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="한 코 더하기"
                >
                  <Text style={styles.plusBtnText}>한 코 +1</Text>
                </TouchableOpacity>
              </View>

              {targetRow > 0 && (
                <View style={styles.targetRow}>
                  <View style={styles.targetBar}>
                    <View style={[styles.targetFill, { width: `${Math.min((row / targetRow) * 100, 100)}%` as any }]} />
                  </View>
                  <Text style={styles.targetLabel}>{row} / {targetRow}단</Text>
                </View>
              )}
            </View>

            <View style={styles.logHeader}>
              <Text style={styles.logTitle}>단별 기록</Text>
              <Text style={styles.logCount}>{sortedRecords.length}단 저장됨</Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isCurrent = item.row === row;
          const Badge = isCurrent ? RowBadgeActive : RowBadgeDisabled;
          return (
            <View style={[styles.logRow, isCurrent && styles.logRowActive]}>
              <View style={styles.logBadge}>
                <Badge width={54} height={56} />
                <Text style={[styles.logBadgeText, isCurrent && styles.logBadgeTextActive]}>
                  {item.row}단
                </Text>
              </View>
              <Text style={styles.logStitch}>{item.stitches}코</Text>
              {isCurrent && (
                <View style={styles.progressTag}>
                  <Text style={styles.progressTagText}>진행중</Text>
                </View>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.logDivider} />}
        ListFooterComponent={
          <TouchableOpacity style={styles.nextRowFooter} onPress={() => handleNextRow()} activeOpacity={0.75}>
            <Text style={styles.nextRowFooterText}>다음 단으로</Text>
            <Ionicons name="arrow-forward" size={16} color={PRIMARY} />
          </TouchableOpacity>
        }
      />

      {/* 저장 모달 */}
      <Modal visible={saveModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIcon}>💾</Text>
            </View>
            <Text style={styles.modalTitle}>프로젝트로 저장할까요?</Text>
            <Text style={styles.modalDesc}>
              마지막 단{" "}
              <Text style={styles.modalBold}>{row}단 · {stitch}코</Text>가 함께 기록돼요
            </Text>
            <Text style={styles.inputLabel}>프로젝트명</Text>
            <TextInput
              style={styles.nameInput}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="프로젝트명"
              placeholderTextColor="#AAAAAA"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleDiscard}>
                <Text style={styles.cancelBtnText}>저장 안 함</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !projectName.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!projectName.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── 프로젝트 리스트 ─────────────────────────────────────────
export default function CounterScreen() {
  const { projects, deleteProject } = useCounterStore();
  const [selected, setSelected] = useState<CounterProject | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [newName, setNewName] = useState("새 프로젝트");
  const [newTarget, setNewTarget] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await useCounterStore.persist.rehydrate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNewProject = () => {
    setNewName("새 프로젝트");
    setNewTarget("");
    setNewModal(true);
  };

  const handleCreateProject = () => {
    const target = parseInt(newTarget, 10);
    const newProject: CounterProject = {
      id: Date.now().toString(),
      name: newName.trim() || "새 프로젝트",
      targetRow: isNaN(target) || target <= 0 ? 0 : target,
      currentRow: 1,
      currentStitch: 0,
      rowRecords: [],
      createdAt: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    };
    setNewModal(false);
    setSelected(newProject);
  };

  const handleDeleteProject = (project: CounterProject) => {
    Alert.alert("프로젝트 삭제", `${project.name}을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteProject(project.id),
      },
    ]);
  };

  if (selected) {
    return (
      <CounterDetail
        project={selected}
        onClose={() => setSelected(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor="#FF7325"
            colors={["#FF7325"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🧶</Text>
            <Text style={styles.emptyText}>아직 프로젝트가 없어요</Text>
            <Text style={styles.emptySubText}>+ 버튼을 눌러 첫 프로젝트를 시작해봐요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => setSelected(item)}
            activeOpacity={0.8}
          >
            <View style={styles.miniDrum}>
              <Text style={styles.miniDrumText}>
                {String(item.currentRow % 100).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{item.name}</Text>
              <Text style={styles.projectMeta}>
                <Text style={styles.projectMetaBold}>{item.currentRow}단</Text>
                {"  ·  "}
                {item.createdAt}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteProjectBtn}
              onPress={(event) => {
                event.stopPropagation();
                handleDeleteProject(item);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteProjectText}>삭제</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={INK3} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          projects.length > 0 ? (
            <TouchableOpacity style={styles.newProjectBtn} onPress={handleNewProject}>
              <Text style={styles.newProjectBtnText}>+ 새 프로젝트 시작하기</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <TouchableOpacity style={styles.addBtn} onPress={handleNewProject} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>

      <Modal visible={newModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>새 프로젝트</Text>
            <Text style={styles.inputLabel}>프로젝트명</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="프로젝트명"
              placeholderTextColor="#AAAAAA"
              returnKeyType="next"
            />
            <Text style={styles.inputLabel}>목표 단수 <Text style={styles.inputLabelOpt}>(선택)</Text></Text>
            <TextInput
              style={styles.nameInput}
              value={newTarget}
              onChangeText={setNewTarget}
              placeholder="예: 12"
              placeholderTextColor="#AAAAAA"
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewModal(false)}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProject} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>시작하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── 상수 ───────────────────────────────────────────────────
const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const LINE_STRONG = "#D8D8D8";

const drumStyles = StyleSheet.create({
  reel: {
    width: 73,
    height: 94,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontSize: 60,
    lineHeight: 72,
    fontWeight: "800",
    color: INK1,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.8,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },

  // 리스트
  addBtn: {
    position: "absolute", right: 20, bottom: 102,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY_DEEP, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 24 },
  listContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 130 },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: "800", color: INK1, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: INK3 },
  projectCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: LINE,
  },
  miniDrum: {
    width: 56, height: 40, borderRadius: 8,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
  },
  miniDrumText: { color: "#fff", fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  projectInfo: { flex: 1, minWidth: 0 },
  projectName: { fontSize: 15, fontWeight: "800", color: INK1, letterSpacing: -0.2, marginBottom: 2 },
  projectMeta: { fontSize: 12, color: INK3, fontWeight: "600" },
  projectMetaBold: { color: INK2, fontWeight: "700" },
  deleteProjectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteProjectText: { fontSize: 12, fontWeight: "700", color: "#E55B4B" },
  newProjectBtn: {
    marginTop: 10, borderWidth: 2, borderStyle: "dashed",
    borderColor: LINE_STRONG, borderRadius: 16, padding: 16, alignItems: "center",
  },
  newProjectBtnText: { fontSize: 14, fontWeight: "700", color: INK3 },

  // 상세
  detailSafeArea: { flex: 1, backgroundColor: "#FFF8F2" },
  detailHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFF8F2",
  },
  backBtn: { width: 56, height: 44, alignItems: "flex-start", justifyContent: "center" },
  detailTitleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  detailTitle: { fontSize: 19, fontWeight: "800", color: INK1 },
  detailTitleInput: { flex: 1, fontSize: 19, fontWeight: "800", color: INK1, textAlign: "center", borderBottomWidth: 1.5, borderBottomColor: PRIMARY, paddingVertical: 2 },
  detailList: { flex: 1, backgroundColor: "#FFFFFF" },
  detailContent: { paddingBottom: 130 },
  counterHero: { paddingTop: 31, paddingBottom: 38, backgroundColor: "#FFF8F2" },
  drumWrapper: { alignItems: "center", marginBottom: 44 },
  drum: {
    height: 190,
    flexDirection: "row",
    alignItems: "center",
  },
  drumHandle: {
    width: 43,
    height: 174,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: "#EFE6DF",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  drumHandleRight: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  handleRidge: { width: 26, height: 10, borderRadius: 4, backgroundColor: "#C4BDB8" },
  drumCenter: {
    flex: 1,
    height: 190,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  drumScreen: {
    flexDirection: "row",
  },
  counterBtns: { flexDirection: "row", gap: 14, marginHorizontal: 26 },
  minusBtn: {
    width: 118,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  minusBtnText: { fontSize: 19, fontWeight: "700", color: INK1 },
  plusBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  plusBtnText: { fontSize: 19, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.57 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 23,
    paddingTop: 24,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  logTitle: { fontSize: 15, fontWeight: "600", color: INK1 },
  logCount: { fontSize: 13, fontWeight: "500", color: "rgba(26,26,26,0.5)" },
  logRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    marginHorizontal: 23,
    paddingHorizontal: 10,
    backgroundColor: "#FFF8F2",
    borderRadius: 10,
  },
  logRowActive: { backgroundColor: "#FFF8F2" },
  logDivider: { height: 12 },
  logBadge: {
    width: 54,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  logBadgeText: { position: "absolute", fontSize: 15, fontWeight: "700", color: "#85807D" },
  logBadgeTextActive: { color: "#FFFFFF" },
  logStitch: { flex: 1, fontSize: 15, fontWeight: "500", color: INK1 },
  progressTag: { backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 30 },
  progressTagText: { fontSize: 15, fontWeight: "500", color: INK1 },
  nextRowFooter: {
    height: 48,
    marginHorizontal: 23,
    marginTop: 14,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F7F8FA",
  },
  nextRowFooterText: { fontSize: 14, fontWeight: "700", color: PRIMARY },

  // 목표 코수
  targetRow: { marginHorizontal: 26, marginTop: 16, gap: 6 },
  targetBar: { height: 6, backgroundColor: LINE, borderRadius: 3, overflow: "hidden" },
  targetFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  targetLabel: { fontSize: 11, fontWeight: "700", color: INK3, textAlign: "right" },
  inputLabelOpt: { color: INK3, fontWeight: "400" },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: "rgba(20,16,12,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 22, paddingBottom: 34,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2,
    alignSelf: "center", marginBottom: 18,
  },
  modalIconWrap: { alignItems: "center", marginBottom: 12 },
  modalIcon: { fontSize: 40 },
  modalTitle: {
    fontSize: 19, fontWeight: "800", color: INK1,
    textAlign: "center", letterSpacing: -0.4, marginBottom: 6,
  },
  modalDesc: { fontSize: 13, color: INK3, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  modalBold: { color: INK1, fontWeight: "700" },
  inputLabel: { fontSize: 11, fontWeight: "700", color: INK3, letterSpacing: 0.4, marginBottom: 6 },
  nameInput: {
    backgroundColor: "#F5F5F5", borderRadius: 12, padding: 14,
    fontSize: 15, fontWeight: "700", color: INK1,
    borderWidth: 1.5, borderColor: PRIMARY, marginBottom: 18,
  },
  modalBtns: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: INK2 },
  saveBtn: {
    flex: 2, height: 50, borderRadius: 14,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
  },
  saveBtnDisabled: { backgroundColor: LINE_STRONG },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
