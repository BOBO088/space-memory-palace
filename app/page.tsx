import Link from "next/link";
import { ArrowRight, Box, Cpu, Sparkles, Waypoints } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_SPACES } from "@/lib/mock-data";

const features = [
  {
    icon: Box,
    title: "可点击的 3D 空间",
    body: "把真实房间或 3D 场景变成可以旋转、缩放、点击的画布。",
  },
  {
    icon: Waypoints,
    title: "热点 + 知识卡",
    body: "在 3D 场景里挂上热点，每个热点绑定一张知识卡。",
  },
  {
    icon: Sparkles,
    title: "AI 讲解",
    body: "针对卡片内容生成短讲、深读、讲解稿和老师口吻四种风格。",
  },
  {
    icon: Cpu,
    title: "分享与导出",
    body: "一个链接给客户看；IP Bible 一键导出 Markdown 文档。",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="relative">
        <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col items-start justify-center gap-8 px-4 py-20 sm:px-6 lg:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            MVP · 第一阶段产品壳
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            把真实空间变成
            <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              可点击、可讲解的知识宫殿
            </span>
          </h1>
          <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
            Space Memory Palace 是一个用 Three.js 承载的 3D 知识图谱。
            把房间、场景、空间拍下来或建出来，挂上热点，
            写上卡片，让 AI 替你讲解给观众听。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_40px_rgba(217,70,239,0.4)]"
            >
              进入空间
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/share/space-1"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              看一个分享页示例
            </Link>
          </div>

          <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur transition hover:border-cyan-400/30"
              >
                <Icon className="h-5 w-5 text-cyan-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-100">{title}</h3>
                <p className="mt-1 text-xs text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-slate-100">最近的空间</h2>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 transition hover:text-cyan-200"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SPACES.slice(0, 3).map((space) => (
            <Link
              key={space.id}
              href={`/space/${space.id}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 p-4 transition hover:border-cyan-400/30"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent" />
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                    space.template === "short_drama_studio"
                      ? "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200"
                      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  }`}
                >
                  {space.template === "short_drama_studio" ? "AI 短剧空间" : "个人知识空间"}
                </span>
                <span>{space.visibility === "private" ? "私密" : "可分享"}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-200">
                {space.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                {space.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
