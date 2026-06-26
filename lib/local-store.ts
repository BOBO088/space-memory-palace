// Browser-side persistence layer for Space Memory Palace.
//
// Layout (one localStorage key):
//   smp.v1 -> {
//     schemaVersion: 1,
//     spaces: Space[],
//     hotspotsBySpace: { [spaceId]: Hotspot[] },
//     cardsBySpace: { [spaceId]: KnowledgeCard[] }
//   }
//
// On the very first read we seed from the in-memory mock data so the UI is
// never empty in development. After that, the user's edits always win.

import {
  MOCK_CARDS,
  MOCK_HOTSPOTS,
  MOCK_SPACES,
} from "./mock-data";
import type { Hotspot, KnowledgeCard, Space, SpaceExport } from "./types";

const KEY = "smp.v1";
const SCHEMA_VERSION = 1 as const;

interface Snapshot {
  schemaVersion: typeof SCHEMA_VERSION;
  spaces: Space[];
  hotspotsBySpace: Record<string, Hotspot[]>;
  cardsBySpace: Record<string, KnowledgeCard[]>;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function emptySnapshot(): Snapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    spaces: [],
    hotspotsBySpace: {},
    cardsBySpace: {},
  };
}

function seedSnapshot(): Snapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    spaces: MOCK_SPACES,
    hotspotsBySpace: MOCK_HOTSPOTS.reduce<Record<string, Hotspot[]>>(
      (acc, h) => {
        (acc[h.spaceId] ||= []).push(h);
        return acc;
      },
      {}
    ),
    cardsBySpace: MOCK_CARDS.reduce<Record<string, KnowledgeCard[]>>(
      (acc, c) => {
        (acc[c.spaceId] ||= []).push(c);
        return acc;
      },
      {}
    ),
  };
}

function read(): Snapshot {
  if (!isBrowser()) return seedSnapshot();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const seeded = seedSnapshot();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      // Future versions: migrate or drop. We only have v1 today.
      const seeded = seedSnapshot();
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      spaces: Array.isArray(parsed.spaces) ? parsed.spaces : [],
      hotspotsBySpace: parsed.hotspotsBySpace ?? {},
      cardsBySpace: parsed.cardsBySpace ?? {},
    };
  } catch {
    const seeded = seedSnapshot();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function write(snap: Snapshot): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(snap));
}

// ---------- Public API ----------

export function loadSpaces(): Space[] {
  return read().spaces;
}

export function saveSpaces(spaces: Space[]): void {
  const snap = read();
  write({ ...snap, spaces });
}

export function upsertSpace(space: Space): void {
  const snap = read();
  const idx = snap.spaces.findIndex((s) => s.id === space.id);
  if (idx === -1) snap.spaces.push(space);
  else snap.spaces[idx] = space;
  write(snap);
}

export function deleteSpace(spaceId: string): void {
  const snap = read();
  snap.spaces = snap.spaces.filter((s) => s.id !== spaceId);
  delete snap.hotspotsBySpace[spaceId];
  delete snap.cardsBySpace[spaceId];
  write(snap);
}

export function loadHotspots(spaceId: string): Hotspot[] {
  return read().hotspotsBySpace[spaceId] ?? [];
}

export function saveHotspots(spaceId: string, hotspots: Hotspot[]): void {
  const snap = read();
  snap.hotspotsBySpace[spaceId] = hotspots;
  write(snap);
}

export function loadCards(spaceId: string): KnowledgeCard[] {
  return read().cardsBySpace[spaceId] ?? [];
}

export function saveCards(spaceId: string, cards: KnowledgeCard[]): void {
  const snap = read();
  snap.cardsBySpace[spaceId] = cards;
  write(snap);
}

// ---------- Import / Export ----------

export function exportSpaceJson(spaceId: string): string {
  const snap = read();
  const space = snap.spaces.find((s) => s.id === spaceId);
  if (!space) throw new Error(`Space not found: ${spaceId}`);
  const payload: SpaceExport = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    space,
    hotspots: snap.hotspotsBySpace[spaceId] ?? [],
    cards: snap.cardsBySpace[spaceId] ?? [],
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadSpaceJson(spaceId: string): void {
  if (!isBrowser()) return;
  const json = exportSpaceJson(spaceId);
  const space = read().spaces.find((s) => s.id === spaceId);
  const filename = `${(space?.title || "space").replace(/[^\w一-龥\-]+/g, "_")}-${spaceId}.json`;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function importSpaceJson(json: string): SpaceExport {
  const data = JSON.parse(json) as Partial<SpaceExport>;
  if (data.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion: ${data.schemaVersion}`);
  }
  if (!data.space || !data.space.id) {
    throw new Error("Missing space in import payload");
  }
  const snap = read();
  // Replace existing space with the same id.
  const idx = snap.spaces.findIndex((s) => s.id === data.space!.id);
  if (idx === -1) snap.spaces.push(data.space);
  else snap.spaces[idx] = data.space;
  snap.hotspotsBySpace[data.space.id] = data.hotspots ?? [];
  snap.cardsBySpace[data.space.id] = data.cards ?? [];
  write(snap);
  return data as SpaceExport;
}

/** Reset the store to the seed data; primarily useful in development. */
export function resetToSeed(): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(seedSnapshot()));
}
