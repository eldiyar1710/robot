import { cn } from "@/lib/utils";
import { useRobotStore } from "@/store/useRobotStore";
import { useState } from "react";

const ACTIONS: { id: string; label: string; run: () => Promise<void> }[] = [
  { id: "stand", label: "Стойка", run: () => useRobotStore.getState().stand() },
  { id: "sit", label: "Сесть", run: () => useRobotStore.getState().sit() },
  { id: "squat", label: "Присед", run: () => useRobotStore.getState().squat() },
  { id: "bow", label: "Поклон", run: () => useRobotStore.getState().bow() },
  { id: "waveL", label: "Привет L", run: () => useRobotStore.getState().wave("left") },
  { id: "waveR", label: "Привет R", run: () => useRobotStore.getState().wave("right") },
  { id: "arms", label: "Руки вверх", run: () => useRobotStore.getState().bothArmsUp() },
  { id: "clap", label: "Хлопок", run: () => useRobotStore.getState().handsClap(3) },
  { id: "walk", label: "Шаг", run: () => useRobotStore.getState().walkInPlace(6) },
  { id: "leanL", label: "Наклон L", run: () => useRobotStore.getState().leanSide("left") },
  { id: "greet", label: "Приветствие", run: () => useRobotStore.getState().greet() },
  { id: "dance", label: "Танец", run: () => useRobotStore.getState().dance(6) },
];

export function MotionPad() {
  const [busy, setBusy] = useState<string | null>(null);
  const status = useRobotStore((s) => s.status);

  async function run(id: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(id);
    try {
      const robot = useRobotStore.getState();
      if (robot.status !== "CONNECTED") await robot.connect();
      if (robot.mode === "idle") await robot.setMode("manual");
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Манёвры G1</span>
        <span>{status === "CONNECTED" ? "live" : "standby"}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={!!busy}
            onClick={() => run(a.id, a.run)}
            className={cn(
              "h-9 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-[11px] font-medium",
              "hover:bg-white/[0.08] disabled:opacity-40",
              busy === a.id && "border-[hsl(var(--accent))]/50 bg-[hsl(var(--accent))]/15",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
