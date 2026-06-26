import { NextResponse } from "next/server";
import { MAX_FILE_SIZE, UploadError, uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
// Allow large scene uploads (up to 100MB).
export const maxDuration = 60;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_form", message: "请求不是合法的 multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_file", message: "缺少 file 字段" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        error: "too_big",
        message: `文件超过 100MB 上限（${(file.size / 1024 / 1024).toFixed(1)}MB）`,
      },
      { status: 413 }
    );
  }

  const kindHint = form.get("kind");
  const hint =
    typeof kindHint === "string" && (kindHint === "scene" || kindHint === "image")
      ? (kindHint as "scene" | "image")
      : undefined;

  try {
    const result = await uploadFile(file, hint);
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    if (err instanceof UploadError) {
      const status =
        err.code === "too_big"
          ? 413
          : err.code === "bad_type"
            ? 415
            : err.code === "no_storage"
              ? 503
              : 502;
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message },
        { status }
      );
    }
    console.error("[upload] failed", err);
    return NextResponse.json(
      { ok: false, error: "internal", message: (err as Error).message || "未知错误" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      info: "POST { file: File, kind?: 'scene' | 'image' } 上传文件，返回 { url }。",
      maxFileSize: MAX_FILE_SIZE,
    },
    { status: 200 }
  );
}
