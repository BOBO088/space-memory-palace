import { AppShell } from "@/components/layout/AppShell";
import { ShareWorkspace } from "./ShareWorkspace";

interface PageProps {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ hotspot?: string }>;
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const [{ spaceId }, sp] = await Promise.all([params, searchParams]);
  return (
    <AppShell
      compact
      actions={
        <span className="hidden text-[11px] text-slate-500 sm:inline">
          分享预览 · 只读
        </span>
      }
    >
      <ShareWorkspace spaceId={spaceId} initialHotspotId={sp.hotspot ?? null} />
    </AppShell>
  );
}
