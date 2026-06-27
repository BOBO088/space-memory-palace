// Self-contained demo spaces for the share page.
//
// These are hardcoded so anyone with the link can open them, on any
// device, with no localStorage and no Supabase. The 4 demos cover the
// most-likely-paying use cases:
//
//   demo-short-drama  · AI 短剧导演空间
//   demo-entrepreneur · AI 创业知识库
//   demo-second-brain · 个人第二大脑
//   demo-memory-palace · 数字记忆宫殿
//
// Spec data is shared with lib/seed-specs.ts so the same 4 templates
// can also be used as editable spaces from the dashboard.

import type { Hotspot, KnowledgeCard, Space, SpaceTemplate } from "./types";
import { SEED_SPECS_BY_TEMPLATE, type SeedSpec } from "./seed-specs";

export type DemoSlug =
  | "demo-short-drama"
  | "demo-entrepreneur"
  | "demo-second-brain"
  | "demo-memory-palace";

export interface DemoSpace {
  slug: DemoSlug;
  space: Space;
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
}

const NOW = "2026-01-01T00:00:00.000Z";

function makeSpace(args: {
  id: string;
  title: string;
  description: string;
  template: SpaceTemplate;
}): Space {
  return {
    id: args.id,
    title: args.title,
    description: args.description,
    sceneType: "primitive",
    sceneUrl: null,
    template: args.template,
    visibility: "public",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildDemo(specs: readonly SeedSpec[], space: Space) {
  const hotspots: Hotspot[] = specs.map((s, i) => ({
    id: `${space.id}-hot-${i + 1}`,
    spaceId: space.id,
    cardId: `${space.id}-card-${i + 1}`,
    title: s.title,
    summary: s.summary,
    position: s.position,
    color: s.color,
    icon: "dot",
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const cards: KnowledgeCard[] = specs.map((s, i) => ({
    id: `${space.id}-card-${i + 1}`,
    spaceId: space.id,
    title: s.title,
    type: s.type,
    content: s.content,
    summary: s.summary,
    tags: s.tags,
    mediaUrls: [],
    externalLinks: [],
    createdAt: NOW,
    updatedAt: NOW,
  }));
  return { hotspots, cards };
}

const SLUG_META: Record<
  DemoSlug,
  { title: string; description: string; template: SpaceTemplate; valueProp: string; templateKey: keyof typeof SEED_SPECS_BY_TEMPLATE }
> = {
  "demo-short-drama": {
    title: "AI 短剧导演空间 Demo",
    description: "一个 12 集 AI 短剧的完整导演工作台 · 6 个核心模块",
    template: "short_drama_studio",
    valueProp: "把 3D 空间变成可点击、可讲解的 AI 短剧导演工作台",
    templateKey: "short_drama_studio",
  },
  "demo-entrepreneur": {
    title: "AI 创业知识库 Demo",
    description: "从赛道分析到失败案例，6 个模块把创业讲清楚",
    template: "ai_entrepreneur_kb",
    valueProp: "把创业 0→1 的关键决策，变成 3D 房间里可以点、可以问的卡片",
    templateKey: "ai_entrepreneur_kb",
  },
  "demo-second-brain": {
    title: "个人第二大脑 Demo",
    description: "灵感 · 项目 · 决策 · 笔记 · 待办 · 复盘，6 个 GTD 模块",
    template: "personal_second_brain",
    valueProp: "把你脑子里的 6 类事情，全部挂在 3D 房间的墙上",
    templateKey: "personal_second_brain",
  },
  "demo-memory-palace": {
    title: "数字记忆宫殿 Demo",
    description: "把书、电影、人、历史、科学、哲学挂在同一个房间里",
    template: "digital_memory_palace",
    valueProp: "把人类 2500 年的精华，挂在你的 3D 房间里",
    templateKey: "digital_memory_palace",
  },
};

const DEMO_REGISTRY: DemoSpace[] = (Object.keys(SLUG_META) as DemoSlug[]).map(
  (slug) => {
    const meta = SLUG_META[slug];
    const space = makeSpace({
      id: slug,
      title: meta.title,
      description: meta.description,
      template: meta.template,
    });
    const { hotspots, cards } = buildDemo(SEED_SPECS_BY_TEMPLATE[meta.templateKey], space);
    return { slug, space, hotspots, cards };
  }
);

const DEMO_BY_SLUG: Record<DemoSlug, DemoSpace> = DEMO_REGISTRY.reduce(
  (acc, d) => {
    acc[d.slug] = d;
    return acc;
  },
  {} as Record<DemoSlug, DemoSpace>
);

export function isDemoSlug(spaceId: string): spaceId is DemoSlug {
  return Object.prototype.hasOwnProperty.call(DEMO_BY_SLUG, spaceId);
}

export function getDemoBySlug(slug: DemoSlug): DemoSpace {
  return DEMO_BY_SLUG[slug];
}

export function listDemos(): Array<
  Pick<DemoSpace, "slug" | "space"> & { hotspotCount: number; valueProp: string }
> {
  return DEMO_REGISTRY.map((d) => ({
    slug: d.slug,
    space: d.space,
    hotspotCount: d.hotspots.length,
    valueProp: SLUG_META[d.slug].valueProp,
  }));
}
