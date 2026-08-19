import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  if (!ready) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="text-sm text-white/50">Загрузка сессии…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user && !profile) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="text-sm text-white/50">Загрузка профиля…</div>
      </div>
    );
  }

  if (profile && !profile.onboardingComplete && !location.pathname.startsWith("/intro")) {
    return <Navigate to="/intro" replace />;
  }

  return <>{children}</>;
}
