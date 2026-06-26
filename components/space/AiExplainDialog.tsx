"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, RefreshCcw } from "lucide-react";
import { AI_MODES, type AiMode, type KnowledgeCard } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ExplainResponse {
  ok: boolean;
  text: string;
  stub?: boolean;
  reason?: string;
}

interface AiExplainDialogProps {
  card: KnowledgeCard;
  onClose: () => void;
  /** Optional: persist successful explanations onto the card. */
  onPersisted?: (text: string) => void;
}

export function AiExplainDialog({ card, onClose, onPersisted }: AiExplainDialogProps) {
  const [mode, setMode] = useState<AiMode>("short");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-run on first open with the default mode.
    void run(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (m: AiMode) => {
    setMode(m);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardTitle: card.title,
          cardType: card.type,
          cardContent: card.content,
          mode: m,
        }),
      });
      const data = (await res.json()) as ExplainResponse;
      if (!res.ok || !data.ok) {
        setError(data.text || `请求失败 (${res.status})`);
      } else {
        setResult(data);
        if (!data.stub && onPersisted) onPersisted(data.text);
      }
    } catch (err) {
      setError(`网络错误：${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900/95 p-5 shadow-[0_20px_60px_-20px_rgba(34,211,238,0.5)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-3 w-3" /> AI 讲解
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-50">{card.title}</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AI_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={loading}
              onClick={() => run(m.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition disabled:opacity-60",
                mode === m.value
                  ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              )}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="min-h-[8rem] rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-100">
          {loading ? (
            <div className="flex items-center gap-2 text-cyan-200">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              正在生成讲解…
            </div>
          ) : error ? (
            <p className="text-rose-300">{error}</p>
          ) : result ? (
            <>
              {result.stub && (
                <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
                  离线示例
                </p>
              )}
              <p className="whitespace-pre-wrap">{result.text}</p>
            </>
          ) : (
            <p className="text-slate-400">点击上方的风格即可重新生成讲解。</p>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          讲解仅基于卡片正文，不会补充外部信息；资料不足时会直说不足。
        </p>
      </div>
    </div>
  );
}
