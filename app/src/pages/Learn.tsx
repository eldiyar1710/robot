import { CodeEditor } from "@/components/CodeEditor";
import { MotionPad } from "@/components/MotionPad";
import { RobotScene } from "@/components/RobotScene";
import { LEARN_CONTEXT } from "@/content/g1Guide";
import { getAllSteps, getNextStepId, getStepById, getTrackById } from "@/content/trackUtils";
import { cn } from "@/lib/utils";
import { useRobotStore } from "@/store/useRobotStore";
import { stepKey, useTrainingStore } from "@/store/useTrainingStore";
import { callsToHumanList, parseRobotCalls, playCalls, validateRequirements } from "@/utils/robotProgram";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Learn() {
  const params = useParams();
  const navigate = useNavigate();
  const trackId = params.trackId ?? "base";
  const stepIdParam = params.stepId;

  const track = useMemo(() => getTrackById(trackId), [trackId]);
  const steps = useMemo(() => (track ? getAllSteps(track) : []), [track]);

  const completedStepKeys = useTrainingStore((s) => s.completedStepKeys);
  const completeStep = useTrainingStore((s) => s.completeStep);
  const draftCodeByStepKey = useTrainingStore((s) => s.draftCodeByStepKey);
  const setDraftCode = useTrainingStore((s) => s.setDraftCode);
  const setActiveTrackId = useTrainingStore((s) => s.setActiveTrackId);
  const studentName = useTrainingStore((s) => s.studentName);

  const robotStatus = useRobotStore((s) => s.status);
  const robotMode = useRobotStore((s) => s.mode);
  const robotTargets = useRobotStore((s) => s.targets);
  const robotReset = useRobotStore((s) => s.reset);
  const robotConnect = useRobotStore((s) => s.connect);
  const robotSetMode = useRobotStore((s) => s.setMode);
  const robotRaiseArm = useRobotStore((s) => s.raiseArm);
  const robotSit = useRobotStore((s) => s.sit);
  const robotStand = useRobotStore((s) => s.stand);

  const unlocked = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (i === 0) out[s.id] = true;
      else {
        const prev = steps[i - 1];
        out[s.id] = !!completedStepKeys[stepKey(trackId, prev.id)];
      }
    }
    return out;
  }, [completedStepKeys, steps, trackId]);

  const defaultStepId = useMemo(() => {
    for (const s of steps) {
      if (!unlocked[s.id]) break;
      if (!completedStepKeys[stepKey(trackId, s.id)]) return s.id;
    }
    return steps[0]?.id;
  }, [completedStepKeys, steps, trackId, unlocked]);

  useEffect(() => {
    if (!track) {
      navigate("/", { replace: true });
      return;
    }
    setActiveTrackId(trackId);
    if (!defaultStepId) return;
    if (!stepIdParam) navigate(`/learn/${trackId}/${defaultStepId}`, { replace: true });
  }, [defaultStepId, navigate, setActiveTrackId, stepIdParam, track, trackId]);

  const step = useMemo(() => {
    if (!track) return undefined;
    const candidate = stepIdParam ? getStepById(track, stepIdParam) : undefined;
    return candidate ?? (defaultStepId ? getStepById(track, defaultStepId) : undefined);
  }, [defaultStepId, stepIdParam, track]);

  useEffect(() => {
    if (!track || !step) return;
    if (stepIdParam && step.id !== stepIdParam) {
      navigate(`/learn/${trackId}/${step.id}`, { replace: true });
    }
  }, [navigate, step, stepIdParam, track, trackId]);

  const key = step ? stepKey(trackId, step.id) : "";
  const draft = key ? draftCodeByStepKey[key] : undefined;
  const code = step ? (typeof draft === "string" ? draft : step.starterCode) : "";

  useEffect(() => {
    if (!step) return;
    if (typeof draft === "string") return;
    setDraftCode(stepKey(trackId, step.id), step.starterCode);
  }, [draft, setDraftCode, step, trackId]);

  const [isRunning, setIsRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);

  const isCompleted = step ? !!completedStepKeys[stepKey(trackId, step.id)] : false;
  const nextStepId = track && step ? getNextStepId(track, step.id) : undefined;
  const doneCount = steps.filter((s) => completedStepKeys[stepKey(trackId, s.id)]).length;
  const progressPct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const [mobileTab, setMobileTab] = useState<"task" | "sim">("task");

  async function runWith(sourceCode: string, markComplete: boolean) {
    if (!step) return;
    setIsRunning(true);
    setErrors([]);
    setConsoleLines([]);

    try {
      robotReset();
      const calls = parseRobotCalls(sourceCode);
      setConsoleLines((l) => [...l, `Команды: ${calls.length ? callsToHumanList(calls) : "—"}`]);
      const v = validateRequirements(calls, step.requirements);
      setErrors(v.errors);

      await playCalls(calls, {
        connect: robotConnect,
        setMode: robotSetMode,
        raiseArm: robotRaiseArm,
        sit: robotSit,
        stand: robotStand,
      });

      if (v.ok && markComplete) {
        completeStep(stepKey(trackId, step.id));
        setConsoleLines((l) => [...l, "Шаг засчитан (OK)"]);
      } else if (v.ok) {
        setConsoleLines((l) => [...l, "Демо выполнено (OK)"]);
      } else {
        setConsoleLines((l) => [...l, "Шаг не засчитан (FAIL)"]);
      }
    } catch (e) {
      setConsoleLines((l) => [...l, `Ошибка выполнения: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setIsRunning(false);
    }
  }

  if (!track || !step) return null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold">{track.title}</div>
          <div className="text-sm text-white/60">
            {studentName ? `Студент: ${studentName}` : "Имя не задано"} • {step.title}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium",
              "bg-[hsl(var(--accent))] text-black hover:opacity-90 disabled:opacity-40",
            )}
            disabled={isRunning}
            onClick={() => runWith(code, true)}
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
              "border border-white/10 bg-white/0 hover:bg-white/5 disabled:opacity-40",
            )}
            disabled={isRunning}
            onClick={() => runWith(step.solutionCode, false)}
          >
            Демо
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 text-sm",
              "border border-white/10 bg-white/0 hover:bg-white/5 disabled:opacity-40",
            )}
            disabled={!isCompleted || !nextStepId}
            onClick={() => nextStepId && navigate(`/learn/${trackId}/${nextStepId}`)}
          >
            Следующий
          </button>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[hsl(var(--accent))] transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex gap-2 lg:hidden">
        <button
          className={cn(
            "flex-1 rounded-xl border px-3 py-2 text-sm",
            mobileTab === "task" ? "border-[hsl(var(--accent))]/40 bg-white/10" : "border-white/10",
          )}
          onClick={() => setMobileTab("task")}
        >
          Шаги / Код
        </button>
        <button
          className={cn(
            "flex-1 rounded-xl border px-3 py-2 text-sm",
            mobileTab === "sim" ? "border-[hsl(var(--accent))]/40 bg-white/10" : "border-white/10",
          )}
          onClick={() => setMobileTab("sim")}
        >
          Симуляция
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
          <div className="text-sm font-semibold">Шаги ({doneCount}/{steps.length})</div>
          <div className="mt-3 grid gap-2">
            {steps.map((s, i) => {
              const isDone = !!completedStepKeys[stepKey(trackId, s.id)];
              const isUnlocked = !!unlocked[s.id];
              const isActive = s.id === step.id;
              const label = isDone ? "Done" : isUnlocked ? "Open" : "Locked";
              return (
                <button
                  key={s.id}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                    "border-white/10 bg-white/0 hover:bg-white/5",
                    isActive && "bg-white/10",
                    !isUnlocked && "opacity-50 hover:bg-white/0",
                  )}
                  disabled={!isUnlocked}
                  onClick={() => navigate(`/learn/${trackId}/${s.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="line-clamp-2">{s.title}</div>
                    <div className="text-[11px] text-white/50">
                      {i + 1} • {label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={cn("grid gap-4", mobileTab !== "task" && "hidden lg:grid")}>
            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
              <div className="text-sm font-semibold">Задача</div>
              <div className="mt-2 grid gap-1.5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-[12px] leading-relaxed text-white/65">
                {LEARN_CONTEXT.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-3 text-sm text-white/70">{step.goal}</div>
              <ul className="mt-3 grid list-disc gap-1 pl-5 text-sm text-white/70">
                {step.instructions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              {step.hint && (
                <div className="mt-4 rounded-xl border border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/5 p-3 text-sm text-white/75">
                  <span className="font-medium text-[hsl(var(--accent))]">Подсказка: </span>
                  {step.hint}
                </div>
              )}

              {errors.length > 0 && (
                <div className="mt-4 rounded-xl border border-[hsl(var(--danger))]/35 bg-[hsl(var(--danger))]/10 p-3">
                  <div className="text-sm font-semibold text-[hsl(var(--danger))]">Ошибки проверки</div>
                  <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-white/80">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--panel))]">
              <div className="border-b border-white/10 px-4 py-2 text-sm font-semibold">Код</div>
              <CodeEditor
                value={code}
                onChange={(v) => setDraftCode(key, v)}
                height={420}
                onRun={() => runWith(code, true)}
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

          <div className={cn("grid gap-4", mobileTab !== "sim" && "hidden lg:grid")}>
            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Симуляция G1</div>
                <div className="text-xs text-white/60">
                  {robotStatus} • {robotMode}
                </div>
              </div>
              <div className="mt-3 h-[420px] overflow-hidden rounded-xl border border-white/10">
                <RobotScene />
              </div>
              <div className="mt-3">
                <MotionPad />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  L-Arm: {robotTargets.left_shoulder_pitch_joint.toFixed(2)}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  R-Arm: {robotTargets.right_shoulder_pitch_joint.toFixed(2)}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  Sit: {robotTargets.left_hip_pitch_joint.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-4 text-sm text-white/60">
              Команды SDK: robot.connect/setMode/raiseArm/sit/stand, а также squat, wave, bow, greet, dance, clap, walk.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
