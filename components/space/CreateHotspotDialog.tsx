"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CARD_TYPES, type CardType } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface CreateHotspotFormValues {
  title: string;
  summary: string;
  content: string;
  type: CardType;
  color: string;
}

const DEFAULT_COLOR = "#22d3ee";
const COLOR_CHOICES = [
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f87171", // red
];

interface CreateHotspotDialogProps {
  position: { x: number; y: number; z: number };
  onSubmit: (values: CreateHotspotFormValues) => void;
  onCancel: () => void;
}

export function CreateHotspotDialog({
  position,
  onSubmit,
  onCancel,
}: CreateHotspotDialogProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<CardType>("note");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("请填写标题");
      return;
    }
    onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      type,
      color,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="relative flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-[0_20px_60px_-20px_rgba(34,211,238,0.4)]"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">新建热点</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            位置 ({position.x.toFixed(2)}, {position.y.toFixed(2)},{" "}
            {position.z.toFixed(2)}) · 在此位置绑定一张知识卡
          </p>
        </div>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          标题
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="例如：沙发上的那本书"
            autoFocus
            className="rounded-md border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
          {error && <span className="text-[11px] text-rose-300">{error}</span>}
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          摘要（可选）
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一句话简介"
            className="rounded-md border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          正文（Markdown）
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"## 内容\n\n- 可以使用 **Markdown**\n- 可以列要点"}
            rows={5}
            className="resize-y rounded-md border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
        </label>

        <div className="flex flex-col gap-1 text-xs text-slate-300">
          类型
          <div className="flex flex-wrap gap-1.5">
            {CARD_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition",
                  type === t.value
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-300">
          颜色
          <div className="flex flex-wrap gap-1.5">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition",
                  color === c
                    ? "border-white scale-110"
                    : "border-transparent hover:scale-110"
                )}
                style={{ background: c, boxShadow: `0 0 10px ${c}55` }}
                aria-label={`选择颜色 ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:text-slate-100"
          >
            取消
          </button>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:from-cyan-300 hover:to-fuchsia-300"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
