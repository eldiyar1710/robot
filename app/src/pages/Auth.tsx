import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useTrainingStore } from "@/store/useTrainingStore";
import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { RobotScene } from "@/components/RobotScene";

export default function Auth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const ready = useAuthStore((s) => s.ready);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setStudentName = useTrainingStore((s) => s.setStudentName);

  if (ready && user) {
    return <Navigate to={profile?.onboardingComplete ? "/" : "/intro"} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "up") {
        await signUp(name, email, password);
        if (name.trim()) setStudentName(name.trim());
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
        setError("Неверный email или пароль.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Этот email уже зарегистрирован. Войдите.");
      } else if (msg.includes("weak-password")) {
        setError("Пароль должен быть не короче 6 символов.");
      } else if (msg.includes("operation-not-allowed")) {
        setError("В Firebase Console включите Email/Password в Authentication.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-5.5rem)] overflow-hidden rounded-3xl border border-white/10 lg:grid-cols-2">
      <div className="relative hidden min-h-[420px] bg-black lg:block">
        <RobotScene />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8">
          <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Unitree G1 EDU</div>
          <div className="font-display mt-2 text-3xl">Humanoid Agent</div>
          <div className="mt-2 max-w-md text-sm text-white/60">
            Тренажёр управления гуманоидом: личный ID, инструкция, затем код и симуляция.
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-[hsl(var(--panel))]/80 p-8 backdrop-blur md:p-12">
        <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">Umitree Trainer</div>
        <h1 className="font-display mt-3 text-4xl leading-none">
          {mode === "in" ? "Вход" : "Регистрация"}
        </h1>
        <p className="mt-3 text-sm text-white/55">
          Авторизация в Firebase. Сохраняется только сессия и ваш личный ID пользователя этого сайта.
        </p>

        <form className="mt-8 grid gap-3" onSubmit={onSubmit}>
          {mode === "up" && (
            <input
              required
              className="field"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            required
            type="email"
            className="field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            minLength={6}
            className="field"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button className="btn-primary h-12" disabled={busy} type="submit">
            {busy ? "…" : mode === "in" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <button
          type="button"
          className={cn("mt-5 text-left text-sm text-white/50 hover:text-white")}
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Нет аккаунта — зарегистрироваться" : "Уже есть аккаунт — войти"}
        </button>
      </div>
    </div>
  );
}
