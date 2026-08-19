import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import URDFLoader from "urdf-loader";
import type { URDFRobot } from "urdf-loader";
import { JOINT_NAMES, type JointName, type JointTargets } from "@/motion/joints";
import { DEFAULT_JOINTS, useRobotStore } from "@/store/useRobotStore";

const URDF_URL = "/models/g1/g1_23dof_rev_1_0.urdf";

const ROBOT_PALETTE = {
  metalLight: "#e8eaec",
  metalDark: "#8a8f98",
  plasticBlack: "#1c1f24",
  plasticDark: "#2a2e35",
  rubber: "#3a3f47",
  accent: "#10b981",
  accentWarm: "#f59e0b",
  white: "#f8fafc",
  logo: "#0ea5e9",
} as const;

function getMaterialForMesh(name: string): Partial<THREE.MeshStandardMaterialParameters> {
  const n = name.toLowerCase();

  if (n.includes("rubber") || n.includes("grip") || n.includes("tire") || n.includes("foot")) {
    return { color: ROBOT_PALETTE.rubber, metalness: 0.05, roughness: 0.92 };
  }
  if (n.includes("logo")) {
    return { color: ROBOT_PALETTE.logo, metalness: 0.9, roughness: 0.25, envMapIntensity: 1.5 };
  }
  if (n.includes("head") || n.includes("face") || n.includes("sensor") || n.includes("camera") || n.includes("d455") || n.includes("lens")) {
    return { color: ROBOT_PALETTE.plasticBlack, metalness: 0.18, roughness: 0.5, envMapIntensity: 0.95 };
  }
  if (n.includes("servo") || n.includes("motor") || n.includes("joint") || n.includes("actuator")) {
    return { color: ROBOT_PALETTE.metalDark, metalness: 0.87, roughness: 0.33, envMapIntensity: 1.15 };
  }
  if (n.includes("pelvis") || n.includes("hip_yaw") || n.includes("hip_roll") || n.includes("hip_pitch") || n.includes("torso") || n.includes("backpack") || n.includes("contour") || n.includes("waist") || n.includes("body") || n.includes("chest")) {
    return { color: ROBOT_PALETTE.metalLight, metalness: 0.94, roughness: 0.25, envMapIntensity: 1.3 };
  }
  if (n.includes("knee") || n.includes("ankle") || n.includes("elbow") || n.includes("wrist") || n.includes("shoulder") || n.includes("shin") || n.includes("thigh") || n.includes("forearm") || n.includes("upperarm") || n.includes("upper_arm") || n.includes("lower_arm")) {
    return { color: ROBOT_PALETTE.metalDark, metalness: 0.88, roughness: 0.3, envMapIntensity: 1.18 };
  }
  if (n.includes("palm") || n.includes("hand") || n.includes("finger") || n.includes("thumb") || n.includes("index") || n.includes("middle") || n.includes("ring") || n.includes("little") || n.includes("dex") || n.includes("gripper")) {
    return { color: ROBOT_PALETTE.plasticDark, metalness: 0.22, roughness: 0.62, envMapIntensity: 0.9 };
  }
  if (n.includes("base") || n.includes("link") && !n.includes("force")) {
    return { color: ROBOT_PALETTE.metalLight, metalness: 0.86, roughness: 0.3, envMapIntensity: 1.15 };
  }
  if (n.includes("force") || n.includes("sensor")) {
    return { color: ROBOT_PALETTE.plasticBlack, metalness: 0.4, roughness: 0.4, envMapIntensity: 1.0 };
  }

  return { color: ROBOT_PALETTE.metalLight, metalness: 0.85, roughness: 0.35, envMapIntensity: 1.05 };
}

function useUrdfRobot(url: string) {
  const [robot, setRobot] = useState<URDFRobot | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new URDFLoader();
    try {
      const base = url.replace(/[^/]+$/, "");
      const meshPath = base + "meshes/";
      if (typeof loader.setMeshPath === "function") loader.setMeshPath(meshPath);
    } catch (e) {
      // ignore
    }
    if (loader.manager && typeof loader.manager.onError === "function") {
      const orig = loader.manager.onError.bind(loader.manager);
      loader.manager.onError = (itemUrl) => {
        console.error("URDF asset failed to load:", itemUrl);
        orig(itemUrl);
      };
    }
    loader.load(
      url,
      (result) => {
        if (cancelled) return;
        result.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;

          try {
            const geom = mesh.geometry as THREE.BufferGeometry;
            if (!geom.attributes.normal) geom.computeVertexNormals();
            geom.computeBoundingBox();
            geom.computeBoundingSphere();
          } catch (e) {
            // ignore
          }

          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const newMats: THREE.MeshStandardMaterial[] = [];
            for (const _m of mats) {
              const params = getMaterialForMesh(mesh.name || "");
              const newMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(params.color ?? "#d1d5db"),
                metalness: params.metalness ?? 0.6,
                roughness: params.roughness ?? 0.4,
                envMapIntensity: params.envMapIntensity ?? 1.0,
              });
              try {
                newMat.color.convertSRGBToLinear();
              } catch (e) {
                /* no-op */
              }
              newMats.push(newMat);
            }
            mesh.material = Array.isArray(mesh.material) ? newMats : newMats[0];
          }
        });
        setRobot(result);
      },
      undefined,
      (err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { robot, error };
}

