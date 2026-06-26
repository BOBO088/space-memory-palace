// Wrapper around @mkkellogg/gaussian-splats-3d's DropInViewer.
//
// We add the splat group to an existing THREE.Scene and hide the
// placeholder room when a splat is loaded. The Viewer's internal
// render hook is wired through DropInViewer's onBeforeRender
// callback, so we just keep calling `renderer.render(scene, camera)`
// in the parent loop.
//
// We do NOT use SharedArrayBuffer (sharedMemoryForWorkers: false) so
// the app works without cross-origin isolation headers.

import * as THREE from "three";
import { DropInViewer, type AbortablePromise } from "@mkkellogg/gaussian-splats-3d";

export type SplatStatus = "idle" | "loading" | "ready" | "error";

export interface SplatLoadProgress {
  percent: number; // 0-100
  message: string;
}

export interface SplatController {
  /** Add the splat group to the parent scene. */
  add: (parent: THREE.Scene) => void;
  /** Remove the splat group from the parent scene. */
  remove: (parent: THREE.Scene) => void;
  /** Manually trigger a load. */
  load: (url: string) => Promise<void>;
  /** Tear everything down. */
  dispose: () => void;
  /** Last known status. */
  getStatus: () => SplatStatus;
  getError: () => string | null;
}

export interface SplatControllerOptions {
  initialUrl?: string | null;
  ignoreDevicePixelRatio?: boolean;
  onStatusChange?: (status: SplatStatus, error?: string | null) => void;
  onProgress?: (p: SplatLoadProgress) => void;
}

export function createSplatController(
  options: SplatControllerOptions = {}
): SplatController {
  let viewer: DropInViewer | null = null;
  let status: SplatStatus = "idle";
  let error: string | null = null;
  let loadPromise: AbortablePromise | null = null;
  let currentUrl: string | null = options.initialUrl ?? null;

  const setStatus = (next: SplatStatus, err?: string | null) => {
    status = next;
    if (err !== undefined) error = err;
    options.onStatusChange?.(next, error);
  };

  const build = () => {
    if (viewer) return;
    viewer = new DropInViewer({
      // DropInViewer forces selfDrivenMode/useBuiltInControls=false; we keep
      // shared memory off so we don't need cross-origin isolation headers.
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: false,
      ignoreDevicePixelRatio: !!options.ignoreDevicePixelRatio,
      halfPrecisionCovariancesOnGPU: true,
      // Use a tighter scene reveal so the first frame is visible quickly.
      sceneRevealMode: undefined,
    });
  };

  const add = (parent: THREE.Scene) => {
    build();
    if (viewer && viewer.parent !== parent) {
      parent.add(viewer);
    }
  };
  const remove = (parent: THREE.Scene) => {
    if (viewer && viewer.parent === parent) parent.remove(viewer);
  };

  const load = (url: string): Promise<void> => {
    if (!url) return Promise.resolve();
    build();
    if (!viewer) return Promise.reject(new Error("splat viewer not initialized"));
    if (loadPromise) {
      try {
        loadPromise.abort?.();
      } catch {}
      loadPromise = null;
    }
    currentUrl = url;
    setStatus("loading", null);
    options.onProgress?.({ percent: 0, message: "开始下载…" });

    const p = viewer.addSplatScene(url, {
      showLoadingUI: false,
      progressiveLoad: false,
      onProgress: (percent: number, percentLabel: string) => {
        options.onProgress?.({ percent, message: percentLabel });
      },
    });
    loadPromise = p;
    return p
      .then(() => {
        if (loadPromise === p) loadPromise = null;
        setStatus("ready", null);
        options.onProgress?.({ percent: 100, message: "完成" });
      })
      .catch((err: Error) => {
        if (loadPromise === p) loadPromise = null;
        const msg = (err && err.message) || "加载失败";
        setStatus("error", msg);
      });
  };

  const dispose = () => {
    try {
      loadPromise?.abort?.();
    } catch {}
    loadPromise = null;
    if (viewer) {
      try {
        viewer.removeSplatScenes([0], false);
      } catch {}
      if (viewer.parent) viewer.parent.remove(viewer);
      // DropInViewer has no public dispose; remove children to release GPU memory.
      while (viewer.children.length > 0) viewer.remove(viewer.children[0]);
      viewer = null;
    }
    currentUrl = null;
  };

  // Auto-load the initial URL.
  if (options.initialUrl) {
    // Defer; consumer will call add() first.
    queueMicrotask(() => {
      if (currentUrl) load(currentUrl).catch(() => {});
    });
  }

  return {
    add,
    remove,
    load,
    dispose,
    getStatus: () => status,
    getError: () => error,
  };
}

/** Detect file format from URL (best effort, defaults to splat). */
export function guessSceneFormat(url: string): "ply" | "splat" | "ksplat" | "unknown" {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".ksplat")) return "ksplat";
  if (u.endsWith(".splat")) return "splat";
  if (u.endsWith(".ply")) return "ply";
  return "unknown";
}
