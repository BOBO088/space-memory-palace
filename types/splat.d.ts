// Minimal local declarations for @mkkellogg/gaussian-splats-3d.
// The library ships as a single ESM build without .d.ts files; this
// declaration covers only the surface area we use.

declare module "@mkkellogg/gaussian-splats-3d" {
  import * as THREE from "three";

  export interface AbortablePromise<T = void> extends Promise<T> {
    abort?: () => void;
  }

  export interface AddSplatSceneOptions {
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    splatAlphaRemovalThreshold?: number;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    onProgress?: (percent: number, percentLabel: string) => void;
  }

  export class DropInViewer extends THREE.Group {
    constructor(options?: Record<string, unknown>);
    addSplatScene(
      path: string,
      options?: AddSplatSceneOptions
    ): AbortablePromise<void>;
    addSplatScenes(
      sceneOptions: Array<{ path: string } & AddSplatSceneOptions>,
      showLoadingUI?: boolean
    ): AbortablePromise<void>;
    removeSplatScene(index: number, showLoadingUI?: boolean): AbortablePromise<void>;
    removeSplatScenes(indexes: number[], showLoadingUI?: boolean): AbortablePromise<void>;
    getSplatScene(index: number): unknown;
    getSceneCount(): number;
  }

  export const LogLevel: { None: number; Error: number; Warning: number; Info: number; Debug: number };
  export const RenderMode: { Always: number; OnChange: number };
  export const SceneRevealMode: { Default: number; Gradual: number; Instant: number };
  export const SplatRenderMode: { ThreeD: number; TwoD: number };
  export const SceneFormat: { Splat: number; KSplat: number; Ply: number; Spz: number };
  export const WebXRMode: { None: number; AR: number; VR: number };
}
