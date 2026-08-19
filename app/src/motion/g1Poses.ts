import type { JointTargets } from "@/motion/joints";

/**
 * Unitree G1 joint convention (same URDF as this app):
 * - hip_pitch < 0  → thigh forward (flexion)  — required to sit/squat
 * - knee      > 0  → shin folds the human way (flexion only; URDF lower ≈ 0)
 * - ankle_pitch < 0 → dorsiflex, keeps the sole on the ground
 * - hip_roll is mirrored: left + / right − = stance wider
 * - shoulder_pitch < 0 → arm forward/up; > 0 → arm back
 * - elbow > 0 → flexion
 * - shoulder_roll mirrored like hip_roll
 */
export const STAND_POSE: JointTargets = {
  left_hip_pitch_joint: -0.14,
  left_hip_roll_joint: 0.05,
  left_hip_yaw_joint: 0,
  left_knee_joint: 0.3,
  left_ankle_pitch_joint: -0.16,
  left_ankle_roll_joint: -0.02,
  right_hip_pitch_joint: -0.14,
  right_hip_roll_joint: -0.05,
  right_hip_yaw_joint: 0,
  right_knee_joint: 0.3,
  right_ankle_pitch_joint: -0.16,
  right_ankle_roll_joint: 0.02,
  waist_yaw_joint: 0,
  left_shoulder_pitch_joint: 0.28,
  left_shoulder_roll_joint: 0.16,
  left_shoulder_yaw_joint: 0,
  left_elbow_joint: 0.86,
  left_wrist_roll_joint: 0,
  right_shoulder_pitch_joint: 0.28,
  right_shoulder_roll_joint: -0.16,
  right_shoulder_yaw_joint: 0,
  right_elbow_joint: 0.86,
  right_wrist_roll_joint: 0,
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const SIT_POSE: JointTargets = {
  ...STAND_POSE,
  left_hip_pitch_joint: -1.08,
  right_hip_pitch_joint: -1.08,
  left_hip_roll_joint: 0.08,
  right_hip_roll_joint: -0.08,
  left_knee_joint: 2.02,
  right_knee_joint: 2.02,
  left_ankle_pitch_joint: -0.78,
  right_ankle_pitch_joint: -0.78,
  left_shoulder_pitch_joint: 0.55,
  right_shoulder_pitch_joint: 0.55,
  left_shoulder_roll_joint: 0.22,
  right_shoulder_roll_joint: -0.22,
  left_elbow_joint: 1.18,
  right_elbow_joint: 1.18,
};

/** Same hip/knee/ankle coupling as sit/squat. amount 0 = stand, 1 = sit. */
export function foldLegs(amount: number, side: "both" | "left" | "right" = "both"): Partial<JointTargets> {
  const hip = mix(STAND_POSE.left_hip_pitch_joint, SIT_POSE.left_hip_pitch_joint, amount);
  const knee = mix(STAND_POSE.left_knee_joint, SIT_POSE.left_knee_joint, amount);
  const ankle = mix(STAND_POSE.left_ankle_pitch_joint, SIT_POSE.left_ankle_pitch_joint, amount);
  const out: Partial<JointTargets> = {};
  if (side !== "right") {
    out.left_hip_pitch_joint = hip;
    out.left_knee_joint = knee;
    out.left_ankle_pitch_joint = ankle;
    out.left_hip_roll_joint = mix(STAND_POSE.left_hip_roll_joint, SIT_POSE.left_hip_roll_joint, amount);
  }
  if (side !== "left") {
    out.right_hip_pitch_joint = hip;
    out.right_knee_joint = knee;
    out.right_ankle_pitch_joint = ankle;
    out.right_hip_roll_joint = mix(STAND_POSE.right_hip_roll_joint, SIT_POSE.right_hip_roll_joint, amount);
  }
  return out;
}

export const SIT_PREP_POSE: JointTargets = {
  ...STAND_POSE,
  ...foldLegs(0.38),
  left_shoulder_pitch_joint: 0.42,
  right_shoulder_pitch_joint: 0.42,
  left_elbow_joint: 1.05,
  right_elbow_joint: 1.05,
};

export const SQUAT_POSE: JointTargets = {
  ...SIT_POSE,
  left_hip_pitch_joint: -1.28,
  right_hip_pitch_joint: -1.28,
  left_knee_joint: 2.22,
  right_knee_joint: 2.22,
  left_ankle_pitch_joint: -0.84,
  right_ankle_pitch_joint: -0.84,
};

export const BOW_POSE: JointTargets = {
  ...STAND_POSE,
  ...foldLegs(0.66),
  left_shoulder_pitch_joint: 0.2,
  right_shoulder_pitch_joint: 0.2,
  left_shoulder_roll_joint: 0.12,
  right_shoulder_roll_joint: -0.12,
  left_elbow_joint: 0.4,
  right_elbow_joint: 0.4,
};

/** Hands at lower chest, elbows in — not a T-pose. */
export const CLAP_OPEN: Partial<JointTargets> = {
  left_shoulder_pitch_joint: -0.12,
  right_shoulder_pitch_joint: -0.12,
  left_shoulder_roll_joint: 0.18,
  right_shoulder_roll_joint: -0.18,
  left_shoulder_yaw_joint: 0.48,
  right_shoulder_yaw_joint: -0.48,
  left_elbow_joint: 1.42,
  right_elbow_joint: 1.42,
  left_wrist_roll_joint: 0.1,
  right_wrist_roll_joint: -0.1,
};

export const CLAP_HIT: Partial<JointTargets> = {
  left_shoulder_pitch_joint: -0.18,
  right_shoulder_pitch_joint: -0.18,
  left_shoulder_roll_joint: 0.1,
  right_shoulder_roll_joint: -0.1,
  left_shoulder_yaw_joint: 0.82,
  right_shoulder_yaw_joint: -0.82,
  left_elbow_joint: 1.62,
  right_elbow_joint: 1.62,
  left_wrist_roll_joint: 0,
  right_wrist_roll_joint: 0,
};

export const OFFER_HAND_RIGHT: Partial<JointTargets> = {
  right_shoulder_pitch_joint: -0.42,
  right_shoulder_roll_joint: -0.08,
  right_shoulder_yaw_joint: 0.12,
  right_elbow_joint: 0.72,
  right_wrist_roll_joint: 0.18,
  left_shoulder_pitch_joint: 0.24,
  left_elbow_joint: 0.82,
};

export function leanPose(direction: "left" | "right"): JointTargets {
  const left = direction === "left";
  return {
    ...STAND_POSE,
    ...(left ? foldLegs(0.58, "left") : foldLegs(0.12, "left")),
    ...(left ? foldLegs(0.12, "right") : foldLegs(0.58, "right")),
    left_hip_roll_joint: left ? 0.16 : 0.02,
    right_hip_roll_joint: left ? -0.02 : -0.16,
    left_ankle_roll_joint: left ? -0.1 : 0.06,
    right_ankle_roll_joint: left ? -0.06 : 0.1,
    waist_yaw_joint: left ? 0.08 : -0.08,
    left_shoulder_roll_joint: left ? 0.28 : 0.12,
    right_shoulder_roll_joint: left ? -0.12 : -0.28,
  };
}

export function armRaised(side: "left" | "right"): Partial<JointTargets> {
  if (side === "left") {
    return {
      left_shoulder_pitch_joint: -1.45,
      left_shoulder_roll_joint: 0.28,
      left_shoulder_yaw_joint: 0.08,
      left_elbow_joint: 0.42,
      left_wrist_roll_joint: 0,
    };
  }
  return {
    right_shoulder_pitch_joint: -1.45,
    right_shoulder_roll_joint: -0.28,
    right_shoulder_yaw_joint: -0.08,
    right_elbow_joint: 0.42,
    right_wrist_roll_joint: 0,
  };
}

export function armDown(side: "left" | "right"): Partial<JointTargets> {
  if (side === "left") {
    return {
      left_shoulder_pitch_joint: baseShoulderPitch,
      left_shoulder_roll_joint: 0.16,
      left_shoulder_yaw_joint: 0,
      left_elbow_joint: 0.86,
      left_wrist_roll_joint: 0,
    };
  }
  return {
    right_shoulder_pitch_joint: baseShoulderPitch,
    right_shoulder_roll_joint: -0.16,
    right_shoulder_yaw_joint: 0,
    right_elbow_joint: 0.86,
    right_wrist_roll_joint: 0,
  };
}

const baseShoulderPitch = STAND_POSE.left_shoulder_pitch_joint;
