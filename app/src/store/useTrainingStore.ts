import { create } from "zustand";
import { persist } from "zustand/middleware";

export const stepKey = (trackId: string, stepId: string) => `${trackId}:${stepId}`;

export type TrainingState = {
  studentName: string;
  activeTrackId: string;
  completedStepKeys: Record<string, true>;
  draftCodeByStepKey: Record<string, string>;
  setStudentName: (name: string) => void;
  setActiveTrackId: (trackId: string) => void;
  completeStep: (key: string) => void;
  setDraftCode: (key: string, code: string) => void;
  clearDraftCode: (key: string) => void;
  resetProgress: () => void;
};

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set) => ({
      studentName: "",
      activeTrackId: "base",
      completedStepKeys: {},
      draftCodeByStepKey: {},
      setStudentName: (name) => set({ studentName: name.trim() }),
      setActiveTrackId: (trackId) => set({ activeTrackId: trackId }),
      completeStep: (key) =>
        set((state) => ({
          completedStepKeys: { ...state.completedStepKeys, [key]: true },
        })),
      setDraftCode: (key, code) =>
        set((state) => ({ draftCodeByStepKey: { ...state.draftCodeByStepKey, [key]: code } })),
      clearDraftCode: (key) =>
        set((state) => {
          const next = { ...state.draftCodeByStepKey };
          delete next[key];
          return { draftCodeByStepKey: next };
        }),
      resetProgress: () => set({ completedStepKeys: {} }),
    }),
    {
      name: "umitree.training.v1",
      version: 2,
      migrate: (persisted, version) => {
        const raw = (persisted ?? {}) as any;

        if (version === 0 || version === 1) {
          const completed = raw.completedStepIds ?? raw.completedStepKeys ?? {};
          const migratedCompleted: Record<string, true> = {};

          for (const key of Object.keys(completed ?? {})) {
            if (key.includes(":")) migratedCompleted[key] = true;
            else migratedCompleted[stepKey(raw.activeTrackId ?? "base", key)] = true;
          }

          return {
            studentName: raw.studentName ?? "",
            activeTrackId: raw.activeTrackId ?? "base",
            completedStepKeys: migratedCompleted,
            draftCodeByStepKey: raw.draftCodeByStepKey ?? {},
          } satisfies Partial<TrainingState> as any;
        }

        return raw;
      },
      partialize: (state) => ({
        studentName: state.studentName,
        activeTrackId: state.activeTrackId,
        completedStepKeys: state.completedStepKeys,
        draftCodeByStepKey: state.draftCodeByStepKey,
      }),
    },
  ),
);
