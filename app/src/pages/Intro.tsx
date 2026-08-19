import { RobotScene } from "@/components/RobotScene";
import { G1_OFFICIAL, INTRO_STEPS } from "@/content/g1Guide";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Intro() {
  const [i, setI] = useState(0);
  const step = INTRO_STEPS[i];
  const last = i === INTRO_STEPS.length - 1;
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const profile = useAuthStore((s) => s.profile);
  const setStudentName = useTrainingStore((s) => s.setStudentName);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      if (profile?.displayName) setStudentName(profile.displayName);
      await completeOnboarding();
      navigate("/learn/base", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black">
        <div className="h-[420px] lg:h-[640px]">
          <RobotScene />
        </div>
      </section>

      <section className="flex flex-col rounded-3xl border border-white/10 bg-[hsl(var(--panel))]/80 p-6 backdrop-blur md:p-8">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
          <span>{step.kicker}</span>
          <span className="text-white/35">
            {i + 1} / {INTRO_STEPS.length}
          </span>
        </div>
        <h1 className="font-display mt-4 text-4xl leading-none">{step.title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">{step.body}</p>
        <ul className="mt-5 grid gap-2">
          {step.bullets.map((b) => (
            <li key={b} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
              {b}
            </li>
          ))}
        </ul>

        <a
          className="mt-5 text-xs text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70"
          href={G1_OFFICIAL.source}
          target="_blank"
          rel="noreferrer"
        >
          Официальная страница Unitree G1
        </a>

        <div className="mt-auto flex flex-wrap gap-2 pt-8">
          {INTRO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setI(idx)}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-white/10",
                idx <= i && "bg-gradient-to-r from-emerald-400 to-cyan-400",
              )}
              aria-label={s.title}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {i > 0 && (
            <button type="button" className="btn-ghost h-12 px-5" onClick={() => setI(i - 1)}>
              Назад
            </button>
          )}
          {!last ? (
            <button type="button" className="btn-primary h-12 flex-1" onClick={() => setI(i + 1)}>
              Дальше
            </button>
          ) : (
            <button type="button" className="btn-primary h-12 flex-1" disabled={busy} onClick={finish}>
              {busy ? "…" : "Понял, начать обучение"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
