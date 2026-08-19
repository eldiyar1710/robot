import { tracks } from "@/content/tracks";
import { getAllSteps } from "@/content/trackUtils";
import { cn } from "@/lib/utils";
import { stepKey, useTrainingStore } from "@/store/useTrainingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Circle, Sparkles } from "lucide-react";

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

const levelLabel: Record<string, string> = {
  beginner: "Базовый",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export default function Home() {
  const navigate = useNavigate();
  const studentName = useTrainingStore((s) => s.studentName);
  const setStudentName = useTrainingStore((s) => s.setStudentName);
  const setActiveTrackId = useTrainingStore((s) => s.setActiveTrackId);
  const completedStepKeys = useTrainingStore((s) => s.completedStepKeys);
  const resetProgress = useTrainingStore((s) => s.resetProgress);
  const profile = useAuthStore((s) => s.profile);

  const stats = useMemo(() => {
    return tracks.map((t) => {
      const steps = getAllSteps(t);
      const done = steps.filter((s) => completedStepKeys[stepKey(t.id, s.id)]).length;
      const lastStep = [...steps].reverse().find((s) => completedStepKeys[stepKey(t.id, s.id)]);
      return { trackId: t.id, total: steps.length, done, lastStep };
    });
  }, [completedStepKeys]);

  const totalDone = stats.reduce((a, s) => a + s.done, 0);
  const totalSteps = stats.reduce((a, s) => a + s.total, 0);

  function continueTrack(trackId: string) {
    setActiveTrackId(trackId);
    navigate(`/learn/${trackId}`);
  }

  return (
    <div className="grid gap-6">
      <section className="glass relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
              <Sparkles className="h-3.5 w-3.5" />
              Unitree G1 EDU
            </div>
            <div className="font-display mt-3 text-4xl leading-none">Тренажёр гуманоида</div>
            <div className="mt-3 max-w-xl text-sm text-white/60">
              Инструкция → код → симуляция. Личный ID сохранён в Firebase. Перед заданиями нужны базовые знания функций и порядка команд.
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
              <span>
                Прогресс {totalDone}/{totalSteps} ({percent(totalDone, totalSteps)}%)
              </span>
              {profile && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px]">
                  UID {profile.uid.slice(0, 10)}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-2 md:w-72">
            <div className="text-xs text-white/50">Имя на сертификате</div>
            <input
              className="field"
              placeholder="Например: Eldiyar"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <button type="button" className="btn-ghost h-10 text-xs" onClick={() => navigate("/intro")}>
              Ещё раз посмотреть инструкцию
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {tracks.map((t) => {
          const s = stats.find((x) => x.trackId === t.id);
          const p = percent(s?.done ?? 0, s?.total ?? 0);
          const isComplete = (s?.done ?? 0) === (s?.total ?? 0) && (s?.total ?? 0) > 0;
          const baseDone = stats.find((x) => x.trackId === "base");
          const manipDone = stats.find((x) => x.trackId === "manipulation");
          const baseComplete = (baseDone?.done ?? 0) === (baseDone?.total ?? 0) && (baseDone?.total ?? 0) > 0;
          const manipComplete = (manipDone?.done ?? 0) === (manipDone?.total ?? 0) && (manipDone?.total ?? 0) > 0;
          const isLocked =
            (t.id === "manipulation" && !baseComplete) || (t.id === "tricks" && !manipComplete);

          return (
            <div
              key={t.id}
              className={cn(
                "glass p-5 transition hover:border-cyan-400/25",
                isComplete && "border-emerald-400/30",
                isLocked && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-white/40" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/40" />
                    )}
                    <div className="text-lg font-semibold">{t.title}</div>
                  </div>
                  <div className="mt-1 text-sm text-white/60">{t.subtitle}</div>
                  <div className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50">
                    {levelLabel[t.level] ?? t.level}
                  </div>
                </div>
                <div className="text-sm font-medium text-emerald-300">{p}%</div>
              </div>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all" style={{ width: `${p}%` }} />
              </div>

              <div className="mt-2 text-xs text-white/45">
                {s?.done ?? 0}/{s?.total ?? 0} шагов
                {s?.lastStep ? ` • последний: ${s.lastStep.title}` : ""}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="btn-primary h-10" disabled={isLocked} onClick={() => continueTrack(t.id)}>
                  {p > 0 && !isComplete ? "Продолжить" : isComplete ? "Повторить" : "Начать"}
                </button>
                {isComplete && (
                  <button
                    className="btn-ghost h-10 px-4"
                    onClick={() => {
                      setActiveTrackId(t.id);
                      navigate("/certificate");
                    }}
                  >
                    Сертификат
                  </button>
                )}
              </div>

              {isLocked && t.id === "manipulation" && (
                <div className="mt-3 text-xs text-white/45">Сначала завершите трек «База управления»</div>
              )}
              {isLocked && t.id === "tricks" && (
                <div className="mt-3 text-xs text-white/45">Сначала завершите трек «Манипуляции»</div>
              )}
            </div>
          );
        })}
      </section>

      <div className="flex justify-end">
        <button className="btn-ghost h-9 px-3 text-xs text-white/50" onClick={resetProgress}>
          Сбросить весь прогресс
        </button>
      </div>
    </div>
  );
}
