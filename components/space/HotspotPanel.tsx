"use client";

import { useMemo, useState } from "react";
import { Search, Pin, X } from "lucide-react";
import { CARD_TYPES, type CardType, type Hotspot, type KnowledgeCard } from "@/lib/types";
import { KnowledgeCardView } from "./KnowledgeCard";
import { cn } from "@/lib/cn";

interface HotspotPanelProps {
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
  selectedHotspotId?: string | null;
  onSelect?: (hotspotId: string | null) => void;
  onExplain?: (card: KnowledgeCard) => void;
  explainingId?: string | null;
  emptyHint?: string;
}

export function HotspotPanel({
  hotspots,
  cards,
  selectedHotspotId,
  onSelect,
  onExplain,
  explainingId,
  emptyHint = "这个空间还没有热点。",
}: HotspotPanelProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CardType | "all">("all");

  const cardById = useMemo(() => {
    const m = new Map<string, KnowledgeCard>();
    cards.forEach((c) => m.set(c.id, c));
    return m;
  }, [cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotspots.filter((h) => {
      const card = h.cardId ? cardById.get(h.cardId) : undefined;
      const haystack = [h.title, h.summary ?? "", card?.title ?? "", card?.summary ?? ""]
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (typeFilter !== "all" && card?.type !== typeFilter) return false;
      return true;
    });
  }, [hotspots, cardById, query, typeFilter]);

  const selected = hotspots.find((h) => h.id === selectedHotspotId);
  const selectedCard = selected?.cardId ? cardById.get(selected.cardId) : undefined;

  return (
    <aside className="flex h-full flex-col border-l border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="border-b border-white/5 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索热点或卡片…"
            className="w-full rounded-md border border-white/10 bg-slate-900/60 py-1.5 pl-8 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <TypeChip
            active={typeFilter === "all"}
            onClick={() => setTypeFilter("all")}
            label="全部"
          />
          {CARD_TYPES.map((t) => (
            <TypeChip
              key={t.value}
              active={typeFilter === t.value}
              onClick={() => setTypeFilter(t.value)}
              label={t.label}
              color={t.badge}
            />
          ))}
        </div>
      </div>

      {selected && selectedCard ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Pin className="h-3 w-3" style={{ color: selected.color }} />
              {selected.title}
            </span>
            {onSelect && (
              <button
                onClick={() => onSelect(null)}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] hover:border-white/20"
              >
                <X className="h-3 w-3" /> 取消
              </button>
            )}
          </div>
          <KnowledgeCardView
            card={selectedCard}
            onExplain={onExplain ? () => onExplain(selectedCard) : undefined}
            explaining={explainingId === selectedCard.id}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {hotspots.length === 0 ? (
            <p className="rounded-md border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              {emptyHint}
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-md border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              没有匹配的热点。
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((h) => {
                const card = h.cardId ? cardById.get(h.cardId) : undefined;
                const isActive = h.id === selectedHotspotId;
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => onSelect?.(h.id)}
                      className={cn(
                        "w-full rounded-md border border-white/5 bg-white/5 p-3 text-left transition hover:border-cyan-400/30 hover:bg-white/10",
                        isActive && "border-cyan-400/50 bg-cyan-400/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: h.color, boxShadow: `0 0 8px ${h.color}` }}
                        />
                        <span className="text-sm font-medium text-slate-100">
                          {h.title}
                        </span>
                      </div>
                      {card && (
                        <div className="mt-1 text-xs text-slate-400">
                          {card.title}
                        </div>
                      )}
                      {h.summary && (
                        <p className="mt-1 text-xs text-slate-500">{h.summary}</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}

function TypeChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] transition",
        active
          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
      )}
    >
      {color ? (
        <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", color.split(" ")[0])} />
      ) : null}
      {label}
    </button>
  );
}
