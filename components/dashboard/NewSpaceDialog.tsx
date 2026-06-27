"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SpaceTemplate } from "@/lib/types";

interface NewSpaceDialogProps {
  onSubmit: (values: { title: string; template: SpaceTemplate }) => void;
  onCancel: () => void;
}

const TEMPLATE_OPTIONS: {
  value: SpaceTemplate;
  label: string;
  hint: string;
}[] = [
  {
    value: "personal_knowledge",
    label: "个人知识空间",
    hint: "自由放置热点、随手记笔记",
  },
  {
    value: "short_drama_studio",
    label: "AI 短剧导演空间",
    hint: "角色墙 / 分集剧情 / 提示词库，6 个核心模块预置",
  },
  {
    value: "ai_entrepreneur_kb",
    label: "AI 创业知识库",
    hint: "赛道分析 / 商业模式 / MVP / 增长 / 工具栈 / 失败案例",
  },
  {
    value: "personal_second_brain",
    label: "个人第二大脑",
    hint: "灵感 / 项目 / 决策 / 笔记 / 待办 / 复盘",
  },
  {
    value: "digital_memory_palace",
    label: "数字记忆宫殿",
    hint: "书 / 电影 / 人物 / 历史 / 科学 / 哲学",
  },
];

export function NewSpaceDialog({ onSubmit, onCancel }: NewSpaceDialogProps) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<SpaceTemplate>("personal_knowledge");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("请填写空间标题");
      return;
    }
    onSubmit({ title: title.trim(), template });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="relative flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-[0_20px_60px_-20px_rgba(34,211,238,0.4)]"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-slate-50">新建空间</h2>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          标题
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="例如：客厅 · 灵感墙"
            autoFocus
            className="rounded-md border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
          {error && <span className="text-[11px] text-rose-300">{error}</span>}
        </label>

        <div className="flex flex-col gap-1 text-xs text-slate-300">
          模板
          <div className="grid gap-2">
            {TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTemplate(t.value)}
                className={cn(
                  "rounded-md border p-2.5 text-left transition",
                  template === t.value
                    ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-50"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                )}
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{t.hint}</div>
              </button>
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
            创建
          </button>
        </div>
      </form>
    </div>
  );
}
