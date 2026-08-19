import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import Learn from "@/pages/Learn";
import Sandbox from "@/pages/Sandbox";
import Certificate from "@/pages/Certificate";
import Auth from "@/pages/Auth";
import Intro from "@/pages/Intro";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { startAuthListener } from "@/store/useAuthStore";

startAuthListener();

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/intro"
            element={
              <AuthGate>
                <Intro />
              </AuthGate>
            }
          />
          <Route
            path="/"
            element={
              <AuthGate>
                <Home />
              </AuthGate>
            }
          />
          <Route
            path="/learn/:trackId"
            element={
              <AuthGate>
                <Learn />
              </AuthGate>
            }
          />
          <Route
            path="/learn/:trackId/:stepId"
            element={
              <AuthGate>
                <Learn />
              </AuthGate>
            }
          />
          <Route
            path="/sandbox"
            element={
              <AuthGate>
                <Sandbox />
              </AuthGate>
            }
          />
          <Route
            path="/certificate"
            element={
              <AuthGate>
                <Certificate />
              </AuthGate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
