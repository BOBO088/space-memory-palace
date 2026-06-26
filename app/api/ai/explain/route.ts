import { NextResponse } from "next/server";
import { AI_MODES, CARD_TYPES, type AiMode, type CardType } from "@/lib/types";
import { explainCard, NO_KEY_MESSAGE, THIN_CONTENT_MESSAGE } from "@/lib/openai";

export const runtime = "nodejs";

interface RequestBody {
  cardTitle?: string;
  cardType?: CardType;
  cardContent?: string;
  mode?: AiMode;
}

const VALID_TYPES = new Set(CARD_TYPES.map((t) => t.value));
const VALID_MODES = new Set(AI_MODES.map((m) => m.value));

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", message: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }

  const cardTitle = (body.cardTitle ?? "").toString();
  const cardContent = (body.cardContent ?? "").toString();
  const cardType = body.cardType;
  const mode = body.mode;

  if (!cardTitle.trim()) {
    return NextResponse.json(
      { ok: false, error: "missing_title", message: "缺少 cardTitle" },
      { status: 400 }
    );
  }
  if (!cardType || !VALID_TYPES.has(cardType)) {
    return NextResponse.json(
      { ok: false, error: "invalid_type", message: "cardType 不合法" },
      { status: 400 }
    );
  }
  if (!mode || !VALID_MODES.has(mode)) {
    return NextResponse.json(
      { ok: false, error: "invalid_mode", message: "mode 不合法" },
      { status: 400 }
    );
  }

  const result = await explainCard({ cardTitle, cardType, cardContent, mode });
  return NextResponse.json(result, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      info: "POST { cardTitle, cardType, cardContent, mode } 即可触发讲解",
      modes: AI_MODES,
      cardTypes: CARD_TYPES,
      messages: { NO_KEY_MESSAGE, THIN_CONTENT_MESSAGE },
    },
    { status: 200 }
  );
}
