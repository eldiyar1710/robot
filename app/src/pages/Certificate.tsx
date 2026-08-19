import { tracks } from "@/content/tracks";
import { getAllSteps, getTrackById } from "@/content/trackUtils";
import { cn } from "@/lib/utils";
import { stepKey, useTrainingStore } from "@/store/useTrainingStore";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

function drawCertificate({
  studentName,
  trackTitle,
  issuedAt,
  certId,
}: {
  studentName: string;
  trackTitle: string;
  issuedAt: string;
  certId: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#0b0d10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "rgba(34,197,94,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

  ctx.fillStyle = "rgba(34,197,94,0.95)";
  ctx.fillRect(80, 110, 180, 6);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 60px 'Fraunces', serif";
  ctx.fillText("Certificate", 80, 210);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 22px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Umitree G1 Trainer", 80, 248);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 56px 'IBM Plex Sans', sans-serif";
  ctx.fillText(studentName || "Student", 80, 360);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 24px 'IBM Plex Sans', sans-serif";
  ctx.fillText(`Track: ${trackTitle}`, 80, 415);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "500 18px 'IBM Plex Sans', sans-serif";
  ctx.fillText(`Issued at: ${issuedAt}`, 80, 455);
  ctx.fillText(`ID: ${certId}`, 80, 485);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "400 14px 'IBM Plex Mono', monospace";
  ctx.fillText("This certificate is generated locally in your browser.", 80, canvas.height - 90);

  return canvas;
}

export default function Certificate() {
  const studentName = useTrainingStore((s) => s.studentName);
  const activeTrackId = useTrainingStore((s) => s.activeTrackId);
  const setActiveTrackId = useTrainingStore((s) => s.setActiveTrackId);
  const completedStepKeys = useTrainingStore((s) => s.completedStepKeys);

  const [selectedTrackId, setSelectedTrackId] = useState(activeTrackId);

  const track = useMemo(() => getTrackById(selectedTrackId) ?? tracks[0], [selectedTrackId]);
  const steps = useMemo(() => (track ? getAllSteps(track) : []), [track]);
  const done = useMemo(
    () => steps.filter((s) => completedStepKeys[stepKey(track?.id ?? "base", s.id)]).length,
    [completedStepKeys, steps, track?.id],
  );
  const isDone = steps.length > 0 && done === steps.length;

  const trackStatuses = useMemo(() => {
    return tracks.map((t) => {
      const tSteps = getAllSteps(t);
      const tDone = tSteps.filter((s) => completedStepKeys[stepKey(t.id, s.id)]).length;
      return { id: t.id, title: t.title, done: tDone, total: tSteps.length, complete: tDone === tSteps.length && tSteps.length > 0 };
    });
  }, [completedStepKeys]);

  const [isDownloading, setIsDownloading] = useState(false);

  const issuedAt = new Date().toLocaleDateString();
  const certId = useMemo(() => `umitree-${selectedTrackId}-${Date.now().toString(36)}`, [selectedTrackId]);

  async function downloadPng() {
    if (!track) return;
    setIsDownloading(true);
    try {
      const canvas = drawCertificate({
        studentName: studentName.trim(),
        trackTitle: track.title,
        issuedAt,
        certId,
      });
      if (!canvas) return;
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${selectedTrackId}-${certId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  function printAsPdf() {
    if (!track) return;
    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Certificate</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: #0b0d10; color: #fff; }
      .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .card { width: 1120px; max-width: 100%; border: 2px solid rgba(255,255,255,0.12); padding: 42px; box-sizing: border-box; }
      .accent { height: 6px; width: 180px; background: rgba(34,197,94,0.95); margin-bottom: 28px; }
      h1 { margin: 0 0 6px; font-size: 56px; }
      .sub { opacity: 0.7; margin-bottom: 44px; }
      .name { font-size: 52px; font-weight: 700; margin: 0 0 14px; }
      .meta { opacity: 0.72; font-size: 18px; line-height: 1.6; }
      @media print { body { background: #fff; color: #000; } .card { border-color: #000; } .accent { background: #16a34a; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="accent"></div>
        <h1>Certificate</h1>
        <div class="sub">Umitree G1 Trainer</div>
        <div class="name">${escapeHtml(studentName || "Student")}</div>
        <div class="meta">
          Track: ${escapeHtml(track.title || "")}<br/>
          Issued at: ${issuedAt}<br/>
          ID: ${certId}
        </div>
      </div>
    </div>
    <script>window.print();</script>
  </body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Сертификат</div>
          <div className="text-sm text-white/60">Выберите завершённый трек для генерации</div>
        </div>
        <Link
          to={`/learn/${track?.id ?? "base"}`}
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-sm",
            "border border-white/10 bg-white/0 hover:bg-white/5",
          )}
          onClick={() => setActiveTrackId(selectedTrackId)}
        >
          Перейти к обучению
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {trackStatuses.map((t) => (
          <button
            key={t.id}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm transition",
              selectedTrackId === t.id ? "border-[hsl(var(--accent))]/40 bg-white/10" : "border-white/10 hover:bg-white/5",
              !t.complete && "opacity-50",
            )}
            disabled={!t.complete}
            onClick={() => setSelectedTrackId(t.id)}
          >
            <div className="font-medium">{t.title}</div>
            <div className="mt-1 text-xs text-white/50">
              {t.done}/{t.total} • {t.complete ? "Готов" : "Не завершён"}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[hsl(var(--panel))] p-5">
        {!isDone ? (
          <div className="grid gap-2">
            <div className="text-sm text-white/70">
              Сертификат для «{track?.title}» станет доступен после завершения всех шагов.
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-[hsl(var(--accent))]"
                style={{ width: `${steps.length ? Math.round((done / steps.length) * 100) : 0}%` }}
              />
            </div>
            <div className="text-xs text-white/50">
              Прогресс: {done}/{steps.length}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <div className="h-1 w-44 rounded-full bg-[hsl(var(--accent))]" />
              <div className="mt-5 font-display text-4xl">Certificate</div>
              <div className="mt-1 text-sm text-white/60">Umitree G1 Trainer</div>
              <div className="mt-8 text-3xl font-semibold">{studentName || "Student"}</div>
              <div className="mt-3 text-sm text-white/70">Track: {track?.title}</div>
              <div className="mt-1 text-sm text-white/60">
                Issued at: {issuedAt} • ID: {certId}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className={cn(
                  "inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium",
                  "bg-[hsl(var(--accent))] text-black hover:opacity-90 disabled:opacity-40",
                )}
                disabled={isDownloading}
                onClick={downloadPng}
              >
                Скачать PNG
              </button>
              <button
                className={cn(
                  "inline-flex h-10 items-center rounded-xl px-4 text-sm",
                  "border border-white/10 bg-white/0 hover:bg-white/5",
                )}
                onClick={printAsPdf}
              >
                Печать (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