const GROUND_Y = 0.028;
const FOOT_LINKS = ["left_ankle_roll_link", "right_ankle_roll_link"] as const;
const _footBox = new THREE.Box3();

function getRobotLink(robot: URDFRobot, name: string) {
  return robot.links?.[name] ?? robot.getObjectByName(name) ?? null;
}

function plantFeetOnGround(robot: URDFRobot, groundY = GROUND_Y) {
  robot.updateMatrixWorld(true);
  let minY = Infinity;
  for (const name of FOOT_LINKS) {
    const link = getRobotLink(robot, name);
    if (!link) continue;
    _footBox.setFromObject(link);
    const y = _footBox.min.y;
    if (Number.isFinite(y) && y < minY) minY = y;
  }
  if (!Number.isFinite(minY)) {
    _footBox.setFromObject(robot);
    minY = _footBox.min.y;
  }
  const dy = groundY - minY;
  if (!Number.isFinite(dy) || Math.abs(dy) > 4) return;
  robot.position.y += dy;
  if (!Number.isFinite(robot.position.y)) robot.position.y = 0;
}

function fitRobotToScene(robot: URDFRobot) {
  robot.rotation.x = -Math.PI / 2;
  robot.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(robot);
  const size = new THREE.Vector3();
  box.getSize(size);
  const targetHeight = 1.38;
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  robot.scale.setScalar(scale);
  robot.updateMatrixWorld(true);
  plantFeetOnGround(robot);
}

function RobotModelFallback() {
  const targets = useRobotStore((s) => s.targets);
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const animated = useRef<JointTargets>({ ...DEFAULT_JOINTS });

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 20);
    for (const name of JOINT_NAMES) {
      animated.current[name] = THREE.MathUtils.lerp(animated.current[name], targets[name], k);
    }
    if (leftArm.current) leftArm.current.rotation.z = animated.current.left_shoulder_pitch_joint * 0.8;
    if (rightArm.current) rightArm.current.rotation.z = -animated.current.right_shoulder_pitch_joint * 0.8;
    if (group.current) {
      const sit = Math.max(0, -animated.current.left_hip_pitch_joint);
      group.current.position.y = 0.45 - Math.min(sit / 1.1, 1) * 0.28;
    }
  });

  return (
    <group ref={group} position={[0, 0.45, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.25]} />
        <meshStandardMaterial color={ROBOT_PALETTE.metalLight} roughness={0.3} metalness={0.9} envMapIntensity={1.2} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.22]} />
        <meshStandardMaterial color={ROBOT_PALETTE.plasticBlack} roughness={0.5} metalness={0.2} envMapIntensity={0.9} />
      </mesh>
      <group ref={leftArm} position={[-0.29, 0.82, 0]}>
        <mesh castShadow receiveShadow position={[-0.14, 0, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.12]} />
          <meshStandardMaterial color={ROBOT_PALETTE.metalDark} roughness={0.35} metalness={0.85} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.29, 0.82, 0]}>
        <mesh castShadow receiveShadow position={[0.14, 0, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.12]} />
          <meshStandardMaterial color={ROBOT_PALETTE.metalDark} roughness={0.35} metalness={0.85} />
        </mesh>
      </group>
      <mesh castShadow receiveShadow position={[-0.15, 0.15, 0]}>
        <boxGeometry args={[0.14, 0.3, 0.14]} />
        <meshStandardMaterial color={ROBOT_PALETTE.plasticDark} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.15, 0.15, 0]}>
        <boxGeometry args={[0.14, 0.3, 0.14]} />
        <meshStandardMaterial color={ROBOT_PALETTE.plasticDark} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

