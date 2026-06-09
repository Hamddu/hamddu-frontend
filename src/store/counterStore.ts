import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RowRecord {
  row: number;
  stitches: number;
}

export interface CounterProject {
  id: string;
  name: string;
  targetStitch: number;
  currentRow: number;
  currentStitch: number;
  rowRecords: RowRecord[];
  createdAt: string;
}

interface CounterStore {
  projects: CounterProject[];
  addProject: (project: CounterProject) => void;
  updateProject: (project: CounterProject) => void;
  deleteProject: (id: string) => void;
}

export const useCounterStore = create<CounterStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) =>
        set((s) => ({ projects: [project, ...s.projects] })),
      updateProject: (project) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === project.id ? project : p)),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    }),
    {
      name: "counter-projects",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
