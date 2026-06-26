# Space Memory Palace

一个用 Three.js 承载的 3D 知识图谱。创建空间 → 上传/放置 3D 场景 →
浏览 3D 房间 → 点击添加知识热点 → 绑定卡片 → AI 讲解 → 生成分享链接 →
导出 AI 短剧世界观资料。

## 快速开始

```bash
npm install
cp .env.local.example .env.local   # 可选：填入 OPENAI_API_KEY / Supabase
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 功能模块

| 阶段 | 模块 | 入口 |
| --- | --- | --- |
| 1-5 | 产品壳 / 3D Viewer / 热点添加 / localStorage / 知识卡 | `app/*`, `components/three/SpaceViewer.tsx` |
| 6 | AI 讲解（4 种风格） | `app/api/ai/explain`, `lib/openai.ts` |
| 7 | Gaussian Splat 场景 | `components/three/SplatScene.ts`, `components/space/SceneUrlEditor.tsx` |
| 8 | Supabase 数据层 | `lib/db.ts`, `lib/supabase-client.ts`, `supabase/schema.sql` |
| 9 | 3D 文件上传 | `app/api/upload`, `lib/storage.ts` |
| 10 | 分享页（带移动端底部抽屉） | `app/share/[spaceId]/*` |
| 11 | AI 短剧导演空间模板 | `lib/short-drama-seed.ts` |
| 12 | 导出 JSON / Markdown / IP Bible | `lib/exporters.ts`, `app/space/[spaceId]/SpaceActions.tsx` |

## 环境变量

复制 `.env.local.example` 为 `.env.local`，按需填入：

- `OPENAI_API_KEY`：开启真实 AI 讲解。留空时 API 走离线示例，仍可走通流程。
- `OPENAI_MODEL`：默认 `gpt-4o-mini`。
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`：开启云端数据。
  留空时使用浏览器 localStorage，仍可走通流程。
- Supabase Storage：用于 3D 场景文件上传（最大 100MB）。

## 部署

```bash
npm run build
npm start
```

Vercel 部署时把 `OPENAI_API_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、
`NEXT_PUBLIC_SUPABASE_ANON_KEY` 加到 Project Settings → Environment Variables。

## 数据模型

- `Space` — 空间（含 sceneType / sceneUrl / template）
- `Hotspot` — 3D 热点（带 3D 坐标）
- `KnowledgeCard` — 知识卡（note / character / scene / episode / prompt / video / image / link）

JSON 导入导出格式：`schemaVersion: 1`（见 `lib/local-store.ts` 中的 `SpaceExport`）。
