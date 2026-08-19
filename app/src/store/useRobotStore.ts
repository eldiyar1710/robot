import { create } from "zustand";
import { clampTargets } from "@/motion/g1Limits";
import {
  armDown,
  armRaised,
  BOW_POSE,
  CLAP_HIT,
  CLAP_OPEN,
  foldLegs,
  leanPose,
  OFFER_HAND_RIGHT,
  SIT_POSE,
  SIT_PREP_POSE,
  SQUAT_POSE,
  STAND_POSE,
} from "@/motion/g1Poses";
import { JOINT_NAMES, type JointName, type JointTargets } from "@/motion/joints";

export type RobotMode = "idle" | "manual" | "auto";
export type Side = "left" | "right";

export { JOINT_NAMES };
export type { JointName, JointTargets };

export const DEFAULT_JOINTS: JointTargets = { ...STAND_POSE };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const deg = (d: number) => (d * Math.PI) / 180;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

type RobotState = {
  status: "DISCONNECTED" | "CONNECTED";
  mode: RobotMode;
  targets: JointTargets;
  motionId: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setMode: (mode: RobotMode) => Promise<void>;
  setJoint: (name: JointName, value: number, durationMs?: number) => Promise<void>;
  setJoints: (values: Partial<JointTargets>, durationMs?: number) => Promise<void>;
  raiseArm: (side: Side) => Promise<void>;
  lowerArm: (side: Side) => Promise<void>;
  bothArmsUp: () => Promise<void>;
  bothArmsDown: () => Promise<void>;
  wave: (side: Side, times?: number) => Promise<void>;
  sit: () => Promise<void>;
  stand: () => Promise<void>;
  squat: () => Promise<void>;
  rotateWaist: (degrees: number) => Promise<void>;
  leanSide: (direction: Side) => Promise<void>;
  bow: () => Promise<void>;
  nod: (times?: number) => Promise<void>;
  shakeHead: (times?: number) => Promise<void>;
  reachForward: (side: Side) => Promise<void>;
  handsClap: (times?: number) => Promise<void>;
  greet: () => Promise<void>;
  dance: (seconds?: number) => Promise<void>;
  walkInPlace: (steps?: number) => Promise<void>;
  reset: () => void;
};

