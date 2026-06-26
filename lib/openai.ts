// Thin OpenAI wrapper used by /api/ai/explain.
//
// Behavior contract (mirrors the spec in the plan):
//   - Only base explanations on `cardContent`; never invent facts.
//   - If the content is too thin, return a clear "资料不足" fallback
//     instead of guessing.
//   - Output Chinese.
//   - `short` stays within 100 characters.
//   - `script` is a short-video voice-over script.
//   - `teacher` is a classroom-style explanation.
//
// If `OPENAI_API_KEY` is not set, the wrapper returns a graceful
// stub response so the rest of the app stays usable in dev / preview
// environments without a real key.

import OpenAI from "openai";
import type { AiMode, CardType } from "./types";

export interface ExplainInput {
  cardTitle: string;
  cardType: CardType;
  cardContent: string;
  mode: AiMode;
}

export interface ExplainResult {
  ok: boolean;
  text: string;
  /** When ok=false, a short machine-readable reason. */
  reason?: "no_api_key" | "thin_content" | "openai_error" | "bad_request";
  /** True when this came from the offline stub. */
  stub?: boolean;
}

const NO_KEY_MESSAGE =
  "当前未配置 OPENAI_API_KEY，无法调用 AI 讲解。可在 .env.local 中设置后重启 dev 服务。";

const THIN_CONTENT_MESSAGE = "当前卡片资料不足，无法可靠讲解。请先补充正文内容。";

const MODE_HINT: Record<AiMode, string> = {
  short: "输出 100 字以内的中文短讲，开门见山，不要分点。",
  deep: "输出 300-500 字的中文深读，结构清晰，可以使用 2-4 个小标题。",
  script: "输出一份 60 秒以内的短视频口播稿，中文，口语化、有节奏感，用换行分段。",
  teacher: "以课堂老师口吻中文讲解，先抛出问题，再分步骤拆解，最后给一句总结。",
};

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;
  return new OpenAI({ apiKey });
}

function isThin(content: string): boolean {
  const stripped = content.replace(
    /[\s#*_`>~\\\-\[\](){}|!"'.,;:?/，。！？：；、（）【】《》「」"'`]+/g,
    ""
  );
  return stripped.length < 8;
}

function buildSystemPrompt(): string {
  return [
    "你是一位严谨的讲解助手，只根据用户提供的「卡片正文」进行讲解。",
    "规则：",
    "1. 严禁编造、补充或推测卡片正文以外的事实、人物、数字、年份。",
    "2. 如果卡片正文资料不足、过于简短或与主题无关，直接回复：当前卡片资料不足，无法可靠讲解。",
    "3. 输出必须使用中文。",
    "4. 不使用任何 Markdown 标题符号（# / ##），可以使用粗体强调关键词。",
    "5. 禁止在回复开头写「当然」「好的」「以下是」等寒暄，直接讲。",
  ].join("\n");
}

function buildUserPrompt(input: ExplainInput): string {
  return [
    `【卡片标题】${input.cardTitle}`,
    `【卡片类型】${input.cardType}`,
    `【讲解风格】${MODE_HINT[input.mode]}`,
    "【卡片正文】",
    input.cardContent.trim() || "（空）",
  ].join("\n");
}

function stubForMode(input: ExplainInput): string {
  const t = input.cardTitle || "未命名卡片";
  if (input.mode === "short") {
    return `（离线示例）这是一张关于「${t}」的卡片。配置 OPENAI_API_KEY 后可获得真实讲解。`;
  }
  if (input.mode === "deep") {
    return [
      `（离线示例 · 深读）「${t}」的要点如下：`,
      "",
      "1. 卡片正文为唯一资料来源，AI 不会补充外部信息。",
      "2. 资料不足时会主动说明，避免误导。",
      "3. 配置真实 API Key 后可获得基于正文的深度解读。",
    ].join("\n");
  }
  if (input.mode === "script") {
    return [
      `（离线示例 · 口播稿）`,
      `「${t}」`,
      "",
      "今天我们讲一张 3D 空间里的知识卡。",
      "卡片正文就是全部信息源，AI 不会替你编。",
      "资料不够时，AI 会直说资料不够。",
      "接入真实 API Key 后，会按你选的风格输出真正的口播稿。",
    ].join("\n");
  }
  // teacher
  return [
    `（离线示例 · 老师口吻）`,
    `同学们，我们来看这张卡：「${t}」。`,
    "第一步，先把卡片正文读清楚；",
    "第二步，区分哪些是事实、哪些是个人判断；",
    "第三步，资料不够就如实说资料不够。",
    "总结：讲解的边界，就是正文的边界。",
  ].join("\n");
}

export async function explainCard(input: ExplainInput): Promise<ExplainResult> {
  const cardContent = (input.cardContent ?? "").trim();
  if (!cardContent) {
    return { ok: false, text: THIN_CONTENT_MESSAGE, reason: "thin_content" };
  }
  if (isThin(cardContent)) {
    return { ok: false, text: THIN_CONTENT_MESSAGE, reason: "thin_content" };
  }

  const client = getClient();
  if (!client) {
    return {
      ok: true,
      text: stubForMode(input),
      stub: true,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });
    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return {
        ok: false,
        text: "AI 暂未返回内容，请稍后再试。",
        reason: "openai_error",
      };
    }
    return { ok: true, text };
  } catch (err) {
    console.error("[openai] explain failed", err);
    return {
      ok: false,
      text: `AI 讲解失败：${(err as Error).message || "未知错误"}`,
      reason: "openai_error",
    };
  }
}

export { NO_KEY_MESSAGE, THIN_CONTENT_MESSAGE };
