"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  Plus,
  Settings,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { db } from "@/lib/db";
import type { Space, SpaceTemplate } from "@/lib/types";
import { NewSpaceDialog } from "./NewSpaceDialog";
import { cn } from "@/lib/cn";

export function DashboardGrid() {
  const [hydrated, setHydrated] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const all = await db.listSpaces();
        setSpaces(all);
      } catch (err) {
        console.error("[dashboard] listSpaces failed", err);
        setSpaces([]);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const refresh = async () => {
    const all = await db.listSpaces();
    setSpaces(all);
  };

  const TEMPLATE_DESCRIPTIONS: Record<SpaceTemplate, string> = {
    personal_knowledge: "个人 3D 知识空间",
    short_drama_studio: "AI 短剧导演空间 · 角色墙 + 分集剧情 + 提示词库",
    ai_entrepreneur_kb: "AI 创业知识库 · 赛道 / 模式 / MVP / 增长 / 工具 / 失败",
    personal_second_brain: "个人第二大脑 · 灵感 / 项目 / 决策 / 笔记 / 待办 / 复盘",
    digital_memory_palace: "数字记忆宫殿 · 书 / 电影 / 人 / 历史 / 科学 / 哲学",
  };
  const TEMPLATE_HAS_SEED: Record<SpaceTemplate, boolean> = {
    personal_knowledge: false,
    short_drama_studio: true,
    ai_entrepreneur_kb: true,
    personal_second_brain: true,
    digital_memory_palace: true,
  };

  const createSpace = async (values: {
    title: string;
    template: SpaceTemplate;
  }) => {
    const space = await db.createSpace({
      title: values.title,
      template: values.template,
      description: TEMPLATE_DESCRIPTIONS[values.template] ?? "个人 3D 知识空间",
    });
    if (TEMPLATE_HAS_SEED[values.template]) {
      const { buildShortDramaSeed } = await import("@/lib/short-drama-seed");
      const seed = buildShortDramaSeed(space);
      if (seed.hotspots.length) {
        await Promise.all([
          db.saveHotspots(space.id, seed.hotspots),
          db.saveCards(space.id, seed.cards),
        ]);
      }
    }
    setSpaces((prev) => [space, ...prev]);
    setCreating(false);
    return space.id;
  };

  const removeSpace = async (id: string) => {
    if (!confirm("删除这个空间？所有热点和卡片都会一起清掉。")) return;
    setBusy(true);
    try {
      await db.deleteSpace(id);
      setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert(`删除失败：${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onImportClick = () => fileInputRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const data = await db.importSpace(payload);
      await refresh();
      alert(`已导入空间「${data.space.title}」`);
    } catch (err) {
      console.error(err);
      alert(`导入失败：${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetLocal = async () => {
    if (!confirm("清空所有本地数据并恢复为示例？仅在未配置 Supabase 时有效。")) return;
    const { resetToSeed } = await import("@/lib/local-store");
    resetToSeed();
    await refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">空间列表</h1>
          <p className="mt-1 text-sm text-slate-400">
            所有 3D 知识空间都在这里。{db.isCloud() ? "（云端 · Supabase）" : "（本地 · localStorage）"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">
            共 {spaces.length} 个空间
          </p>
          <button
            type="button"
            onClick={onImportClick}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" /> 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200 transition hover:bg-cyan-400/20"
          >
            <Plus className="h-3.5 w-3.5" /> 新建空间
          </button>
        </div>
      </header>

      {!hydrated ? (
        <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-sm text-slate-400">
          正在读取数据…
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-slate-300">还没有空间。点击「新建空间」开始。</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <li
              key={space.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 p-4 transition hover:border-cyan-400/30"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5",
                    ({
                      short_drama_studio: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
                      ai_entrepreneur_kb: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
                      personal_second_brain: "border-amber-400/30 bg-amber-400/10 text-amber-200",
                      digital_memory_palace: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
                      personal_knowledge: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
                    } as const)[space.template] ??
                      "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  )}
                >
                  {({
                    short_drama_studio: "AI 短剧空间",
                    ai_entrepreneur_kb: "AI 创业知识库",
                    personal_second_brain: "个人第二大脑",
                    digital_memory_palace: "数字记忆宫殿",
                    personal_knowledge: "个人知识空间",
                  } as const)[space.template] ?? space.template}
                </span>
                <span>
                  {space.visibility === "private" ? "私密" : "可分享"}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-200">
                {space.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                {space.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  href={`/space/${space.id}`}
                  className="text-xs text-cyan-200 transition hover:text-cyan-100"
                >
                  浏览 →
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/space/${space.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    <Settings className="h-3 w-3" /> 编辑
                  </Link>
                  <Link
                    href={`/share/${space.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:border-fuchsia-400/40 hover:text-fuchsia-200"
                  >
                    <Share2 className="h-3 w-3" /> 分享
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSpace(space.id)}
                    aria-label="删除空间"
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[11px] text-slate-500">
        数据来源：{db.isCloud() ? "Supabase" : "浏览器 localStorage（schemaVersion 1）"}
        {!db.isCloud() && (
          <button
            type="button"
            onClick={resetLocal}
            className="ml-2 inline-flex items-center gap-1 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            <Download className="h-3 w-3" /> 重置示例
          </button>
        )}
      </p>

      {creating && (
        <NewSpaceDialog
          onSubmit={async (values) => {
            const id = await createSpace(values);
            // Navigate to edit page for immediate setup.
            if (typeof window !== "undefined") {
              window.location.href = `/space/${id}/edit`;
            }
          }}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}
