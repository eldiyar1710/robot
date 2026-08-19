import type { JointName, JointTargets } from "@/motion/joints";

/** Official G1 23-DoF URDF joint limits (radians). Right hip/shoulder roll are mirrored. */
export const JOINT_LIMITS: Record<JointName, readonly [number, number]> = {
  left_hip_pitch_joint: [-2.5307, 2.8798],
  left_hip_roll_joint: [-0.5236, 2.9671],
  left_hip_yaw_joint: [-2.7576, 2.7576],
  left_knee_joint: [-0.087267, 2.8798],
  left_ankle_pitch_joint: [-0.87267, 0.5236],
  left_ankle_roll_joint: [-0.2618, 0.2618],
  right_hip_pitch_joint: [-2.5307, 2.8798],
  right_hip_roll_joint: [-2.9671, 0.5236],
  right_hip_yaw_joint: [-2.7576, 2.7576],
  right_knee_joint: [-0.087267, 2.8798],
  right_ankle_pitch_joint: [-0.87267, 0.5236],
  right_ankle_roll_joint: [-0.2618, 0.2618],
  waist_yaw_joint: [-2.618, 2.618],
  left_shoulder_pitch_joint: [-3.0892, 2.6704],
  left_shoulder_roll_joint: [-1.5882, 2.2515],
  left_shoulder_yaw_joint: [-2.618, 2.618],
  left_elbow_joint: [-1.0472, 2.0944],
  left_wrist_roll_joint: [-1.9722, 1.9722],
  right_shoulder_pitch_joint: [-3.0892, 2.6704],
  right_shoulder_roll_joint: [-2.2515, 1.5882],
  right_shoulder_yaw_joint: [-2.618, 2.618],
  right_elbow_joint: [-1.0472, 2.0944],
  right_wrist_roll_joint: [-1.9722, 1.9722],
};

export function clampJoint(name: JointName, value: number) {
  const [lo, hi] = JOINT_LIMITS[name];
  return Math.min(hi, Math.max(lo, value));
}

export function clampTargets(values: JointTargets): JointTargets {
  const out = { ...values };
  (Object.keys(out) as JointName[]).forEach((name) => {
    out[name] = clampJoint(name, out[name]);
  });
  return out;
}
