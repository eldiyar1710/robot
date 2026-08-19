import type { LessonStep, Track } from "@/content/tracks";
import { tracks } from "@/content/tracks";

export function getTrackById(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId);
}

export function getAllSteps(track: Track): LessonStep[] {
  return track.lessons.flatMap((l) => l.steps);
}

export function getStepById(track: Track, stepId: string): LessonStep | undefined {
  return getAllSteps(track).find((s) => s.id === stepId);
}

export function getNextStepId(track: Track, stepId: string): string | undefined {
  const steps = getAllSteps(track);
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return undefined;
  return steps[idx + 1]?.id;
}

export function getPrevStepId(track: Track, stepId: string): string | undefined {
  const steps = getAllSteps(track);
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx <= 0) return undefined;
  return steps[idx - 1]?.id;
}

