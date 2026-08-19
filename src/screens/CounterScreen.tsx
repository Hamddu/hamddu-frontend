import React, { useState, useCallback } from "react";
import {
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCounterStore, CounterProject, RowRecord } from "../store/counterStore";

// ── 드럼 숫자 ──────────────────────────────────────────────
function DrumDigit({ digit }: { digit: number }) {
  return (
    <View style={drumStyles.reel}>
      <Text style={drumStyles.digit}>{digit}</Text>
    </View>
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
  const targetRow = project.targetRow ?? 0;

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
    setStitch(stitch + 1);
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
    <SafeAreaView style={styles.flex}>
      {/* 헤더 */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
          <Text style={styles.backBtnLabel}>뒤로</Text>
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
          <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7} style={styles.detailTitleBtn}>
            <Text style={styles.detailTitle}>{projectName}</Text>
            <Text style={styles.detailTitleEdit}>✎</Text>
          </TouchableOpacity>
        )}
        <View style={{ width: 56 }} />
      </View>

      <FlatList
        data={sortedRecords}
        keyExtractor={(item) => String(item.row)}
        contentContainerStyle={styles.detailContent}
        ListHeaderComponent={
          <>
            {/* 단 표시 */}
            <View style={styles.rowDisplay}>
              <View>
                <Text style={styles.rowLabel}>현재 단</Text>
                <View style={styles.rowValueRow}>
                  <Text style={styles.rowValue}>{row}</Text>
                  <Text style={styles.rowUnit}>단</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.nextRowBtn}
                onPress={() => handleNextRow()}
                activeOpacity={0.8}
              >
                <Text style={styles.nextRowBtnText}>→ 다음 단으로</Text>
              </TouchableOpacity>
            </View>

            {/* 드럼 카운터 */}
            <View style={styles.drumWrapper}>
              <View style={styles.drum}>
                <View style={styles.drumCap} />
                <View style={styles.drumCenter}>
                  <View style={styles.drumScreen}>
                    <DrumDigit digit={tens} />
                    <DrumDigit digit={ones} />
                  </View>
                  <Text style={styles.drumLabel}>STITCH</Text>
                </View>
                <View style={[styles.drumCap, styles.drumCapRight]}>
                  <View style={styles.drumHole} />
                </View>
              </View>
            </View>

            {/* 목표 단수 진행 */}
            {targetRow > 0 && (
              <View style={styles.targetRow}>
                <View style={styles.targetBar}>
                  <View style={[styles.targetFill, { width: `${Math.min((row / targetRow) * 100, 100)}%` as any }]} />
                </View>
                <Text style={styles.targetLabel}>{row} / {targetRow}단</Text>
              </View>
            )}

            {/* +/- 버튼 */}
            <View style={styles.counterBtns}>
              <TouchableOpacity
                style={styles.minusBtn}
                onPress={() => setStitch(Math.max(0, stitch - 1))}
                activeOpacity={0.75}
              >
                <Text style={styles.minusBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.plusBtn}
                onPress={handlePlusOne}
                activeOpacity={0.85}
              >
                <Text style={styles.plusBtnText}>+ 한 코 +1</Text>
              </TouchableOpacity>
            </View>

            {/* 단별 기록 헤더 */}
            <View style={styles.logHeader}>
              <Text style={styles.logTitle}>단별 기록</Text>
              <Text style={styles.logCount}>{sortedRecords.length}단 저장됨</Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isCurrent = item.row === row;
          return (
            <View style={[styles.logRow, isCurrent && styles.logRowActive]}>
              <View style={[styles.logBadge, isCurrent && styles.logBadgeActive]}>
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
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.screenTitle}>코카운터</Text>
          <Text style={styles.screenSubtitle}>
            진행 중인 프로젝트 {projects.length}개
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleNewProject} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.chevron}>›</Text>
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
    width: 50,
    height: 56,
    borderRadius: 4,
    backgroundColor: "#F2F2EE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  digit: {
    fontSize: 34,
    fontWeight: "700",
    color: INK1,
    fontVariant: ["tabular-nums"],
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },

  // 리스트
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 22, fontWeight: "800", color: INK1, letterSpacing: -0.4 },
  screenSubtitle: { fontSize: 12, color: INK3, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY_DEEP, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 24 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
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
  chevron: { fontSize: 18, color: INK3 },
  newProjectBtn: {
    marginTop: 10, borderWidth: 2, borderStyle: "dashed",
    borderColor: LINE_STRONG, borderRadius: 16, padding: 16, alignItems: "center",
  },
  newProjectBtnText: { fontSize: 14, fontWeight: "700", color: INK3 },

  // 상세
  detailHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: LINE, backgroundColor: "#fff",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingRight: 8 },
  backBtnText: { fontSize: 28, color: PRIMARY, lineHeight: 32 },
  backBtnLabel: { fontSize: 16, color: PRIMARY, fontWeight: "600" },
  detailTitleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  detailTitle: { fontSize: 17, fontWeight: "800", color: INK1 },
  detailTitleEdit: { fontSize: 13, color: INK3 },
  detailTitleInput: { flex: 1, fontSize: 17, fontWeight: "800", color: INK1, textAlign: "center", borderBottomWidth: 1.5, borderBottomColor: PRIMARY, paddingVertical: 2 },
  detailContent: { padding: 20, paddingTop: 8 },
  rowDisplay: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, marginBottom: 4,
  },
  rowLabel: { fontSize: 11, color: INK3, fontWeight: "700", letterSpacing: 0.4 },
  rowValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 },
  rowValue: { fontSize: 36, fontWeight: "800", color: PRIMARY, letterSpacing: -1 },
  rowUnit: { fontSize: 14, color: INK3, fontWeight: "700" },
  nextRowBtn: {
    paddingHorizontal: 16, height: 44, borderRadius: 12,
    backgroundColor: PRIMARY_SOFT, alignItems: "center", justifyContent: "center",
  },
  nextRowBtnText: { fontSize: 13, fontWeight: "800", color: PRIMARY_DEEP },
  drumWrapper: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  drum: {
    flexDirection: "row", height: 120, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
  },
  drumCap: { width: 48, backgroundColor: "#F0F0F0" },
  drumCapRight: { alignItems: "center", justifyContent: "center" },
  drumHole: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#222" },
  drumCenter: {
    flex: 1, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", gap: 6,
  },
  drumScreen: {
    flexDirection: "row", gap: 4, backgroundColor: INK1, padding: 6, borderRadius: 6,
  },
  drumLabel: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 2, opacity: 0.85 },
  counterBtns: { flexDirection: "row", gap: 10, marginBottom: 20 },
  minusBtn: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: "#fff",
    borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center",
  },
  minusBtnText: { fontSize: 26, fontWeight: "800", color: INK2 },
  plusBtn: {
    flex: 1, height: 64, borderRadius: 16, backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY_DEEP, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  plusBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  logHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
  },
  logTitle: { fontSize: 13, fontWeight: "800", color: INK1 },
  logCount: { fontSize: 11, color: INK3 },
  logRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: "#fff", borderRadius: 14,
  },
  logRowActive: { backgroundColor: PRIMARY_SOFT },
  logDivider: { height: 1, backgroundColor: LINE },
  logBadge: {
    width: 44, height: 24, borderRadius: 6,
    backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center",
  },
  logBadgeActive: { backgroundColor: PRIMARY },
  logBadgeText: { fontSize: 11, fontWeight: "800", color: INK2 },
  logBadgeTextActive: { color: "#fff" },
  logStitch: { flex: 1, fontSize: 14, fontWeight: "700", color: INK1 },
  progressTag: { backgroundColor: INK1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  progressTagText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  // 목표 코수
  targetRow: { marginTop: -12, marginBottom: 16, gap: 6 },
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
