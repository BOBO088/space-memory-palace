"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Hotspot, SceneType } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  createSplatController,
  type SplatController,
  type SplatStatus,
} from "./SplatScene";

export type ViewerMode = "view" | "edit";

export interface SpaceViewerProps {
  hotspots: Hotspot[];
  selectedHotspotId?: string | null;
  mode: ViewerMode;
  /** 3D scene to render. "primitive" shows a synthetic room; anything else
   *  loads the configured splat / glb via gaussian-splats-3d. */
  sceneType?: SceneType;
  sceneUrl?: string | null;
  onSelectHotspot?: (id: string | null) => void;
  onCreateHotspot?: (position: { x: number; y: number; z: number }) => void;
  /** When true, surface clicks become creates instead of selects and the cursor is crosshair. */
  addHotspotMode?: boolean;
  /** Display-only metadata; reserved for fallback messages in later phases. */
  spaceId?: string;
  spaceTitle?: string;
  className?: string;
}

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3;

export function SpaceViewer({
  hotspots,
  selectedHotspotId,
  mode,
  sceneType = "primitive",
  sceneUrl,
  onSelectHotspot,
  onCreateHotspot,
  addHotspotMode = false,
  spaceId,
  spaceTitle,
  className,
}: SpaceViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    hotspotGroup?: THREE.Group;
    raycaster?: THREE.Raycaster;
    pointer?: THREE.Vector2;
    clickPlane?: THREE.Mesh;
    labelOverlay?: HTMLDivElement;
    placeholderGroup?: THREE.Group;
  }>({});

  const splatRef = useRef<SplatController | null>(null);
  const [splatStatus, setSplatStatus] = useState<SplatStatus>("idle");
  const [splatError, setSplatError] = useState<string | null>(null);
  const [splatPercent, setSplatPercent] = useState(0);

  type PropsBag = {
    hotspots: Hotspot[];
    selectedHotspotId: string | null;
    mode: ViewerMode;
    onSelectHotspot?: (id: string | null) => void;
    onCreateHotspot?: (position: { x: number; y: number; z: number }) => void;
    addHotspotMode: boolean;
  };
  const propsRef = useRef<PropsBag>({
    hotspots,
    selectedHotspotId: selectedHotspotId ?? null,
    mode,
    onSelectHotspot,
    onCreateHotspot,
    addHotspotMode: false,
  });
  Object.assign(propsRef.current, {
    hotspots,
    selectedHotspotId,
    mode,
    onSelectHotspot,
    onCreateHotspot,
    addHotspotMode,
  });
  void spaceId;
  void spaceTitle;

  // One-time scene setup.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050714");
    scene.fog = new THREE.Fog("#050714", 14, 28);

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(4.5, 3.8, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, Math.max(mount.clientHeight, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(6, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    rim.position.set(-5, 4, -3);
    scene.add(rim);

    // Placeholder room (lights + floor + walls + grid). Wrapped in a group
    // so we can show/hide it as a unit when a real splat scene is loaded.
    const placeholderGroup = new THREE.Group();
    placeholderGroup.name = "placeholder";
    scene.add(placeholderGroup);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    placeholderGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
    const wallSpecs: { pos: [number, number, number]; rot: [number, number, number]; w: number; h: number }[] = [
      { pos: [0, ROOM_H / 2, -ROOM_D / 2], rot: [0, 0, 0], w: ROOM_W, h: ROOM_H },
      { pos: [0, ROOM_H / 2, ROOM_D / 2], rot: [0, Math.PI, 0], w: ROOM_W, h: ROOM_H },
      { pos: [-ROOM_W / 2, ROOM_H / 2, 0], rot: [0, Math.PI / 2, 0], w: ROOM_D, h: ROOM_H },
      { pos: [ROOM_W / 2, ROOM_H / 2, 0], rot: [0, -Math.PI / 2, 0], w: ROOM_D, h: ROOM_H },
    ];
    for (const w of wallSpecs) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, w.h), wallMat);
      m.position.set(...w.pos);
      m.rotation.set(...w.rot);
      m.receiveShadow = true;
      placeholderGroup.add(m);
    }

    const edgeGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.4 });
    const edge = new THREE.LineSegments(edgeGeom, edgeMat);
    edge.position.y = ROOM_H / 2;
    placeholderGroup.add(edge);

    const gridGroup = buildGrid(ROOM_W * 2, ROOM_D * 2);
    gridGroup.position.y = 0.002;
    placeholderGroup.add(gridGroup);

    // Invisible floor for raycasting hotspots/new hotspots (lives in scene
    // root so it stays available even when the placeholder is hidden).
    const clickPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W * 4, ROOM_D * 4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    clickPlane.rotation.x = -Math.PI / 2;
    clickPlane.position.y = 0.003;
    scene.add(clickPlane);

    // Hotspot group
    const hotspotGroup = new THREE.Group();
    scene.add(hotspotGroup);

    // Label overlay (CSS-positioned divs over the canvas)
    const labelOverlay = document.createElement("div");
    labelOverlay.className = "pointer-events-none absolute inset-0";
    mount.appendChild(labelOverlay);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set(0, 1, 0);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    let downX = 0;
    let downY = 0;
    let downT = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      const dt = performance.now() - downT;
      if (!propsRef.current.addHotspotMode && (dx * dx + dy * dy > 16 || dt > 400)) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (!propsRef.current.addHotspotMode) {
        const hits = raycaster.intersectObjects(hotspotGroup.children, true);
        for (const h of hits) {
          const id = (h.object as THREE.Mesh).userData.hotspotId as string | undefined;
          if (id) {
            propsRef.current.onSelectHotspot?.(id);
            return;
          }
        }
      }
      if (propsRef.current.mode === "edit") {
        const plane = raycaster.intersectObject(clickPlane);
        if (plane.length > 0) {
          const p = plane[0].point;
          propsRef.current.onCreateHotspot?.({ x: p.x, y: 0.15, z: p.z });
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotspotGroup.children, true);
      const baseCursor = propsRef.current.addHotspotMode ? "crosshair" : "";
      renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : baseCursor;
    };
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      syncLabels(hotspotGroup, labelOverlay, camera, propsRef.current.selectedHotspotId ?? null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      hotspotGroup,
      raycaster,
      pointer,
      clickPlane,
      labelOverlay,
      placeholderGroup,
    };
    syncHotspots(hotspotGroup, labelOverlay, hotspots, selectedHotspotId ?? null);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();
      hotspotGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry?.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (labelOverlay.parentElement) labelOverlay.parentElement.removeChild(labelOverlay);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile hotspots whenever the prop changes.
  useEffect(() => {
    const s = stateRef.current;
    if (!s.hotspotGroup || !s.labelOverlay) return;
    syncHotspots(s.hotspotGroup, s.labelOverlay, hotspots, selectedHotspotId ?? null);
  }, [hotspots, selectedHotspotId]);

  // Wire splat scene when sceneUrl is provided.
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;

    const useSplat = sceneType !== "primitive" && !!sceneUrl;
    if (!useSplat) {
      if (splatRef.current) {
        splatRef.current.remove(s.scene);
        splatRef.current.dispose();
        splatRef.current = null;
      }
      setSplatStatus("idle");
      setSplatError(null);
      setSplatPercent(0);
      if (s.placeholderGroup) s.placeholderGroup.visible = true;
      return;
    }

    // Hide placeholder while the splat is loading or loaded.
    if (s.placeholderGroup) s.placeholderGroup.visible = false;

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia?.("(max-width: 768px)").matches;

    const controller = createSplatController({
      ignoreDevicePixelRatio: isMobile,
      onStatusChange: (status, err) => {
        setSplatStatus(status);
        setSplatError(err ?? null);
        if (status === "error" && s.placeholderGroup) {
          // Bring the placeholder room back so the user still sees something.
          s.placeholderGroup.visible = true;
        }
      },
      onProgress: (p) => setSplatPercent(p.percent),
    });
    const parentScene = s.scene;
    splatRef.current = controller;
    controller.add(parentScene);
    controller.load(sceneUrl!).catch(() => {});

    return () => {
      controller.remove(parentScene);
      controller.dispose();
      if (splatRef.current === controller) splatRef.current = null;
    };
  }, [sceneType, sceneUrl]);

  return (
    <div
      ref={mountRef}
      data-svp
      className={cn("relative h-full w-full", className)}
    >
      {splatStatus === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-md border border-cyan-400/30 bg-slate-950/80 px-3 py-2 text-xs text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.4)] backdrop-blur">
            <div className="mb-1.5 font-medium">3D 场景加载中</div>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-cyan-400/15">
              <div
                className="h-full bg-cyan-300 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, splatPercent))}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">{Math.round(splatPercent)}%</div>
          </div>
        </div>
      )}
      {splatStatus === "error" && (
        <div className="pointer-events-none absolute left-3 top-3">
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-[11px] text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.25)] backdrop-blur">
            3D 场景加载失败，已显示占位房间 · {splatError ?? "未知错误"}
          </div>
        </div>
      )}
    </div>
  );
}

