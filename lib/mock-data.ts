import type { Hotspot, KnowledgeCard, Space } from "./types";

const now = (offsetMin = 0) =>
  new Date(Date.now() - offsetMin * 60_000).toISOString();

export const MOCK_SPACES: Space[] = [
  {
    id: "space-1",
    title: "我的客厅",
    description: "日常会客与阅读的空间，把灵感挂上墙。",
    sceneType: "primitive",
    template: "personal_knowledge",
    visibility: "private",
    createdAt: now(60 * 24 * 3),
    updatedAt: now(30),
  },
  {
    id: "space-2",
    title: "AI 短剧《回声纪元》",
    description: "近未来科幻短剧，2150 年的记忆交易员。",
    sceneType: "primitive",
    template: "short_drama_studio",
    visibility: "shared",
    createdAt: now(60 * 24 * 7),
    updatedAt: now(60 * 5),
  },
  {
    id: "space-3",
    title: "工作室一角",
    description: "显示器、镜头、道具，灵感四处散落。",
    sceneType: "primitive",
    template: "personal_knowledge",
    visibility: "private",
    createdAt: now(60 * 24 * 10),
    updatedAt: now(60 * 24 * 1),
  },
];

export const MOCK_HOTSPOTS: Hotspot[] = [
  {
    id: "hot-1",
    spaceId: "space-1",
    cardId: "card-1",
    title: "沙发上的那本书",
    summary: "周末在读的城市传记。",
    position: { x: -1.2, y: 0.1, z: 0.6 },
    color: "#22d3ee",
    icon: "dot",
    createdAt: now(60 * 24),
    updatedAt: now(60 * 6),
  },
  {
    id: "hot-2",
    spaceId: "space-1",
    cardId: "card-2",
    title: "墙上的电影海报",
    summary: "影响了布光的参考。",
    position: { x: 1.4, y: 1.0, z: -0.8 },
    color: "#f472b6",
    icon: "dot",
    createdAt: now(60 * 18),
    updatedAt: now(60 * 2),
  },
  {
    id: "hot-3",
    spaceId: "space-2",
    cardId: "card-3",
    title: "主角设定",
    summary: "林知昼，33 岁，记忆交易员。",
    position: { x: 0, y: 0.1, z: 0.5 },
    color: "#a78bfa",
    icon: "dot",
    createdAt: now(60 * 24 * 5),
    updatedAt: now(60 * 24),
  },
  {
    id: "hot-4",
    spaceId: "space-2",
    cardId: "card-4",
    title: "第 1 集剧情",
    summary: "第一笔记忆交易。",
    position: { x: -1.4, y: 0.1, z: -0.4 },
    color: "#fbbf24",
    icon: "dot",
    createdAt: now(60 * 24 * 4),
    updatedAt: now(60 * 12),
  },
];

export const MOCK_CARDS: KnowledgeCard[] = [
  {
    id: "card-1",
    spaceId: "space-1",
    title: "《被遗忘的城市》读书笔记",
    type: "note",
    content:
      "## 为什么读它\n\n讲的是一座只在黄昏出现的城市，作者用记忆地理学的方法描述街角。\n\n## 启发\n\n- 拍摄时用 *低角度暖光* 复刻那种错觉\n- 给场景加 *飘忽的反射* 暗示存在不稳定\n",
    summary: "城市只在黄昏出现，主角靠记忆重建。",
    tags: ["读书", "城市", "灯光"],
    mediaUrls: [],
    externalLinks: ["https://example.com/book"],
    createdAt: now(60 * 24),
    updatedAt: now(60 * 6),
  },
  {
    id: "card-2",
    spaceId: "space-1",
    title: "《银翼杀手》灯光参考",
    type: "scene",
    content:
      "高对比冷暖光，窗外的霓虹用 *品红 + 青* 互补，主体压暗。",
    summary: "冷暖霓虹对比，主体压暗。",
    tags: ["灯光", "参考"],
    mediaUrls: [],
    externalLinks: [],
    createdAt: now(60 * 18),
    updatedAt: now(60 * 2),
  },
  {
    id: "card-3",
    spaceId: "space-2",
    title: "林知昼",
    type: "character",
    content:
      "## 基础信息\n\n- 33 岁，记忆交易员\n- 性格克制，职业性微笑\n- 习惯动作：转动左手无名指上的旧戒指\n\n## 视觉锚点\n\n- 长大衣 *烟灰色*\n- 发型短而整齐，耳后别一根细银针",
    summary: "33 岁记忆交易员，克制、冷静。",
    tags: ["主角", "近未来"],
    mediaUrls: [],
    externalLinks: [],
    createdAt: now(60 * 24 * 5),
    updatedAt: now(60 * 24),
  },
  {
    id: "card-4",
    spaceId: "space-2",
    title: "第 1 集：空屋来电",
    type: "episode",
    content:
      "## 开场\n\n空荡公寓，林知昼接到一通 *没有来电显示* 的电话。\n\n## 冲突\n\n客户要出售一段 *20 年前的家庭记忆*，但记忆所属者已故。\n\n## 收尾\n\n林知昼拒绝接单，对方说：*你欠我们一个收尾。*",
    summary: "拒绝交易，引出旧债。",
    tags: ["第 1 集", "开场"],
    mediaUrls: [],
    externalLinks: [],
    createdAt: now(60 * 24 * 4),
    updatedAt: now(60 * 12),
  },
];

export function getMockSpace(id: string): Space | undefined {
  return MOCK_SPACES.find((s) => s.id === id);
}

export function getMockHotspots(spaceId: string): Hotspot[] {
  return MOCK_HOTSPOTS.filter((h) => h.spaceId === spaceId);
}

export function getMockCard(id?: string | null): KnowledgeCard | undefined {
  if (!id) return undefined;
  return MOCK_CARDS.find((c) => c.id === id);
}
