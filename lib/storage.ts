// Storage adapter for 3D scenes and image media.
//
// Behavior:
//   - If Supabase Storage env vars are set, files are uploaded there
//     and we return a public URL.
//   - Otherwise, image uploads return a data URL (good for cover art
//     and small previews) and 3D scene uploads return null so the
//     caller can prompt the user to configure storage or paste a URL.

import { isSupabaseConfigured, getSupabase } from "./supabase-client";

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB hard cap.

export type UploadKind = "scene" | "image";

const SCENE_EXTS = new Set(["ply", "splat", "ksplat", "glb"]);
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

const SCENE_MIME = new Set([
  "application/octet-stream",
  "model/ply",
  "model/splat",
  "model/ksplat",
  "model/gltf-binary",
]);
const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function detectKind(filename: string, mime?: string): UploadKind | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && SCENE_EXTS.has(ext)) return "scene";
  if (ext && IMAGE_EXTS.has(ext)) return "image";
  if (mime && SCENE_MIME.has(mime)) return "scene";
  if (mime && IMAGE_MIME.has(mime)) return "image";
  return null;
}

export interface UploadResult {
  url: string;
  kind: UploadKind;
  /** True when this is a data URL / local fallback (not a real CDN URL). */
  ephemeral?: boolean;
  filename: string;
  size: number;
}

export class UploadError extends Error {
  code: "too_big" | "bad_type" | "no_storage" | "network";
  constructor(code: UploadError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function bucketFor(kind: UploadKind) {
  return kind === "scene" ? "scenes" : "media";
}

function safeName(name: string) {
  return name
    .replace(/[^\w.\-一-龥]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

async function uploadToSupabase(
  file: File,
  kind: UploadKind
): Promise<UploadResult> {
  const sb = getSupabase();
  if (!sb) throw new UploadError("no_storage", "Supabase 未配置");
  const path = `${kind}s/${Date.now()}-${safeName(file.name || "file")}`;
  const { error } = await sb.storage
    .from(bucketFor(kind))
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new UploadError("network", error.message);
  const { data } = sb.storage.from(bucketFor(kind)).getPublicUrl(path);
  return {
    url: data.publicUrl,
    kind,
    filename: file.name,
    size: file.size,
  };
}

async function uploadAsDataUrl(
  file: File,
  kind: UploadKind
): Promise<UploadResult> {
  // For images we can fall back to a data URL. For 3D scenes a data URL
  // is impractical (size limits, CDN-friendly access); we surface a
  // clear error and let the user paste a URL instead.
  if (kind === "scene") {
    throw new UploadError(
      "no_storage",
      "未配置对象存储，请先配置 Supabase Storage 或在 3D 场景处手动填写 URL。"
    );
  }
  const buf = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const url = `data:${file.type || "image/png"};base64,${base64}`;
  return {
    url,
    kind,
    ephemeral: true,
    filename: file.name,
    size: file.size,
  };
}

export async function uploadFile(
  file: File,
  kindHint?: UploadKind
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      "too_big",
      `文件超过 100MB 上限（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`
    );
  }
  const kind = kindHint ?? detectKind(file.name, file.type);
  if (!kind) {
    throw new UploadError(
      "bad_type",
      `不支持的文件类型：${file.name || file.type || "未知"}`
    );
  }
  if (isSupabaseConfigured()) {
    try {
      return await uploadToSupabase(file, kind);
    } catch (err) {
      if (err instanceof UploadError && err.code === "no_storage") {
        // Fall through to data URL fallback for images only.
        return uploadAsDataUrl(file, kind);
      }
      throw err;
    }
  }
  return uploadAsDataUrl(file, kind);
}
