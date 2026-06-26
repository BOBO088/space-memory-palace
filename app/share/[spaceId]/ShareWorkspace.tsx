"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Link as LinkIcon, Lock, Share2, X } from "lucide-react";
import { HotspotPanel } from "@/components/space/HotspotPanel";
import { AiExplainDialog } from "@/components/space/AiExplainDialog";
import { SpaceViewer } from "@/components/three/SpaceViewer";
import type { Hotspot, KnowledgeCard, Space } from "@/lib/types";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

interface ShareWorkspaceProps {
  spaceId: string;
  initialHotspotId: string | null;
}

export function ShareWorkspace({
  spaceId,
  initialHotspotId,
}: ShareWorkspaceProps) {
  const [hydrated, setHydrated] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    initialHotspotId
  );
  const [copied, setCopied] = useState(false);
  const [explainingCard, setExplainingCard] = useState<KnowledgeCard | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

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
          setSelectedHotspotId((cur) => cur ?? hs[0]?.id ?? null);
        }
      } catch (err) {
        console.error("[share] load failed", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  // Mobile bottom sheet: open when a hotspot becomes selected.
  useEffect(() => {
    if (selectedHotspotId) setSheetOpen(true);
  }, [selectedHotspotId]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/share/${spaceId}`;
    return selectedHotspotId ? `${base}?hotspot=${selectedHotspotId}` : base;
  }, [spaceId, selectedHotspotId]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

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
    <div className="flex h-[calc(100vh-3rem)] w-full flex-col">
      {/* Top strip: title + share + badge */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-slate-950/70 px-4 py-2 backdrop-blur-xl">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-slate-950">
          <Share2 className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-slate-100">
            {space.title}
          </h1>
          {space.description && (
            <p className="truncate text-[11px] text-slate-400">
              {space.description}
            </p>
          )}
        </div>
        <span className="hidden items-center gap-1 rounded-md border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300 sm:inline-flex">
          <Lock className="h-3 w-3" /> 只读
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-slate-950/70 px-2.5 py-1 text-xs text-cyan-200 transition hover:bg-cyan-400/10"
          type="button"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          {copied ? "已复制" : "复制分享链接"}
        </button>
      </div>

      {/* Main: 3D + side panel (desktop) or fullscreen 3D + bottom sheet (mobile) */}
      <div
        className={cn(
          "grid w-full flex-1 min-h-0",
          "grid-cols-1 grid-rows-[55%_45%]",
          "lg:grid-cols-[1fr_22rem] lg:grid-rows-1"
        )}
      >
        <section className="relative overflow-hidden border-b border-white/5 lg:border-b-0 lg:border-r">
          <SpaceViewer
            spaceId={space.id}
            spaceTitle={space.title}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            mode="view"
            sceneType={space.sceneType}
            sceneUrl={space.sceneUrl}
            onSelectHotspot={(id) => {
              setSelectedHotspotId(id);
              if (id) setSheetOpen(true);
            }}
          />
        </section>
        {/* Desktop side panel */}
        <div className="hidden lg:block">
          <HotspotPanel
            hotspots={hotspots}
            cards={cards}
            selectedHotspotId={selectedHotspotId}
            onSelect={setSelectedHotspotId}
            onExplain={setExplainingCard}
            emptyHint="这个空间还没有热点。"
          />
        </div>
        {/* Mobile bottom sheet */}
        <div
          className={cn(
            "lg:hidden absolute inset-x-0 bottom-0 z-30 transition-transform",
            sheetOpen
              ? "translate-y-0"
              : "translate-y-[calc(100%-3.25rem)]"
          )}
        >
          <div className="rounded-t-2xl border-t border-white/10 bg-slate-950/95 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setSheetOpen((v) => !v)}
              className="flex w-full items-center justify-center pt-2"
              aria-label={sheetOpen ? "收起" : "展开"}
            >
              <span className="h-1.5 w-10 rounded-full bg-white/20" />
            </button>
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> 只读 · {hotspots.length} 个热点
              </span>
              {sheetOpen && (
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    setSelectedHotspotId(null);
                  }}
                  className="rounded-md p-1 hover:bg-white/5"
                  aria-label="关闭"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto pb-3">
              <HotspotPanel
                hotspots={hotspots}
                cards={cards}
                selectedHotspotId={selectedHotspotId}
                onSelect={setSelectedHotspotId}
                onExplain={setExplainingCard}
                emptyHint="这个空间还没有热点。"
              />
            </div>
          </div>
        </div>
      </div>

      {explainingCard && (
        <AiExplainDialog
          card={explainingCard}
          onClose={() => setExplainingCard(null)}
        />
      )}
    </div>
  );
}
