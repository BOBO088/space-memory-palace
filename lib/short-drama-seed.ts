// Auto-seed data for the 4 "ready-to-use" templates.
//
// We pre-create six hotspots and six cards per template so the user
// opens a populated 3D board instead of an empty one. The shared
// spec data lives in lib/seed-specs.ts; this file is the runtime
// builder that takes a freshly created Space and emits domain objects.
//
// Templates supported:
//   - short_drama_studio    (AI 短剧导演空间)
//   - ai_entrepreneur_kb    (AI 创业知识库)
//   - personal_second_brain (个人第二大脑)
//   - digital_memory_palace (数字记忆宫殿)
//   - personal_knowledge    (no preset; users build from scratch)

import type { Hotspot, KnowledgeCard, Space, SpaceTemplate } from "./types";
import { SEED_SPECS_BY_TEMPLATE } from "./seed-specs";

export interface ShortDramaSeed {
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
}

const TEMPLATE_KEYS = new Set<SpaceTemplate>([
  "short_drama_studio",
  "ai_entrepreneur_kb",
  "personal_second_brain",
  "digital_memory_palace",
]);

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/** Build the seed hotspots and cards for a freshly created space.
 *  Returns an empty result for templates with no preset (e.g. personal_knowledge). */
export function buildShortDramaSeed(space: Space): ShortDramaSeed {
  const specs = TEMPLATE_KEYS.has(space.template)
    ? SEED_SPECS_BY_TEMPLATE[space.template]
    : [];
  if (!specs || specs.length === 0) {
    return { hotspots: [], cards: [] };
  }
  const now = new Date().toISOString();
  const hotspots: Hotspot[] = [];
  const cards: KnowledgeCard[] = [];
  for (const spec of specs) {
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
