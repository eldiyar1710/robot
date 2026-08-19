import { CodeEditor } from "@/components/CodeEditor";
import { MotionPad } from "@/components/MotionPad";
import { RobotScene } from "@/components/RobotScene";
import { cn } from "@/lib/utils";
import { useRobotStore } from "@/store/useRobotStore";
import { useSandboxStore } from "@/store/useSandboxStore";
import { callsToHumanList, parseRobotCalls, playCalls } from "@/utils/robotProgram";
import { useMemo, useState } from "react";

export default function Sandbox() {
  const activeProjectId = useSandboxStore((s) => s.activeProjectId);
  const projects = useSandboxStore((s) => s.projects);
  const createProject = useSandboxStore((s) => s.createProject);
  const deleteProject = useSandboxStore((s) => s.deleteProject);
  const setActiveProjectId = useSandboxStore((s) => s.setActiveProjectId);
  const updateProject = useSandboxStore((s) => s.updateProject);

  const project = useMemo(() => projects.find((p) => p.id === activeProjectId) ?? projects[0], [activeProjectId, projects]);

  const robotStatus = useRobotStore((s) => s.status);
  const robotMode = useRobotStore((s) => s.mode);
  const robotReset = useRobotStore((s) => s.reset);
  const robotConnect = useRobotStore((s) => s.connect);
  const robotSetMode = useRobotStore((s) => s.setMode);
  const robotRaiseArm = useRobotStore((s) => s.raiseArm);
  const robotSit = useRobotStore((s) => s.sit);
  const robotStand = useRobotStore((s) => s.stand);

  const [isRunning, setIsRunning] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);

  async function run() {
    if (!project) return;
    setIsRunning(true);
    setConsoleLines([]);
    try {
      robotReset();
      const calls = parseRobotCalls(project.code);
      setConsoleLines((l) => [...l, `Команды: ${calls.length ? callsToHumanList(calls) : "—"}`]);
      await playCalls(calls, {
        connect: robotConnect,
        setMode: robotSetMode,
        raiseArm: robotRaiseArm,
        sit: robotSit,
        stand: robotStand,
      });
      setConsoleLines((l) => [...l, "Готово"]);
    } catch (e) {
      setConsoleLines((l) => [...l, `Ошибка: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setIsRunning(false);
    }
  }

  function exportProject() {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProject() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result)) as { title?: string; code?: string };
          createProject();
          const latest = useSandboxStore.getState().projects[0];
          if (latest && data.code) {
            updateProject(latest.id, { title: data.title ?? latest.title, code: data.code });
            setConsoleLines(["Проект импортирован"]);
          }
        } catch {
          setConsoleLines(["Ошибка импорта: неверный JSON"]);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold">Песочница</div>
          <div className="text-sm text-white/60">Свободный режим: собирай команды и запускай в симуляции</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium",
              "bg-[hsl(var(--accent))] text-black hover:opacity-90 disabled:opacity-40",
            )}
            disabled={isRunning || !project}
            onClick={run}
          >
            Run
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm",
              "border border-white/10 bg-white/0 hover:bg-white/5 disabled:opacity-40",
            )}
            disabled={isRunning}
            onClick={robotReset}
          >
            Reset
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm",
              "border border-white/10 bg-white/0 hover:bg-white/5",
            )}
            onClick={createProject}
          >
            Новый проект
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm",
              "border border-white/10 bg-white/0 hover:bg-white/5 disabled:opacity-40",
            )}
            disabled={!project}
            onClick={exportProject}
          >
            Экспорт
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm",
              "border border-white/10 bg-white/0 hover:bg-white/5",
            )}
            onClick={importProject}
          >
            Импорт
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
          <div className="text-sm font-semibold">Проекты</div>
          <div className="mt-3 grid gap-2">
            {projects.map((p) => {
              const active = p.id === project?.id;
              return (
                <button
                  key={p.id}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                    "border-white/10 bg-white/0 hover:bg-white/5",
                    active && "bg-white/10",
                  )}
                  onClick={() => setActiveProjectId(p.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate">{p.title}</div>
                    <div className="text-[11px] text-white/50">{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {project && (
            <div className="mt-4 grid gap-2">
              <div className="text-xs text-white/50">Название</div>
              <input
                className={cn(
                  "h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none",
                  "focus:border-[hsl(var(--accent))]/40",
                )}
                value={project.title}
                onChange={(e) => updateProject(project.id, { title: e.target.value })}
              />
              <button
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm",
                  "border border-[hsl(var(--danger))]/35 bg-[hsl(var(--danger))]/10 text-[hsl(var(--danger))]",
                  "hover:bg-[hsl(var(--danger))]/15",
                )}
                onClick={() => deleteProject(project.id)}
              >
                Удалить
              </button>
            </div>
          )}
        </aside>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--panel))]">
              <div className="border-b border-white/10 px-4 py-2 text-sm font-semibold">Код</div>
              <CodeEditor
                value={project?.code ?? ""}
                onChange={(v) => project && updateProject(project.id, { code: v })}
                height={520}
                onRun={run}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
              <div className="text-sm font-semibold">Консоль</div>
              <div className="mt-2 grid gap-1 text-xs text-white/70">
                {(consoleLines.length ? consoleLines : ["—"]).map((l, idx) => (
                  <div key={idx} className="break-words">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Симуляция</div>
                <div className="text-xs text-white/60">
                  {robotStatus} • {robotMode}
                </div>
              </div>
              <div className="mt-3 h-[520px] overflow-hidden rounded-xl border border-white/10">
                <RobotScene />
              </div>
              <div className="mt-3">
                <MotionPad />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4 text-sm text-white/60">
              Доступны команды SDK: connect, setMode, raiseArm, sit, stand, squat, wave, bow, greet, dance, clap, walk, lean, nod, shakeHead.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

