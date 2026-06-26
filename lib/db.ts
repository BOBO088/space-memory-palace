// Unified data layer for Space Memory Palace.
//
// Behavior:
//   - When Supabase env vars are present, all reads/writes go to the
//     cloud (schemaVersion 1; see supabase/schema.sql).
//   - Otherwise we fall back to the localStorage layer; this lets the
//     app stay usable in development and offline without configuration.
//
// All functions are async so callers don't need to branch on the
// backend at every call site.

import { isSupabaseConfigured, getSupabase } from "./supabase-client";
import * as local from "./local-store";
import type {
  Hotspot,
  KnowledgeCard,
  SceneType,
  Space,
  SpaceExport,
  SpaceTemplate,
  Visibility,
  CardType,
} from "./types";

function isCloud() {
  return isSupabaseConfigured();
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

// ---------- Mapping helpers (DB row <-> domain model) ----------

interface SpaceRow {
  id: string;
  title: string;
  description: string | null;
  scene_url: string | null;
  scene_type: string;
  cover_url: string | null;
  template: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

function rowToSpace(r: SpaceRow): Space {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    sceneUrl: r.scene_url,
    sceneType: (r.scene_type as SceneType) ?? "splat",
    coverUrl: r.cover_url,
    template: (r.template as SpaceTemplate) ?? "personal_knowledge",
    visibility: (r.visibility as Visibility) ?? "private",
    createdAt: r.created_at ?? nowIso(),
    updatedAt: r.updated_at ?? nowIso(),
  };
}

function spaceToRow(s: Space) {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? null,
    scene_url: s.sceneUrl ?? null,
    scene_type: s.sceneType,
    cover_url: s.coverUrl ?? null,
    template: s.template,
    visibility: s.visibility,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

interface HotspotRow {
  id: string;
  space_id: string;
  card_id: string | null;
  title: string;
  summary: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

function rowToHotspot(r: HotspotRow): Hotspot {
  return {
    id: r.id,
    spaceId: r.space_id,
    cardId: r.card_id,
    title: r.title,
    summary: r.summary ?? undefined,
    position: { x: r.position_x, y: r.position_y, z: r.position_z },
    color: r.color ?? "#ffffff",
    icon: r.icon ?? "dot",
    createdAt: r.created_at ?? nowIso(),
    updatedAt: r.updated_at ?? nowIso(),
  };
}

function hotspotToRow(h: Hotspot) {
  return {
    id: h.id,
    space_id: h.spaceId,
    card_id: h.cardId ?? null,
    title: h.title,
    summary: h.summary ?? null,
    position_x: h.position.x,
    position_y: h.position.y,
    position_z: h.position.z,
    color: h.color,
    icon: h.icon,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
  };
}

interface CardRow {
  id: string;
  space_id: string;
  title: string;
  type: string;
  content: string | null;
  ai_summary: string | null;
  tags: unknown;
  media_urls: unknown;
  external_links: unknown;
  created_at: string;
  updated_at: string;
}

function rowToCard(r: CardRow): KnowledgeCard {
  return {
    id: r.id,
    spaceId: r.space_id,
    title: r.title,
    type: (r.type as CardType) ?? "note",
    content: r.content ?? "",
    summary: undefined,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    mediaUrls: Array.isArray(r.media_urls) ? (r.media_urls as string[]) : [],
    externalLinks: Array.isArray(r.external_links)
      ? (r.external_links as string[])
      : [],
    aiSummary: r.ai_summary ?? undefined,
    createdAt: r.created_at ?? nowIso(),
    updatedAt: r.updated_at ?? nowIso(),
  };
}

function cardToRow(c: KnowledgeCard) {
  return {
    id: c.id,
    space_id: c.spaceId,
    title: c.title,
    type: c.type,
    content: c.content,
    ai_summary: c.aiSummary ?? null,
    tags: c.tags,
    media_urls: c.mediaUrls,
    external_links: c.externalLinks,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

// ---------- Public API ----------

export interface CreateSpaceInput {
  title: string;
  description?: string;
  template: SpaceTemplate;
  sceneType?: SceneType;
  sceneUrl?: string | null;
  visibility?: Visibility;
}

export const db = {
  isCloud,

  // ---- Spaces ----
  async listSpaces(): Promise<Space[]> {
    if (!isCloud()) return local.loadSpaces();
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("spaces")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => rowToSpace(r as SpaceRow));
  },

  async getSpace(id: string): Promise<Space | null> {
    if (!isCloud()) return local.loadSpaces().find((s) => s.id === id) ?? null;
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("spaces")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToSpace(data as SpaceRow) : null;
  },

  async createSpace(input: CreateSpaceInput): Promise<Space> {
    if (!isCloud()) {
      const now = nowIso();
      const space: Space = {
        id: newId("space"),
        title: input.title,
        description: input.description,
        sceneType: input.sceneType ?? "primitive",
        sceneUrl: input.sceneUrl ?? null,
        template: input.template,
        visibility: input.visibility ?? "private",
        createdAt: now,
        updatedAt: now,
      };
      local.upsertSpace(space);
      return space;
    }
    const sb = getSupabase()!;
    const now = nowIso();
    const id = crypto.randomUUID();
    const row = {
      id,
      title: input.title,
      description: input.description ?? null,
      scene_url: input.sceneUrl ?? null,
      scene_type: input.sceneType ?? "splat",
      template: input.template,
      visibility: input.visibility ?? "private",
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await sb.from("spaces").insert(row).select().single();
    if (error) throw error;
    return rowToSpace(data as SpaceRow);
  },

  async updateSpace(id: string, patch: Partial<Space>): Promise<Space> {
    if (!isCloud()) {
      const cur = local.loadSpaces().find((s) => s.id === id);
      if (!cur) throw new Error(`Space not found: ${id}`);
      const next: Space = { ...cur, ...patch, updatedAt: nowIso() };
      local.upsertSpace(next);
      return next;
    }
    const sb = getSupabase()!;
    const cur = await db.getSpace(id);
    if (!cur) throw new Error(`Space not found: ${id}`);
    const merged = { ...cur, ...patch, updatedAt: nowIso() };
    const row = spaceToRow(merged);
    const { data, error } = await sb
      .from("spaces")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToSpace(data as SpaceRow);
  },

  async deleteSpace(id: string): Promise<void> {
    if (!isCloud()) {
      local.deleteSpace(id);
      return;
    }
    const sb = getSupabase()!;
    const { error } = await sb.from("spaces").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Hotspots ----
  async listHotspots(spaceId: string): Promise<Hotspot[]> {
    if (!isCloud()) return local.loadHotspots(spaceId);
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("hotspots")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToHotspot(r as HotspotRow));
  },

  async createHotspot(input: Omit<Hotspot, "createdAt" | "updatedAt">): Promise<Hotspot> {
    if (!isCloud()) {
      const cur = local.loadHotspots(input.spaceId);
      const next: Hotspot = { ...input, createdAt: nowIso(), updatedAt: nowIso() };
      local.saveHotspots(input.spaceId, [...cur, next]);
      return next;
    }
    const sb = getSupabase()!;
    const now = nowIso();
    const row = {
      id: input.id || crypto.randomUUID(),
      space_id: input.spaceId,
      card_id: input.cardId ?? null,
      title: input.title,
      summary: input.summary ?? null,
      position_x: input.position.x,
      position_y: input.position.y,
      position_z: input.position.z,
      color: input.color,
      icon: input.icon,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await sb.from("hotspots").insert(row).select().single();
    if (error) throw error;
    return rowToHotspot(data as HotspotRow);
  },

  async updateHotspot(
    id: string,
    patch: Partial<Omit<Hotspot, "id" | "spaceId" | "createdAt">>
  ): Promise<Hotspot> {
    if (!isCloud()) {
      // Walk every space to find the hotspot (cheap; small dataset).
      const spaces = local.loadSpaces();
      for (const s of spaces) {
        const cur = local.loadHotspots(s.id);
        const idx = cur.findIndex((h) => h.id === id);
        if (idx !== -1) {
          const next: Hotspot = {
            ...cur[idx],
            ...patch,
            updatedAt: nowIso(),
          };
          const arr = [...cur];
          arr[idx] = next;
          local.saveHotspots(s.id, arr);
          return next;
        }
      }
      throw new Error(`Hotspot not found: ${id}`);
    }
    const sb = getSupabase()!;
    const merged: Record<string, unknown> = { updated_at: nowIso() };
    if (patch.title !== undefined) merged.title = patch.title;
    if (patch.summary !== undefined) merged.summary = patch.summary;
    if (patch.color !== undefined) merged.color = patch.color;
    if (patch.icon !== undefined) merged.icon = patch.icon;
    if (patch.cardId !== undefined) merged.card_id = patch.cardId;
    if (patch.position)
      Object.assign(merged, {
        position_x: patch.position.x,
        position_y: patch.position.y,
        position_z: patch.position.z,
      });
    const { data, error } = await sb
      .from("hotspots")
      .update(merged)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToHotspot(data as HotspotRow);
  },

  async deleteHotspot(id: string): Promise<void> {
    if (!isCloud()) {
      const spaces = local.loadSpaces();
      for (const s of spaces) {
        const cur = local.loadHotspots(s.id);
        if (cur.some((h) => h.id === id)) {
          local.saveHotspots(
            s.id,
            cur.filter((h) => h.id !== id)
          );
          return;
        }
      }
      return;
    }
    const sb = getSupabase()!;
    const { error } = await sb.from("hotspots").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Cards ----
  async listCards(spaceId: string): Promise<KnowledgeCard[]> {
    if (!isCloud()) return local.loadCards(spaceId);
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("cards")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToCard(r as CardRow));
  },

  async createCard(
    input: Omit<KnowledgeCard, "createdAt" | "updatedAt">
  ): Promise<KnowledgeCard> {
    if (!isCloud()) {
      const cur = local.loadCards(input.spaceId);
      const next: KnowledgeCard = { ...input, createdAt: nowIso(), updatedAt: nowIso() };
      local.saveCards(input.spaceId, [...cur, next]);
      return next;
    }
    const sb = getSupabase()!;
    const now = nowIso();
    const row = {
      id: input.id || crypto.randomUUID(),
      space_id: input.spaceId,
      title: input.title,
      type: input.type,
      content: input.content,
      ai_summary: input.aiSummary ?? null,
      tags: input.tags,
      media_urls: input.mediaUrls,
      external_links: input.externalLinks,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await sb.from("cards").insert(row).select().single();
    if (error) throw error;
    return rowToCard(data as CardRow);
  },

  async updateCard(
    id: string,
    patch: Partial<Omit<KnowledgeCard, "id" | "spaceId" | "createdAt">>
  ): Promise<KnowledgeCard> {
    if (!isCloud()) {
      const spaces = local.loadSpaces();
      for (const s of spaces) {
        const cur = local.loadCards(s.id);
        const idx = cur.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const next: KnowledgeCard = { ...cur[idx], ...patch, updatedAt: nowIso() };
          const arr = [...cur];
          arr[idx] = next;
          local.saveCards(s.id, arr);
          return next;
        }
      }
      throw new Error(`Card not found: ${id}`);
    }
    const sb = getSupabase()!;
    const merged: Record<string, unknown> = { updated_at: nowIso() };
    if (patch.title !== undefined) merged.title = patch.title;
    if (patch.type !== undefined) merged.type = patch.type;
    if (patch.content !== undefined) merged.content = patch.content;
    if (patch.aiSummary !== undefined) merged.ai_summary = patch.aiSummary;
    if (patch.tags !== undefined) merged.tags = patch.tags;
    if (patch.mediaUrls !== undefined) merged.media_urls = patch.mediaUrls;
    if (patch.externalLinks !== undefined)
      merged.external_links = patch.externalLinks;
    const { data, error } = await sb
      .from("cards")
      .update(merged)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToCard(data as CardRow);
  },

  async deleteCard(id: string): Promise<void> {
    if (!isCloud()) {
      const spaces = local.loadSpaces();
      for (const s of spaces) {
        const cur = local.loadCards(s.id);
        if (cur.some((c) => c.id === id)) {
          local.saveCards(
            s.id,
            cur.filter((c) => c.id !== id)
          );
          return;
        }
      }
      return;
    }
    const sb = getSupabase()!;
    const { error } = await sb.from("cards").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Import / Export (local-only convenience; works either backend) ----
  async exportSpace(spaceId: string): Promise<SpaceExport> {
    if (!isCloud()) {
      // local-store ships a synchronous JSON builder; use it directly.
      const json = local.exportSpaceJson(spaceId);
      return JSON.parse(json) as SpaceExport;
    }
    const sb = getSupabase()!;
    const [{ data: spaceRow, error: e1 }, { data: hsRows, error: e2 }, { data: cardRows, error: e3 }] =
      await Promise.all([
        sb.from("spaces").select("*").eq("id", spaceId).maybeSingle(),
        sb.from("hotspots").select("*").eq("space_id", spaceId),
        sb.from("cards").select("*").eq("space_id", spaceId),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    if (!spaceRow) throw new Error(`Space not found: ${spaceId}`);
    return {
      schemaVersion: 1,
      exportedAt: nowIso(),
      space: rowToSpace(spaceRow as SpaceRow),
      hotspots: (hsRows ?? []).map((r) => rowToHotspot(r as HotspotRow)),
      cards: (cardRows ?? []).map((r) => rowToCard(r as CardRow)),
    };
  },


  // ---- Bulk replace (used for autosave flows in the workspace) ----
  async saveHotspots(spaceId: string, hotspots: Hotspot[]): Promise<void> {
    if (!isCloud()) {
      local.saveHotspots(spaceId, hotspots);
      return;
    }
    const sb = getSupabase()!;
    const { data: existing, error: e1 } = await sb
      .from("hotspots")
      .select("id")
      .eq("space_id", spaceId);
    if (e1) throw e1;
    const incomingIds = new Set(hotspots.map((h) => h.id));
    const toDelete = (existing ?? [])
      .map((r) => (r as { id: string }).id)
      .filter((id) => !incomingIds.has(id));
    if (toDelete.length) {
      const { error } = await sb.from("hotspots").delete().in("id", toDelete);
      if (error) throw error;
    }
    if (hotspots.length) {
      const { error } = await sb
        .from("hotspots")
        .upsert(hotspots.map(hotspotToRow));
      if (error) throw error;
    }
  },

  async saveCards(spaceId: string, cards: KnowledgeCard[]): Promise<void> {
    if (!isCloud()) {
      local.saveCards(spaceId, cards);
      return;
    }
    const sb = getSupabase()!;
    const { data: existing, error: e1 } = await sb
      .from("cards")
      .select("id")
      .eq("space_id", spaceId);
    if (e1) throw e1;
    const incomingIds = new Set(cards.map((c) => c.id));
    const toDelete = (existing ?? [])
      .map((r) => (r as { id: string }).id)
      .filter((id) => !incomingIds.has(id));
    if (toDelete.length) {
      const { error } = await sb.from("cards").delete().in("id", toDelete);
      if (error) throw error;
    }
    if (cards.length) {
      const { error } = await sb.from("cards").upsert(cards.map(cardToRow));
      if (error) throw error;
    }
  },

  async importSpace(payload: SpaceExport): Promise<SpaceExport> {
    if (!isCloud()) {
      return local.importSpaceJson(JSON.stringify(payload));
    }
    const sb = getSupabase()!;
    const { error: e1 } = await sb
      .from("spaces")
      .upsert(spaceToRow(payload.space));
    if (e1) throw e1;
    // Replace hotspots and cards wholesale for this space.
    await sb.from("hotspots").delete().eq("space_id", payload.space.id);
    await sb.from("cards").delete().eq("space_id", payload.space.id);
    if (payload.hotspots.length) {
      const { error } = await sb
        .from("hotspots")
        .insert(payload.hotspots.map(hotspotToRow));
      if (error) throw error;
    }
    if (payload.cards.length) {
      const { error } = await sb
        .from("cards")
        .insert(payload.cards.map(cardToRow));
      if (error) throw error;
    }
    return payload;
  },
};

export type Db = typeof db;
