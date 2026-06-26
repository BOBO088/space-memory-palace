// Markdown exporters for Space Memory Palace.
//
// Given a SpaceExport payload, we produce one or more Markdown files
// suitable for sharing or archiving. The short_drama_studio template
// also gets a small set of structured files (IP Bible, Character
// Cards, Episode Outline, Prompt Library) that the user can hand to
// collaborators.

import type { CardType, KnowledgeCard, Space, SpaceExport } from "./types";
import { CARD_TYPES } from "./types";

export interface ExportedFile {
  filename: string;
  content: string;
  /** Used by the UI to label buttons ("JSON / Markdown / IP Bible …"). */
  label: string;
}

const TYPE_LABEL = (t: CardType) =>
  CARD_TYPES.find((c) => c.value === t)?.label ?? t;

function safeName(s: string) {
  return s.replace(/[^\w一-龥\-]+/g, "_").replace(/_+/g, "_") || "space";
}

function frontMatter(space: Space): string {
  const lines: string[] = [
    "---",
    `title: ${JSON.stringify(space.title)}`,
    `template: ${space.template}`,
    `visibility: ${space.visibility}`,
    `sceneType: ${space.sceneType}`,
    `sceneUrl: ${space.sceneUrl ?? ""}`,
    `updatedAt: ${space.updatedAt}`,
    "---",
  ];
  return lines.join("\n");
}

function section(title: string, level: number) {
  return `${"#".repeat(level)} ${title}\n`;
}

function cardBlock(card: KnowledgeCard, opts?: { showMeta?: boolean }): string {
  const parts: string[] = [];
  parts.push(`## ${card.title}`);
  const meta: string[] = [];
  meta.push(`类型：${TYPE_LABEL(card.type)}`);
  if (card.tags.length) meta.push(`标签：${card.tags.join("、")}`);
  if (opts?.showMeta !== false) parts.push(meta.join(" · "));
  if (card.summary) parts.push(`\n> ${card.summary}\n`);
  parts.push("");
  parts.push(card.content || "（无正文）");
  parts.push("");
  if (card.aiSummary) {
    parts.push(`### AI 讲解`);
    parts.push(card.aiSummary);
    parts.push("");
  }
  return parts.join("\n");
}

function index(s: SpaceExport, cards: KnowledgeCard[]): string {
  const out: string[] = [];
  out.push(frontMatter(s.space));
  out.push(`# ${s.space.title}`);
  if (s.space.description) out.push(`\n${s.space.description}\n`);
  out.push("");
  out.push(`导出时间：${s.exportedAt}`);
  out.push(`热点数：${s.hotspots.length} · 卡片数：${s.cards.length}`);
  out.push("");
  out.push(section("目录", 2));
  for (const c of cards) {
    out.push(`- [${c.title}](#${anchor(c.title)}) · ${TYPE_LABEL(c.type)}`);
  }
  out.push("");
  out.push(section("热点坐标", 2));
  out.push("| 热点 | 标题 | x | y | z |");
  out.push("| --- | --- | --- | --- | --- |");
  for (const h of s.hotspots) {
    const c = cards.find((x) => x.id === h.cardId);
    out.push(
      `| ${h.title} | ${c?.title ?? "—"} | ${h.position.x.toFixed(2)} | ${h.position.y.toFixed(2)} | ${h.position.z.toFixed(2)} |`
    );
  }
  out.push("");
  out.push(section("全部卡片", 2));
  for (const c of cards) out.push(cardBlock(c));
  return out.join("\n");
}

function anchor(s: string) {
  return s
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w一-龥\-]+/g, "");
}

function pickByType(cards: KnowledgeCard[], type: CardType) {
  return cards.filter((c) => c.type === type);
}

function pickByTitleAny(cards: KnowledgeCard[], titles: string[]) {
  const set = new Set(titles);
  return cards.filter((c) => set.has(c.title.trim()));
}

