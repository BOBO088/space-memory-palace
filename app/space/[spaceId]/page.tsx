import { AppShell } from "@/components/layout/AppShell";
import { SpaceWorkspace } from "./SpaceWorkspace";

interface PageProps {
  params: Promise<{ spaceId: string }>;
}

export default async function SpacePage({ params }: PageProps) {
  const { spaceId } = await params;
  return (
    <AppShell
      compact
      actions={
        <span className="hidden text-[11px] text-slate-500 sm:inline">
          浏览模式
        </span>
      }
    >
      <SpaceWorkspace spaceId={spaceId} mode="view" />
    </AppShell>
  );
}
