"use client";

import { useRef, useState } from "react";
import { Check, Upload, X } from "lucide-react";
import type { SceneType } from "@/lib/types";
import { cn } from "@/lib/cn";

interface SceneUrlEditorProps {
  url: string;
  type: SceneType;
  onChange: (url: string, type: SceneType) => void;
}

const TYPE_OPTIONS: { value: SceneType; label: string; hint: string }[] = [
  { value: "primitive", label: "占位房间", hint: "不加载外部场景" },
  { value: "splat", label: "高斯泼溅", hint: ".ply / .splat / .ksplat" },
  { value: "glb", label: "GLB 模型", hint: "通用模型（占位）" },
];

const ACCEPT = ".ply,.splat,.ksplat,.glb,application/octet-stream,model/gltf-binary,model/ply";

export function SceneUrlEditor({ url, type, onChange }: SceneUrlEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(url);
  const [draftType, setDraftType] = useState<SceneType>(type);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = () => {
    onChange(draft.trim(), draftType);
    setOpen(false);
  };
  const cancel = () => {
    setDraft(url);
    setDraftType(type);
    setOpen(false);
  };
  const clear = () => {
    setDraft("");
    onChange("", "primitive");
    setOpen(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "scene");
      const r = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await r.json()) as
        | { ok: true; url: string }
        | { ok: false; error: string; message: string };
      if (!r.ok || !("ok" in data) || !data.ok) {
        const msg = "message" in data ? data.message : "上传失败";
        throw new Error(msg);
      }
      setDraft(data.url);
      setDraftType(file.name.toLowerCase().endsWith(".glb") ? "glb" : "splat");
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[11px] text-slate-300 backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-200"
        >
          <span className="text-slate-500">3D 场景：</span>
          <span className="font-medium">
            {type === "primitive" ? "占位房间" : type === "splat" ? "高斯泼溅" : "GLB"}
          </span>
          <span className="max-w-[12rem] truncate text-slate-400">
            {url || "未设置"}
          </span>
        </button>
      ) : (
        <div className="flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-cyan-400/30 bg-slate-950/90 p-2.5 shadow-[0_0_24px_rgba(34,211,238,0.25)] backdrop-blur">
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDraftType(t.value)}
                title={t.hint}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] transition",
                  draftType === t.value
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://…/room.ply 或 .splat 或 .ksplat"
            className="rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-60"
            >
              <Upload className="h-3 w-3" />
              {uploading ? "上传中…" : "上传文件"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={onFile}
              className="hidden"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-rose-400/40 hover:text-rose-200"
              >
                <X className="h-3 w-3" /> 清除
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 transition hover:border-white/20"
              >
                取消
              </button>
              <button
                type="button"
                onClick={apply}
                className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-2 py-0.5 text-[10px] font-medium text-slate-950"
              >
                <Check className="h-3 w-3" /> 应用
              </button>
            </div>
          </div>
          {uploadError && (
            <p className="text-[10px] text-rose-300">{uploadError}</p>
          )}
          <p className="text-[10px] text-slate-500">
            支持 .ply / .splat / .ksplat / .glb，单文件 100MB 以内。
          </p>
        </div>
      )}
    </div>
  );
}