function ipBible(s: SpaceExport, cards: KnowledgeCard[]): string {
  const out: string[] = [];
  out.push(frontMatter(s.space));
  out.push(`# IP Bible · ${s.space.title}`);
  out.push("");
  out.push(`> 一份可发送给合作方的世界观 + 角色 + 剧情概览。`);
  out.push(`> 导出时间：${s.exportedAt}`);
  out.push("");

  const charCards = pickByType(cards, "character");
  const sceneCards = pickByType(cards, "scene");
  const epCards = pickByType(cards, "episode");
  const noteCards = pickByType(cards, "note");

  if (charCards.length) {
    out.push(section("角色", 2));
    for (const c of charCards) out.push(cardBlock(c));
  }
  if (sceneCards.length) {
    out.push(section("世界观 / 场景", 2));
    for (const c of sceneCards) out.push(cardBlock(c));
  }
  if (epCards.length) {
    out.push(section("分集剧情", 2));
    for (const c of epCards) out.push(cardBlock(c));
  }
  if (noteCards.length) {
    out.push(section("设定笔记", 2));
    for (const c of noteCards) out.push(cardBlock(c));
  }
  return out.join("\n");
}

function characterCards(s: SpaceExport, cards: KnowledgeCard[]): string {
  const out: string[] = [];
  out.push(frontMatter(s.space));
  out.push(`# Character Cards · ${s.space.title}`);
  out.push("");
  const list = pickByType(cards, "character");
  if (!list.length) {
    out.push("（暂无 character 类型的卡片）");
  }
  for (const c of list) out.push(cardBlock(c));
  return out.join("\n");
}

function episodeOutline(s: SpaceExport, cards: KnowledgeCard[]): string {
  const out: string[] = [];
  out.push(frontMatter(s.space));
  out.push(`# Episode Outline · ${s.space.title}`);
  out.push("");
  const list = pickByType(cards, "episode");
  if (!list.length) {
    // Fallback: any card with "第" in the title
    const fallback = cards.filter((c) => /第\s*\d+\s*[集话]/.test(c.title));
    if (!fallback.length) {
      out.push("（暂无 episode 类型或分集命名的卡片）");
    } else {
      for (const c of fallback) out.push(cardBlock(c));
    }
  } else {
    for (const c of list) out.push(cardBlock(c));
  }
  return out.join("\n");
}

function promptLibrary(s: SpaceExport, cards: KnowledgeCard[]): string {
  const out: string[] = [];
  out.push(frontMatter(s.space));
  out.push(`# Prompt Library · ${s.space.title}`);
  out.push("");
  const list = pickByType(cards, "prompt");
  if (!list.length) {
    // Fallback: cards with "提示词" in the title
    const fallback = pickByTitleAny(cards, ["提示词库"]);
    if (!fallback.length) {
      out.push("（暂无 prompt 类型或提示词库卡片）");
    } else {
      for (const c of fallback) out.push(cardBlock(c));
    }
  } else {
    for (const c of list) out.push(cardBlock(c));
  }
  return out.join("\n");
}

/** Build the export file list for a given space. */
export function planExport(payload: SpaceExport): ExportedFile[] {
  const base = safeName(payload.space.title);
  const files: ExportedFile[] = [];

  files.push({
    filename: `${base}-${payload.space.id}.json`,
    label: "JSON",
    content: JSON.stringify(payload, null, 2),
  });

  files.push({
    filename: `${base}-${payload.space.id}.md`,
    label: "Markdown",
    content: index(payload, payload.cards),
  });

  if (payload.space.template === "short_drama_studio") {
    files.push({
      filename: `${base}-IP-Bible.md`,
      label: "IP Bible",
      content: ipBible(payload, payload.cards),
    });
    files.push({
      filename: `${base}-Character-Cards.md`,
      label: "Character Cards",
      content: characterCards(payload, payload.cards),
    });
    files.push({
      filename: `${base}-Episode-Outline.md`,
      label: "Episode Outline",
      content: episodeOutline(payload, payload.cards),
    });
    files.push({
      filename: `${base}-Prompt-Library.md`,
      label: "Prompt Library",
      content: promptLibrary(payload, payload.cards),
    });
  }

  return files;
}

/** Trigger a browser download for a list of files. Used by the UI. */
export function downloadFiles(files: ExportedFile[]): void {
  if (typeof window === "undefined") return;
  if (files.length === 1) {
    const f = files[0];
    const blob = new Blob([f.content], {
      type: f.filename.endsWith(".json")
        ? "application/json"
        : "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  // Multi-file export: walk them one after another with a short delay.
  files.forEach((f, i) => {
    setTimeout(() => {
      const blob = new Blob([f.content], {
        type: f.filename.endsWith(".json")
          ? "application/json"
          : "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, i * 250);
  });
}