function UrdfG1Model() {
  const { robot, error } = useUrdfRobot(URDF_URL);
  const robotRef = useRef<URDFRobot | null>(null);
  const fitted = useRef(false);
  const animatedJoints = useRef<JointTargets>({ ...DEFAULT_JOINTS });
  const idleRef = useRef({ t: 0, baseRotY: 0 });

  if (robot) robotRef.current = robot;

  useEffect(() => {
    const current = robotRef.current;
    if (!current || fitted.current) return;
    fitRobotToScene(current);
    fitted.current = true;
    idleRef.current.baseRotY = current.rotation.y;
  }, [robot]);

  useFrame((_, dt) => {
    idleRef.current.t += dt;
    const current = robotRef.current;
    if (!current) return;

    const targets = useRobotStore.getState().targets;
    const k = 1 - Math.exp(-dt * 20);
    for (const name of JOINT_NAMES) {
      animatedJoints.current[name] = THREE.MathUtils.lerp(
        animatedJoints.current[name],
        targets[name],
        k,
      );
      try {
        current.setJointValue(name as JointName, animatedJoints.current[name]);
      } catch {
        // skip joints not present in URDF
      }
    }

    plantFeetOnGround(current);

    const flexion = Math.max(0, -animatedJoints.current.left_hip_pitch_joint);
    const idleGain = THREE.MathUtils.clamp(1 - flexion / 0.7, 0, 1);
    const breath = Math.sin(idleRef.current.t * 1.15) * 0.0024 * idleGain;
    const sway = Math.sin(idleRef.current.t * 0.72) * 0.0035 * idleGain;
    if (Number.isFinite(breath)) current.position.y += breath;
    if (Number.isFinite(current.position.y)) {
      current.rotation.y = idleRef.current.baseRotY + sway;
    } else {
      current.position.set(0, GROUND_Y, 0);
    }
  });

  if (error) return <RobotModelFallback />;
  const live = robotRef.current;
  if (!live) return null;

  return <primitive object={live} dispose={null} />;
}

function StudioStage() {
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[6, 96]} />
        <meshStandardMaterial color="#05070a" roughness={1} metalness={0} />
      </mesh>

      <mesh receiveShadow castShadow position={[0, 0.012, 0]}>
        <cylinderGeometry args={[1.72, 1.82, 0.024, 96]} />
        <meshStandardMaterial color="#10151c" metalness={0.92} roughness={0.22} envMapIntensity={1.25} />
      </mesh>
      <mesh receiveShadow position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.68, 96]} />
        <meshStandardMaterial color="#0b0f14" metalness={0.94} roughness={0.16} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.68, 1.73, 96]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.84, 96]} />
        <meshBasicMaterial color={ROBOT_PALETTE.accent} />
      </mesh>

      <ContactShadows
        resolution={2048}
        opacity={0.5}
        scale={10}
        blur={2.6}
        far={4}
        color="#000000"
      />

      <gridHelper args={[11, 22, "#14202c", "#0c1218"]} position={[0, 0.0, 0]} />
    </>
  );
}

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.24} color="#e6f0ff" />
      <hemisphereLight args={["#bfe3ff", "#0a0d12", 0.28]} />

      <spotLight
        position={[5.8, 8.8, 4.8]}
        angle={0.3}
        penumbra={0.86}
        intensity={4.8}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.00008}
        shadow-normalBias={0.025}
        color="#fff9ee"
        name="key"
      />

      <spotLight
        position={[-6.2, 5.8, -3.8]}
        angle={0.4}
        penumbra={0.96}
        intensity={1.75}
        color="#d3e8ff"
        name="fill"
      />

      <spotLight
        position={[-0.5, 7.8, -5.8]}
        angle={0.26}
        penumbra={0.82}
        intensity={3.4}
        color="#bae7ff"
        name="rim"
      />

      <spotLight
        position={[3.8, 2.2, -4.2]}
        angle={0.48}
        penumbra={1}
        intensity={1.25}
        color={ROBOT_PALETTE.accent}
        name="accent-green"
      />

      <spotLight
        position={[-4.2, 1.7, 3.2]}
        angle={0.48}
        penumbra={1}
        intensity={0.95}
        color="#38bdf8"
        name="accent-blue"
      />

      <pointLight position={[0, 1.15, 0.2]} intensity={0.55} color={ROBOT_PALETTE.accent} distance={4} decay={2} />

      <rectAreaLight
        position={[0, 5.8, -3.8]}
        width={6.5}
        height={4.5}
        intensity={2.5}
        color="#eaf3ff"
        rotation={[0.22, 0, 0]}
      />
    </>
  );
}

function RenderQuality() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [gl]);
  return null;
}

export const RobotScene = memo(function RobotScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{ position: [2.8, 1.35, 3.1], fov: 36, near: 0.08, far: 50 }}
    >
      <RenderQuality />
      <color attach="background" args={["#06090c"]} />
      <fog attach="fog" args={["#06090c", 5.2, 14.5]} />

      <StudioLighting />
      <StudioStage />

      <Suspense fallback={<RobotModelFallback />}>
        <UrdfG1Model />
      </Suspense>

      <Environment preset="studio" environmentIntensity={1.22} backgroundBlurriness={0} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        minDistance={1.5}
        maxDistance={5.2}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.02}
        target={[0, 0.62, 0]}
        autoRotate={false}
      />
    </Canvas>
  );
});