function buildGrid(width: number, depth: number): THREE.Group {
  const group = new THREE.Group();
  const cellSize = 0.5;
  const sectionSize = 2;
  const minor = new THREE.GridHelper(width, width / cellSize, 0x1e293b, 0x1e293b);
  (minor.material as THREE.LineBasicMaterial).transparent = true;
  (minor.material as THREE.LineBasicMaterial).opacity = 0.55;
  group.add(minor);
  const major = new THREE.GridHelper(width, width / sectionSize, 0x22d3ee, 0x22d3ee);
  (major.material as THREE.LineBasicMaterial).transparent = true;
  (major.material as THREE.LineBasicMaterial).opacity = 0.7;
  major.position.y = 0.0005;
  group.add(major);
  const bounds = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, depth)),
    new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.4 })
  );
  bounds.rotation.x = -Math.PI / 2;
  bounds.position.y = 0.001;
  group.add(bounds);
  void cellSize;
  void sectionSize;
  void depth;
  return group;
}

function syncHotspots(
  group: THREE.Group,
  overlay: HTMLDivElement,
  hotspots: Hotspot[],
  selectedId: string | null
) {
  const wanted = new Map(hotspots.map((h) => [h.id, h]));
  const toRemove: THREE.Object3D[] = [];
  group.children.forEach((child) => {
    const id = (child as THREE.Object3D).userData.hotspotId as string | undefined;
    if (id && !wanted.has(id)) toRemove.push(child);
  });
  for (const c of toRemove) {
    group.remove(c);
    c.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
        else m.material.dispose();
      }
    });
    const label = overlay.querySelector(`[data-hslabel="${(c as THREE.Object3D).userData.hotspotId}"]`);
    label?.remove();
  }
  for (const h of hotspots) {
    const isSelected = h.id === selectedId;
    let entry = group.children.find((c) => (c as THREE.Object3D).userData.hotspotId === h.id) as THREE.Group | undefined;
    if (!entry) {
      entry = buildHotspotNode(h);
      group.add(entry);
    }
    applyHotspotSelection(entry, isSelected);
  }
}

