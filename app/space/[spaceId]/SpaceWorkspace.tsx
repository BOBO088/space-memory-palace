"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { HotspotPanel } from "@/components/space/HotspotPanel";
import { AiExplainDialog } from "@/components/space/AiExplainDialog";
import { SceneUrlEditor } from "@/components/space/SceneUrlEditor";
import {
  CreateHotspotDialog,
  type CreateHotspotFormValues,
} from "@/components/space/CreateHotspotDialog";
import { SpaceViewer } from "@/components/three/SpaceViewer";
import type { Hotspot, KnowledgeCard, SceneType, Space } from "@/lib/types";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export type SpaceMode = "view" | "edit";

interface SpaceWorkspaceProps {
  spaceId: string;
  mode: SpaceMode;
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`;
}

export function SpaceWorkspace({ spaceId, mode }: SpaceWorkspaceProps) {
  const [hydrated, setHydrated] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null
  );
  const [addHotspotMode, setAddHotspotMode] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<
    { x: number; y: number; z: number } | null
  >(null);
  const [explainingCard, setExplainingCard] = useState<KnowledgeCard | null>(
    null
  );
  const [explainingId, setExplainingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const found = await db.getSpace(spaceId);
        if (cancelled) return;
        setSpace(found);
        if (found) {
          const [hs, cs] = await Promise.all([
            db.listHotspots(spaceId),
            db.listCards(spaceId),
          ]);
          if (cancelled) return;
          setHotspots(hs);
          setCards(cs);
          setSelectedHotspotId(hs[0]?.id ?? null);
        }
      } catch (err) {
        console.error("[space] load failed", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  // Debounced autosave for hotspots & cards.
  useEffect(() => {
    if (!hydrated || !space) return;
    const t = setTimeout(() => {
      db.saveHotspots(spaceId, hotspots).catch((err) =>
        console.error("[space] saveHotspots failed", err)
      );
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, space, spaceId, hotspots]);
  useEffect(() => {
    if (!hydrated || !space) return;
    const t = setTimeout(() => {
      db.saveCards(spaceId, cards).catch((err) =>
        console.error("[space] saveCards failed", err)
      );
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, space, spaceId, cards]);

  const handleCreateSubmit = (values: CreateHotspotFormValues) => {
    if (!pendingPosition) return;
    const now = new Date().toISOString();
    const cardId = makeId("card");
    const hotspotId = makeId("hot");
    const card: KnowledgeCard = {
      id: cardId,
      spaceId,
      title: values.title,
      type: values.type,
      content: values.content,
      summary: values.summary || undefined,
      tags: [],
      mediaUrls: [],
      externalLinks: [],
      createdAt: now,
      updatedAt: now,
    };
    const hotspot: Hotspot = {
      id: hotspotId,
      spaceId,
      cardId,
      title: values.title,
      summary: values.summary || undefined,
      position: pendingPosition,
      color: values.color,
      icon: "dot",
      createdAt: now,
      updatedAt: now,
    };
    setCards((prev) => [...prev, card]);
    setHotspots((prev) => [...prev, hotspot]);
    setSelectedHotspotId(hotspotId);
    setPendingPosition(null);
    setAddHotspotMode(false);
  };

  const persistAiSummary = (cardId: string, text: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, aiSummary: text, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const openExplain = (card: KnowledgeCard) => {
    setExplainingId(card.id);
    setExplainingCard(card);
  };
  const closeExplain = () => {
    setExplainingCard(null);
    setExplainingId(null);
  };

  const handleSceneUrlChange = (url: string, type: SceneType) => {
    if (!space) return;
    const next: Space = {
      ...space,
      sceneUrl: url || null,
      sceneType: type,
      updatedAt: new Date().toISOString(),
    };
    setSpace(next);
    void db.updateSpace(spaceId, { sceneUrl: next.sceneUrl, sceneType: type });
  };

  const empty = useMemo(
    () => hydrated && !!space && hotspots.length === 0,
    [hydrated, space, hotspots]
  );

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center text-sm text-slate-400">
        正在读取空间…
      </div>
    );
  }

  if (!space) {
    return (
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-slate-100">空间不存在</h1>
        <p className="text-sm text-slate-400">
          没有 ID 为 <code className="font-mono text-slate-300">{spaceId}</code> 的空间。
        </p>
        <Link
          href="/dashboard"
          className="rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-4 py-1.5 text-xs font-medium text-slate-950"
        >
          返回空间列表
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-[calc(100vh-3rem)] w-full",
        "grid-cols-1 grid-rows-[55%_45%] lg:grid-cols-[1fr_22rem] lg:grid-rows-1"
      )}
    >
      <section className="relative overflow-hidden border-b border-white/5 lg:border-b-0 lg:border-r">
        <SpaceViewer
          spaceId={space.id}
          spaceTitle={space.title}
          hotspots={hotspots}
          selectedHotspotId={selectedHotspotId}
          mode={mode}
          sceneType={space.sceneType}
          sceneUrl={space.sceneUrl}
          addHotspotMode={mode === "edit" && addHotspotMode}
          onSelectHotspot={setSelectedHotspotId}
          onCreateHotspot={(p) => {
            if (mode !== "edit") return;
            setPendingPosition(p);
          }}
        />
        <div className="pointer-events-auto absolute left-3 top-3 flex flex-col items-start gap-2">
          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddHotspotMode((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs backdrop-blur transition",
                  addHotspotMode
                    ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.4)]"
                    : "border-cyan-400/40 bg-slate-950/70 text-cyan-200 hover:bg-cyan-400/10"
                )}
              >
                {addHotspotMode ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {addHotspotMode ? "取消放置" : "添加热点"}
              </button>
              <span className="hidden text-[11px] text-slate-500 sm:inline">
                {addHotspotMode ? "点击地面放置新热点" : "点击地面创建热点"}
              </span>
            </div>
          )}
          {mode === "edit" && (
            <SceneUrlEditor
              url={space.sceneUrl ?? ""}
              type={space.sceneType}
              onChange={handleSceneUrlChange}
            />
          )}
        </div>
        {/* Hotspot chip strip: quick navigation without hunting in 3D. */}
        {hotspots.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
            <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-slate-950/80 px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              {hotspots.map((h) => {
                const active = h.id === selectedHotspotId;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHotspotId(h.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] transition",
                      active
                        ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.45)]"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                    )}
                    type="button"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: h.color,
                        boxShadow: `0 0 6px ${h.color}`,
                      }}
                    />
                    {h.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
      <HotspotPanel
        hotspots={hotspots}
        cards={cards}
        selectedHotspotId={selectedHotspotId}
        onSelect={setSelectedHotspotId}
        onExplain={openExplain}
        explainingId={explainingId}
        emptyHint={
          empty
            ? "这个空间还没有热点。点击「添加热点」开始放置。"
            : "没有匹配的热点。"
        }
      />
      {pendingPosition && (
        <CreateHotspotDialog
          position={pendingPosition}
          onSubmit={handleCreateSubmit}
          onCancel={() => setPendingPosition(null)}
        />
      )}
      {explainingCard && (
        <AiExplainDialog
          card={explainingCard}
          onClose={closeExplain}
          onPersisted={(text) => persistAiSummary(explainingCard.id, text)}
        />
      )}
    </div>
  );
}
