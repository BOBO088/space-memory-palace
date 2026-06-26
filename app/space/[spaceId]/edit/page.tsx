import { AppShell } from "@/components/layout/AppShell";
import { SpaceWorkspace } from "../SpaceWorkspace";
import { SpaceActions } from "../SpaceActions";

interface PageProps {
  params: Promise<{ spaceId: string }>;
}

export default async function SpaceEditPage({ params }: PageProps) {
  const { spaceId } = await params;
  return (
    <AppShell
      compact
      actions={
        <div className="flex items-center gap-2">
          <SpaceActions spaceId={spaceId} />
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            编辑模式
          </span>
        </div>
      }
    >
      <SpaceWorkspace spaceId={spaceId} mode="edit" />
    </AppShell>
  );
}