function buildHotspotNode(h: Hotspot): THREE.Group {
  const g = new THREE.Group();
  g.userData.hotspotId = h.id;
  g.position.set(h.position.x, h.position.y, h.position.z);

  const color = new THREE.Color(h.color);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 24),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.2,
    })
  );
  sphere.castShadow = true;
  sphere.userData.hotspotId = h.id;
  g.add(sphere);

  // Ground-projected ring (the visible aura).
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.32, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -h.position.y + 0.005;
  ring.userData.hotspotId = h.id;
  g.add(ring);

  // Invisible hitbox sphere. Raycasting targets this so the entire
  // visible aura is clickable, not just the small inner sphere.
  // 0.4m radius matches a comfortable finger-tap target.
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 12),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
  );
  hitbox.userData.hotspotId = h.id;
  hitbox.renderOrder = 999;
  hitbox.name = "hotspot-hitbox";
  g.add(hitbox);

  g.userData.sphere = sphere;
  g.userData.ring = ring;
  g.userData.hitbox = hitbox;
  g.userData.title = h.title;
  return g;
}

function applyHotspotSelection(g: THREE.Group, selected: boolean) {
  const sphere = g.userData.sphere as THREE.Mesh | undefined;
  const ring = g.userData.ring as THREE.Mesh | undefined;
  if (sphere) {
    sphere.scale.setScalar(selected ? 1.25 : 1);
    const mat = sphere.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = selected ? 1.4 : 0.7;
  }
  if (ring) {
    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = selected ? 0.9 : 0.55;
  }
}

function syncLabels(
  group: THREE.Group,
  overlay: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  selectedId: string | null
) {
  const mountRect = overlay.getBoundingClientRect();
  const temp = new THREE.Vector3();
  for (const child of group.children) {
    const id = (child as THREE.Object3D).userData.hotspotId as string;
    const title = (child as THREE.Object3D).userData.title as string;
    const isSelected = id === selectedId;
    temp.set(0, 0.28, 0).applyMatrix4(child.matrixWorld).project(camera);
    const x = (temp.x * 0.5 + 0.5) * mountRect.width;
    const y = (-temp.y * 0.5 + 0.5) * mountRect.height;
    if (temp.z > 1) {
      let el = overlay.querySelector<HTMLDivElement>(`[data-hslabel="${id}"]`);
      if (el) el.style.display = "none";
      continue;
    }
    let el = overlay.querySelector<HTMLDivElement>(`[data-hslabel="${id}"]`);
    if (!el) {
      el = document.createElement("div");
      el.dataset.hslabel = id;
      el.className =
        "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium backdrop-blur";
      overlay.appendChild(el);
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = "";
    el.textContent = title;
    el.className = cn(
      "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium backdrop-blur transition",
      isSelected
        ? "border-cyan-300/80 bg-slate-950/90 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.6)]"
        : "border-white/20 bg-slate-950/70 text-slate-200"
    );
  }
}
