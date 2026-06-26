// Core domain types for Space Memory Palace.
// These are the contracts every layer (mock, localStorage, Supabase) speaks.

export type CardType =
  | "note"
  | "character"
  | "scene"
  | "episode"
  | "prompt"
  | "video"
  | "image"
  | "link";

export type CardTypeMeta = {
  value: CardType;
  label: string;
  /** Tailwind badge color classes (used in both light/dark UI). */
  badge: string;
};

export const CARD_TYPES: CardTypeMeta[] = [
  { value: "note", label: "笔记", badge: "bg-slate-500/20 text-slate-200 border-slate-400/30" },
  { value: "character", label: "角色", badge: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30" },
  { value: "scene", label: "场景", badge: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30" },
  { value: "episode", label: "分集", badge: "bg-amber-500/20 text-amber-200 border-amber-400/30" },
  { value: "prompt", label: "提示词", badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" },
  { value: "video", label: "视频", badge: "bg-rose-500/20 text-rose-200 border-rose-400/30" },
  { value: "image", label: "图片", badge: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30" },
  { value: "link", label: "外链", badge: "bg-sky-500/20 text-sky-200 border-sky-400/30" },
];

export interface KnowledgeCard {
  id: string;
  spaceId: string;
  title: string;
  type: CardType;
  content: string;
  summary?: string;
  tags: string[];
  mediaUrls: string[];
  externalLinks: string[];
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hotspot {
  id: string;
  spaceId: string;
  cardId?: string | null;
  title: string;
  summary?: string;
  position: { x: number; y: number; z: number };
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export type SpaceTemplate = "personal_knowledge" | "short_drama_studio";

export type SceneType = "splat" | "glb" | "primitive";

export type Visibility = "private" | "public" | "shared";

export interface Space {
  id: string;
  title: string;
  description?: string;
  sceneUrl?: string | null;
  sceneType: SceneType;
  coverUrl?: string | null;
  template: SpaceTemplate;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export type AiMode = "short" | "deep" | "script" | "teacher";

export const AI_MODES: { value: AiMode; label: string; hint: string }[] = [
  { value: "short", label: "短讲", hint: "100 字内" },
  { value: "deep", label: "深读", hint: "详细解读" },
  { value: "script", label: "讲解稿", hint: "短视频口播" },
  { value: "teacher", label: "老师口吻", hint: "课堂讲解" },
];

export interface SpaceExport {
  schemaVersion: 1;
  exportedAt: string;
  space: Space;
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
}
