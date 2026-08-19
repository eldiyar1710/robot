import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SandboxProject = {
  id: string;
  title: string;
  code: string;
  updatedAt: string;
};

type SandboxState = {
  activeProjectId: string | null;
  projects: SandboxProject[];
  createProject: () => void;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string) => void;
  updateProject: (id: string, patch: Partial<Pick<SandboxProject, "title" | "code" | "updatedAt">>) => void;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const starter = `async function run(robot) {
  await robot.connect();
  await robot.setMode("manual");
  await robot.greet();
  await robot.sit();
  await robot.stand();
  await robot.wave("right");
}

run(robot);`;

export const useSandboxStore = create<SandboxState>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      projects: [],
      createProject: () => {
        const id = uid();
        const now = new Date().toISOString();
        const p: SandboxProject = { id, title: "Новый проект", code: starter, updatedAt: now };
        set((s) => ({ projects: [p, ...s.projects], activeProjectId: id }));
      },
      deleteProject: (id) =>
        set((s) => {
          const next = s.projects.filter((p) => p.id !== id);
          const activeProjectId = s.activeProjectId === id ? next[0]?.id ?? null : s.activeProjectId;
          return { projects: next, activeProjectId };
        }),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
        })),
    }),
    {
      name: "umitree.sandbox.v1",
      partialize: (s) => ({ activeProjectId: s.activeProjectId, projects: s.projects }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.projects.length === 0) state.createProject();
        else if (!state.activeProjectId) state.setActiveProjectId(state.projects[0]!.id);
      },
    },
  ),
);

