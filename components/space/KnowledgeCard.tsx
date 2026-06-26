import ReactMarkdown from "react-markdown";
import { Calendar, Tag, ExternalLink, Sparkles } from "lucide-react";
import { CARD_TYPES, type KnowledgeCard } from "@/lib/types";
import { cn } from "@/lib/cn";

interface KnowledgeCardViewProps {
  card: KnowledgeCard;
  className?: string;
  /** Show a compact "AI 讲解" button placeholder (wired in phase 6). */
  onExplain?: () => void;
  explaining?: boolean;
}

export function KnowledgeCardView({
  card,
  className,
  onExplain,
  explaining,
}: KnowledgeCardViewProps) {
  const meta = CARD_TYPES.find((t) => t.value === card.type);
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_8px_40px_-12px_rgba(34,211,238,0.25)] backdrop-blur",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            meta?.badge
          )}
        >
          {meta?.label ?? card.type}
        </span>
        <h2 className="text-lg font-semibold text-slate-50">{card.title}</h2>
      </header>

      {card.summary && (
        <p className="mb-3 text-sm text-slate-300/90">{card.summary}</p>
      )}

      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-100 prose-strong:text-cyan-200 prose-em:text-fuchsia-200">
        <ReactMarkdown>{card.content}</ReactMarkdown>
      </div>

      {card.aiSummary && (
        <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-100/90">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-3 w-3" /> AI 讲解
          </div>
          {card.aiSummary}
        </div>
      )}

      {card.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Tag className="h-3 w-3" />
          {card.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(card.updatedAt).toLocaleString("zh-CN", { hour12: false })}
        </span>
        <div className="flex items-center gap-2">
          {card.externalLinks.length > 0 && (
            <a
              href={card.externalLinks[0]}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              <ExternalLink className="h-3 w-3" /> 外链
            </a>
          )}
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={explaining}
              className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
            >
              <Sparkles className="h-3 w-3" />
              {explaining ? "讲解中…" : "AI 讲解"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
