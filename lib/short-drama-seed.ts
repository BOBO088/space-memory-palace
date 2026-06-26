// Auto-seed data for the AI 短剧导演空间 template.
//
// We pre-create eight hotspots around the floor and one knowledge card
// per hotspot, so the user opens a populated 3D board instead of an
// empty one. All copy is bilingual-friendly Markdown with a few
// prompts that are easy to overwrite.

import type { CardType, Hotspot, KnowledgeCard, Space } from "./types";

export interface ShortDramaSeed {
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
}

interface SeedSpec {
  /** Position on the floor (units are scene meters). */
  position: { x: number; y: number; z: number };
  title: string;
  summary: string;
  type: CardType;
  content: string;
  color: string;
  tags: string[];
}

const SEED: SeedSpec[] = [
  {
    title: "角色墙",
    summary: "主角、配角、反派一览",
    type: "character",
    position: { x: -2.4, y: 0.15, z: 2.2 },
    color: "#f472b6",
    tags: ["角色", "IP"],
    content: [
      "## 主角",
      "- 姓名 / 年龄 / 职业",
      "- 性格关键词",
      "- 视觉锚点（服装 / 配饰 / 习惯动作）",
      "",
      "## 配角",
      "- 名字 / 功能 / 与主角关系",
      "",
      "## 反派 / 对手",
      "- 名字 / 动机 / 标志性行为",
    ].join("\n"),
  },
  {
    title: "世界观设定",
    summary: "时代 / 地点 / 关键规则",
    type: "scene",
    position: { x: 2.4, y: 0.15, z: 2.2 },
    color: "#22d3ee",
    tags: ["世界观", "设定"],
    content: [
      "## 时代",
      "## 地点",
      "## 关键规则（限制 / 代价 / 禁忌）",
      "## 视觉基调（色板 / 光线 / 质感）",
    ].join("\n"),
  },
  {
    title: "第 1 集剧情",
    summary: "开场冲突 + 钩子",
    type: "episode",
    position: { x: -2.4, y: 0.15, z: 0 },
    color: "#fbbf24",
    tags: ["第 1 集", "开场"],
    content: [
      "## 开场（5s 钩子）",
      "## 第一节：日常",
      "## 第二节：破局事件",
      "## 第三节：悬念收尾",
    ].join("\n"),
  },
  {
    title: "分镜区",
    summary: "关键场景的镜头列表",
    type: "scene",
    position: { x: 2.4, y: 0.15, z: 0 },
    color: "#60a5fa",
    tags: ["分镜", "镜头"],
    content: [
      "## S1 - 室内",
      "- 镜 1：景别 / 运镜 / 台词",
      "- 镜 2：景别 / 运镜 / 台词",
      "",
      "## S2 - 室外",
      "- 镜 1：景别 / 运镜 / 台词",
    ].join("\n"),
  },
  {
    title: "场景资产",
    summary: "室内外主场景 + 关键道具",
    type: "image",
    position: { x: -2.4, y: 0.15, z: -2.2 },
    color: "#a78bfa",
    tags: ["场景", "资产"],
    content: [
      "## 室内主场景",
      "- 描述 / 关键道具 / 光线",
      "",
      "## 室外主场景",
      "- 描述 / 关键道具 / 光线",
      "",
      "## 关键道具（与剧情绑定的物件）",
    ].join("\n"),
  },
  {
    title: "道具伏笔",
    summary: "契诃夫之枪清单",
    type: "note",
    position: { x: 2.4, y: 0.15, z: -2.2 },
    color: "#f87171",
    tags: ["道具", "伏笔"],
    content: [
      "## 伏笔 A",
      "- 出现在：第 ? 集 / 场景",
      "- 揭晓：第 ? 集 / 场景",
      "",
      "## 伏笔 B",
      "- 出现在：",
      "- 揭晓：",
    ].join("\n"),
  },
  {
    title: "音乐音效",
    summary: "主题音乐 / 情绪配乐 / 关键音效",
    type: "video",
    position: { x: 0, y: 0.15, z: 2.2 },
    color: "#34d399",
    tags: ["音乐", "音效"],
    content: [
      "## 主题音乐",
      "- 风格 / 乐器 / 情绪",
      "",
      "## 配乐关键词",
      "- 紧张 / 悬疑 / 温暖",
      "",
      "## 关键音效",
      "- 物件 / UI / 转场",
    ].join("\n"),
  },
  {
    title: "提示词库",
    summary: "分镜 / 角色 / 场景的 AI 提示词",
    type: "prompt",
    position: { x: 0, y: 0.15, z: -2.2 },
    color: "#fbbf24",
    tags: ["提示词", "AI"],
    content: [
      "## 角色一致性提示词",
      "## 场景一致性提示词",
      "## 风格提示词",
      "## 镜头语言提示词",
    ].join("\n"),
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/** Build the seed hotspots and cards for a freshly created short_drama_studio space. */
export function buildShortDramaSeed(space: Space): ShortDramaSeed {
  const now = new Date().toISOString();
  const hotspots: Hotspot[] = [];
  const cards: KnowledgeCard[] = [];
  for (const spec of SEED) {
    const cardId = makeId("card");
    const hotspotId = makeId("hot");
    cards.push({
      id: cardId,
      spaceId: space.id,
      title: spec.title,
      type: spec.type,
      content: spec.content,
      summary: spec.summary,
      tags: spec.tags,
      mediaUrls: [],
      externalLinks: [],
      createdAt: now,
      updatedAt: now,
    });
    hotspots.push({
      id: hotspotId,
      spaceId: space.id,
      cardId,
      title: spec.title,
      summary: spec.summary,
      position: spec.position,
      color: spec.color,
      icon: "dot",
      createdAt: now,
      updatedAt: now,
    });
  }
  return { hotspots, cards };
}
