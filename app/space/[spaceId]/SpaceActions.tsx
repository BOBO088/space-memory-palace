"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText, FileJson } from "lucide-react";
import { db } from "@/lib/db";
import { downloadFiles, planExport, type ExportedFile } from "@/lib/exporters";
import { cn } from "@/lib/cn";

interface SpaceActionsProps {
  spaceId: string;
}

export function SpaceActions({ spaceId }: SpaceActionsProps) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<ExportedFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const refresh = async () => {
    setError(null);
    try {
      const payload = await db.exportSpace(spaceId);
      setFiles(planExport(payload));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onToggle = async () => {
    if (!open && !files) await refresh();
    setOpen((v) => !v);
  };

  const onDownload = (f: ExportedFile) => {
    downloadFiles([f]);
    setOpen(false);
  };

  const onDownloadAll = () => {
    if (files && files.length) downloadFiles(files);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-slate-950/70 px-2.5 py-1 text-xs text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        导出
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-md border border-white/10 bg-slate-900/95 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur">
          {error ? (
            <p className="px-3 py-2 text-[11px] text-rose-300">{error}</p>
          ) : !files ? (
            <p className="px-3 py-2 text-[11px] text-slate-400">准备中…</p>
          ) : (
            <>
              <button
                onClick={onDownloadAll}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                <Download className="h-3 w-3" /> 全部下载（{files.length} 个文件）
              </button>
              <div className="border-t border-white/5" />
              {files.map((f) => (
                <button
                  key={f.filename}
                  onClick={() => onDownload(f)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-100"
                  )}
                >
                  {f.filename.endsWith(".json") ? (
                    <FileJson className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span className="flex-1 truncate">{f.label}</span>
                  <span className="truncate text-[10px] text-slate-500">
                    {f.filename}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