export const useRobotStore = create<RobotState>((set, get) => {
  const begin = () => {
    const id = get().motionId + 1;
    set({ motionId: id });
    return () => get().motionId !== id;
  };

  const apply = async (values: Partial<JointTargets>, durationMs: number) => {
    const id = get().motionId;
    const start = { ...get().targets };
    const end = clampTargets({ ...start, ...values });
    if (durationMs <= 16) {
      set({ targets: end });
      return;
    }
    const t0 = performance.now();
    for (;;) {
      if (get().motionId !== id) return;
      const u = Math.min(1, (performance.now() - t0) / durationMs);
      const e = easeInOutCubic(u);
      const cur = { ...start };
      for (const name of JOINT_NAMES) {
        cur[name] = start[name] + (end[name] - start[name]) * e;
      }
      set({ targets: cur });
      if (u >= 1) break;
      await sleep(16);
    }
    if (get().motionId === id) set({ targets: end });
  };

  const applyPose = async (pose: JointTargets, durationMs: number) => {
    await apply(pose, durationMs);
  };

  return {
    status: "DISCONNECTED",
    mode: "idle",
    targets: { ...DEFAULT_JOINTS },
    motionId: 0,

    connect: async () => {
      await sleep(220);
      set({ status: "CONNECTED" });
    },

    disconnect: async () => {
      await sleep(160);
      set({ status: "DISCONNECTED" });
    },

    setMode: async (mode) => {
      await sleep(160);
      set({ mode });
    },

    setJoint: async (name, value, durationMs = 380) => {
      await apply({ [name]: value }, durationMs);
    },

    setJoints: async (values, durationMs = 480) => {
      await apply(values, durationMs);
    },

    raiseArm: async (side) => {
      const cancelled = begin();
      await apply(armRaised(side), 380);
      if (cancelled()) return;
    },

    lowerArm: async (side) => {
      const cancelled = begin();
      await apply(armDown(side), 300);
      if (cancelled()) return;
    },

    bothArmsUp: async () => {
      const cancelled = begin();
      await apply({ ...armRaised("left"), ...armRaised("right") }, 400);
      if (cancelled()) return;
    },

    bothArmsDown: async () => {
      const cancelled = begin();
      await apply({ ...armDown("left"), ...armDown("right") }, 320);
      if (cancelled()) return;
    },

    wave: async (side, times = 3) => {
      const cancelled = begin();
      await apply(
        side === "left"
          ? {
              left_shoulder_pitch_joint: -1.35,
              left_shoulder_roll_joint: 0.42,
              left_shoulder_yaw_joint: 0.15,
              left_elbow_joint: 0.85,
            }
          : {
              right_shoulder_pitch_joint: -1.35,
              right_shoulder_roll_joint: -0.42,
              right_shoulder_yaw_joint: -0.15,
              right_elbow_joint: 0.85,
            },
        320,
      );
      if (cancelled()) return;
      for (let i = 0; i < times; i++) {
        await apply(
          side === "left" ? { left_shoulder_yaw_joint: 0.55 } : { right_shoulder_yaw_joint: -0.55 },
          120,
        );
        if (cancelled()) return;
        await apply(
          side === "left" ? { left_shoulder_yaw_joint: -0.12 } : { right_shoulder_yaw_joint: 0.12 },
          120,
        );
        if (cancelled()) return;
      }
      await apply(armDown(side), 260);
    },

    sit: async () => {
      const cancelled = begin();
      await applyPose(SIT_PREP_POSE, 260);
      if (cancelled()) return;
      await applyPose(SIT_POSE, 420);
    },

    stand: async () => {
      const cancelled = begin();
      const t = get().targets;
      const recovering = t.left_knee_joint > 1.2;
      if (recovering) {
        await applyPose(SIT_PREP_POSE, 280);
        if (cancelled()) return;
      }
      await applyPose(STAND_POSE, 380);
    },

    squat: async () => {
      const cancelled = begin();
      await applyPose(SIT_PREP_POSE, 220);
      if (cancelled()) return;
      await applyPose(SQUAT_POSE, 340);
      if (cancelled()) return;
      await applyPose(SIT_PREP_POSE, 240);
      if (cancelled()) return;
      await applyPose(STAND_POSE, 340);
    },

    rotateWaist: async (degrees) => {
      await apply({ waist_yaw_joint: deg(degrees) }, 280);
    },

    leanSide: async (direction) => {
      const cancelled = begin();
      await applyPose(leanPose(direction), 480);
      if (cancelled()) return;
      await sleep(180);
      if (cancelled()) return;
      await applyPose(STAND_POSE, 420);
    },

    bow: async () => {
      const cancelled = begin();
      await applyPose(BOW_POSE, 520);
      if (cancelled()) return;
      await sleep(160);
      if (cancelled()) return;
      await applyPose(STAND_POSE, 480);
    },

    nod: async (times = 2) => {
      const cancelled = begin();
      for (let i = 0; i < times; i++) {
        await apply(foldLegs(0.22), 220);
        if (cancelled()) return;
        await apply(foldLegs(0), 220);
        if (cancelled()) return;
      }
    },

    shakeHead: async (times = 2) => {
      const cancelled = begin();
      for (let i = 0; i < times; i++) {
        await apply({ waist_yaw_joint: deg(-22) }, 160);
        if (cancelled()) return;
        await apply({ waist_yaw_joint: deg(22) }, 160);
        if (cancelled()) return;
      }
      await apply({ waist_yaw_joint: 0 }, 180);
    },

    reachForward: async (side) => {
      const cancelled = begin();
      if (side === "left") {
        await apply(
          {
            left_shoulder_pitch_joint: -0.95,
            left_shoulder_roll_joint: 0.1,
            left_shoulder_yaw_joint: -0.12,
            left_elbow_joint: 0.32,
            left_wrist_roll_joint: 0.18,
          },
          320,
        );
      } else {
        await apply(OFFER_HAND_RIGHT, 320);
      }
      if (cancelled()) return;
    },

    handsClap: async (times = 3) => {
      const cancelled = begin();
      await apply(CLAP_OPEN, 380);
      if (cancelled()) return;
      for (let i = 0; i < times; i++) {
        await apply(CLAP_HIT, 160);
        if (cancelled()) return;
        await apply(CLAP_OPEN, 180);
        if (cancelled()) return;
      }
      await applyPose(STAND_POSE, 360);
    },

    greet: async () => {
      const cancelled = begin();
      await applyPose(BOW_POSE, 480);
      if (cancelled()) return;
      await sleep(120);
      if (cancelled()) return;
      await applyPose(STAND_POSE, 420);
      if (cancelled()) return;
      await apply({ ...STAND_POSE, ...OFFER_HAND_RIGHT }, 360);
      if (cancelled()) return;
      for (let i = 0; i < 2; i++) {
        await apply({ right_elbow_joint: 0.55, right_shoulder_yaw_joint: 0.22 }, 140);
        if (cancelled()) return;
        await apply({ right_elbow_joint: 0.82, right_shoulder_yaw_joint: 0.06 }, 140);
        if (cancelled()) return;
      }
      await applyPose(STAND_POSE, 360);
    },

    dance: async (seconds = 5) => {
      const cancelled = begin();
      const endAt = Date.now() + seconds * 1000;
      let idx = 0;
      while (Date.now() < endAt) {
        if (cancelled()) return;
        const seq = idx % 4;
        if (seq === 0) {
          await apply(
            {
              left_shoulder_pitch_joint: -1.05,
              right_shoulder_pitch_joint: -0.35,
              left_elbow_joint: 0.95,
              right_elbow_joint: 0.55,
              waist_yaw_joint: -0.28,
              left_hip_roll_joint: 0.12,
              right_hip_roll_joint: 0.06,
              left_knee_joint: 0.42,
              right_knee_joint: 0.22,
              left_hip_pitch_joint: -0.22,
              right_hip_pitch_joint: -0.08,
            },
            340,
          );
        } else if (seq === 1) {
          await apply(
            {
              left_shoulder_pitch_joint: -0.35,
              right_shoulder_pitch_joint: -1.05,
              left_elbow_joint: 0.55,
              right_elbow_joint: 0.95,
              waist_yaw_joint: 0.28,
              left_hip_roll_joint: -0.06,
              right_hip_roll_joint: -0.12,
              left_knee_joint: 0.22,
              right_knee_joint: 0.42,
              left_hip_pitch_joint: -0.08,
              right_hip_pitch_joint: -0.22,
            },
            340,
          );
        } else if (seq === 2) {
          await apply(
            {
              ...armRaised("left"),
              ...armRaised("right"),
              waist_yaw_joint: 0,
              left_hip_roll_joint: STAND_POSE.left_hip_roll_joint,
              right_hip_roll_joint: STAND_POSE.right_hip_roll_joint,
            },
            340,
          );
        } else {
          await apply(
            {
              left_shoulder_pitch_joint: -0.25,
              right_shoulder_pitch_joint: -0.25,
              left_elbow_joint: 1.25,
              right_elbow_joint: 1.25,
              waist_yaw_joint: 0,
            },
            340,
          );
        }
        idx++;
      }
      if (cancelled()) return;
      await applyPose(STAND_POSE, 560);
    },

    walkInPlace: async (steps = 6) => {
      const cancelled = begin();
      for (let i = 0; i < steps; i++) {
        if (cancelled()) return;
        const leftSwing = i % 2 === 0;
        await apply(
          {
            left_hip_pitch_joint: leftSwing ? -0.48 : 0.12,
            left_knee_joint: leftSwing ? 0.78 : 0.22,
            left_ankle_pitch_joint: leftSwing ? -0.28 : -0.12,
            right_hip_pitch_joint: leftSwing ? 0.12 : -0.48,
            right_knee_joint: leftSwing ? 0.22 : 0.78,
            right_ankle_pitch_joint: leftSwing ? -0.12 : -0.28,
            left_shoulder_pitch_joint: leftSwing ? 0.12 : 0.42,
            right_shoulder_pitch_joint: leftSwing ? 0.42 : 0.12,
            left_elbow_joint: 0.9,
            right_elbow_joint: 0.9,
            waist_yaw_joint: leftSwing ? 0.08 : -0.08,
          },
          340,
        );
      }
      if (cancelled()) return;
      await applyPose(STAND_POSE, 560);
    },

    reset: () =>
      set({
        status: "DISCONNECTED",
        mode: "idle",
        targets: { ...DEFAULT_JOINTS },
        motionId: get().motionId + 1,
      }),
  };
});
