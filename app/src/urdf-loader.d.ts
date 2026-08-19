declare module "urdf-loader" {
  import type { Object3D, LoadingManager } from "three";

  export interface URDFJointLimit {
    lower: number;
    upper: number;
  }

  export interface URDFJoint {
    jointType: string;
    axis: { x: number; y: number; z: number };
    origin: Object3D;
    parent: string;
    child: string;
    limit: URDFJointLimit;
    angle: number;
  }

  export class URDFRobot extends Object3D {
    joints: Record<string, URDFJoint>;
    links: Record<string, Object3D>;
    setJointValue: (jointName: string, value: number) => boolean;
    setJointValues: (values: Record<string, number>) => void;
  }

  export default class URDFLoader {
    manager: LoadingManager;
    packages: Record<string, string> | string | null;
    fetchOptions: RequestInit;
    workingPath: string;
    constructor(manager?: LoadingManager);
    setPackages(
      packages: Record<string, string> | string | null
    ): this;
    setMeshPath(path: string): this;
    load(
      url: string,
      onLoad: (robot: URDFRobot) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (error: unknown) => void,
    ): void;
    parse(
      urdf: string,
      onComplete: (robot: URDFRobot) => void,
      onError?: (error: unknown) => void,
    ): void;
  }
}
