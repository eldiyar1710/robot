import { Link, NavLink } from "react-router-dom";
import { GraduationCap, SquareTerminal, Award, Home, LogOut, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
    "border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]",
    isActive && "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  );

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logOut = useAuthStore((s) => s.logOut);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <div className="font-display text-xl leading-none">Umitree G1</div>
            <div className="hidden text-xs text-white/45 sm:block">Humanoid Trainer</div>
          </Link>

          {user && (
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/" className={navItemClass} end>
                <Home className="h-4 w-4" />
                Старт
              </NavLink>
              <NavLink to="/intro" className={navItemClass}>
                <BookOpen className="h-4 w-4" />
                Инструкция
              </NavLink>
              <NavLink to="/learn/base" className={navItemClass}>
                <GraduationCap className="h-4 w-4" />
                Обучение
              </NavLink>
              <NavLink to="/sandbox" className={navItemClass}>
                <SquareTerminal className="h-4 w-4" />
                Песочница
              </NavLink>
              <NavLink to="/certificate" className={navItemClass}>
                <Award className="h-4 w-4" />
                Сертификат
              </NavLink>
            </nav>
          )}

          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <div className="max-w-[180px] truncate rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/45" title={user.uid}>
                ID {user.uid.slice(0, 8)}
              </div>
              <button type="button" className="btn-ghost h-9 gap-2 px-3 text-xs" onClick={() => void logOut()}>
                <LogOut className="h-3.5 w-3.5" />
                {profile?.displayName ?? "Выйти"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
