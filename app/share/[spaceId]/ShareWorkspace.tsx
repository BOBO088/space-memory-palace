"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronUp,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { AiExplainDialog } from "@/components/space/AiExplainDialog";
import { KnowledgeCardView } from "@/components/space/KnowledgeCard";
import { SpaceViewer } from "@/components/three/SpaceViewer";
import type { Hotspot, KnowledgeCard, Space } from "@/lib/types";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { getDemoBySlug, isDemoSlug } from "@/lib/demo-spaces";

interface ShareWorkspaceProps {
  spaceId: string;
  initialHotspotId: string | null;
}

// Where the user wants to be contacted. Reads from NEXT_PUBLIC_CONTACT_URL
// at build time; falls back to a sensible default so the share page is
// always actionable in the demo.
const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL || "mailto:hi@example.com?subject=想做一个 3D 空间";

export function ShareWorkspace({
  spaceId,
  initialHotspotId,
}: ShareWorkspaceProps) {
  // (states declared after `isDemo` derivation below)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    initialHotspotId
  );
  const [copied, setCopied] = useState(false);
  const [explainingCard, setExplainingCard] = useState<KnowledgeCard | null>(
    null
  );
  const [mobileCardOpen, setMobileCardOpen] = useState(false);

  // Demos are fully synchronous and self-contained: load them on the
  // very first render so the share page shows real content even on
  // the SSR pass (no client hydration delay for the demo URLs).
  const demoMatch = isDemoSlug(spaceId) ? getDemoBySlug(spaceId) : null;
  const initialSpace = demoMatch?.space ?? null;
  const initialHotspots = demoMatch?.hotspots ?? [];
  const initialCards = demoMatch?.cards ?? [];
  const [space, setSpace] = useState<Space | null>(initialSpace);
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots);
  const [cards, setCards] = useState<KnowledgeCard[]>(initialCards);
  const [hydrated, setHydrated] = useState<boolean>(!!demoMatch);
  const isDemo = !!demoMatch;

  useEffect(() => {
    let cancelled = false;
    // Demo slugs are self-contained and accessible to anyone, on any device.
    // No localStorage / Supabase lookup required.
    if (isDemoSlug(spaceId)) {
      return; // handled synchronously below
    }
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

  // On mobile, the bottom card sheet opens whenever a hotspot is selected.
  useEffect(() => {
    if (selectedHotspotId) setMobileCardOpen(true);
  }, [selectedHotspotId]);

  const cardById = useMemo(() => {
    const m = new Map<string, KnowledgeCard>();
    cards.forEach((c) => m.set(c.id, c));
    return m;
  }, [cards]);

  const selected = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? null,
    [hotspots, selectedHotspotId]
  );
  const selectedCard = selected?.cardId
    ? cardById.get(selected.cardId) ?? null
    : null;

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

  // Match the value prop to whichever demo the user opened. For user
  // spaces (created via the dashboard), default to the catch-all line.
  const valueProp: string = isDemoSlug(space.id)
    ? ({
        "demo-short-drama": "把 3D 空间变成可点击、可讲解的 AI 短剧导演工作台",
        "demo-entrepreneur": "把创业 0→1 的关键决策，变成 3D 房间里可以点、可以问的卡片",
        "demo-second-brain": "把你脑子里的 6 类事情，全部挂在 3D 房间的墙上",
        "demo-memory-palace": "把人类 2500 年的精华，挂在你的 3D 房间里",
      } as Record<string, string>)[space.id] ?? "把真实空间变成可点击、可讲解的知识宫殿"
    : space.template === "short_drama_studio"
      ? "把 3D 空间变成可点击、可讲解的 AI 短剧导演工作台"
      : "把真实空间变成可点击、可讲解的知识宫殿";
  const isShortDrama = space.template === "short_drama_studio";
  return (
    <div className="flex h-[calc(100vh-3rem)] w-full flex-col bg-slate-950">
      {/* Top bar: brand + share + CTA. Always visible, compact. */}
      <div className="z-30 flex items-center gap-3 border-b border-white/5 bg-slate-950/85 px-4 py-2 backdrop-blur-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-slate-950">
            <Share2 className="h-3.5 w-3.5" />
          </span>
          <span className="hidden sm:inline">Space Memory Palace</span>
        </Link>
        <span className="hidden items-center gap-1 rounded-md border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300 sm:inline-flex">
          {isDemo ? (
            <>
              <Share2 className="h-3 w-3" /> 公开示例
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> 分享预览 · 只读
            </>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-slate-950/70 px-2.5 py-1 text-xs text-cyan-200 transition hover:bg-cyan-400/10"
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "已复制" : "复制链接"}
          </button>
          <a
            href={CONTACT_URL}
            className="hidden items-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-3 py-1 text-xs font-medium text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_24px_rgba(217,70,239,0.45)] sm:inline-flex"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            联系我做一个
          </a>
        </div>
      </div>

      {/* Hero: title + 1-line value prop. Hidden on tiny screens to save
          vertical space — the 3D viewer is the real hero on mobile. */}
      <section className="relative hidden border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/80 px-5 py-4 sm:block">
        <div className="mx-auto flex max-w-6xl flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200">
            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-300" />
            {isDemo
              ? "公开示例 · 任何人可看"
              : isShortDrama
                ? "AI 短剧导演空间"
                : "3D 知识空间"}
          </span>
          <h1 className="text-2xl font-semibold leading-tight text-slate-50 sm:text-3xl">
            {space.title}
          </h1>
          <p className="max-w-3xl text-sm text-slate-300">{valueProp}。</p>
        </div>
      </section>

      {/* Main: 3D on top, hotspot chips below, selected card on the right (desktop) */}
      <div
        className={cn(
          "grid w-full flex-1 min-h-0",
          "grid-cols-1 grid-rows-[1fr_auto]",
          "lg:grid-cols-[1fr_24rem] lg:grid-rows-1"
        )}
      >
        <section className="relative min-h-0 overflow-hidden">
          <SpaceViewer
            spaceId={space.id}
            spaceTitle={space.title}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            mode="view"
            sceneType={space.sceneType}
            sceneUrl={space.sceneUrl}
            onSelectHotspot={setSelectedHotspotId}
          />
          {/* Hotspot chips: a discoverable way to switch between hotspots
              without having to hunt for them in 3D. Sits over the 3D bottom. */}
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

        {/* Desktop right-rail card. Persistent, scrollable. */}
        <aside className="hidden min-h-0 flex-col border-l border-white/5 bg-slate-950/70 backdrop-blur-xl lg:flex">
          {selected && selectedCard ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      background: selected.color,
                      boxShadow: `0 0 8px ${selected.color}`,
                    }}
                  />
                  <span className="font-medium text-slate-200">
                    {selected.title}
                  </span>
                  <span>· {hotspots.length} 个热点</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <KnowledgeCardView
                  card={selectedCard}
                  onExplain={() => setExplainingCard(selectedCard)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-400">
              <div>
                <p className="mb-2 text-slate-200">从下面选一个热点开始</p>
                <p className="text-xs text-slate-500">
                  或者在 3D 房间里直接点击高亮圆点
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile bottom sheet */}
        <div
          className={cn(
            "lg:hidden absolute inset-x-0 bottom-0 z-30 transition-transform",
            mobileCardOpen
              ? "translate-y-0"
              : "translate-y-[calc(100%-3rem)]"
          )}
        >
          <div className="rounded-t-2xl border-t border-white/10 bg-slate-950/95 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setMobileCardOpen((v) => !v)}
              className="flex w-full items-center justify-center pt-2"
              aria-label={mobileCardOpen ? "收起" : "展开"}
            >
              <span className="h-1.5 w-10 rounded-full bg-white/20" />
            </button>
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ChevronUp
                  className={cn(
                    "h-3 w-3 transition",
                    mobileCardOpen ? "" : "rotate-180"
                  )}
                />
                {selected ? `${selected.title}` : "从下面选一个热点"} · {hotspots.length} 个
              </span>
              {mobileCardOpen && selected && (
                <button
                  onClick={() => {
                    setMobileCardOpen(false);
                    setSelectedHotspotId(null);
                  }}
                  className="rounded-md p-1 hover:bg-white/5"
                  aria-label="关闭"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {selected && selectedCard && (
              <div className="max-h-[60vh] overflow-y-auto p-3 pb-4">
                <KnowledgeCardView
                  card={selectedCard}
                  onExplain={() => setExplainingCard(selectedCard)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA strip — sales surface. Always visible on mobile. */}
      <div className="z-20 flex items-center justify-between gap-3 border-t border-white/5 bg-slate-950/90 px-4 py-2.5 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-300">
            想要一个这样的 3D 空间？
          </p>
          <p className="hidden truncate text-[10px] text-slate-500 sm:block">
            12 集短剧 / 课程 / 展馆 · 1 周交付
          </p>
        </div>
        <a
          href={CONTACT_URL}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
        >
          <Mail className="h-3.5 w-3.5" />
          咨询做一个
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
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
