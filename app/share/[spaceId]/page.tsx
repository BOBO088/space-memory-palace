import { AppShell } from "@/components/layout/AppShell";
import { ShareWorkspace } from "./ShareWorkspace";

interface PageProps {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ hotspot?: string }>;
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const [{ spaceId }, sp] = await Promise.all([params, searchParams]);
  return (
    <AppShell compact>
      <ShareWorkspace spaceId={spaceId} initialHotspotId={sp.hotspot ?? null} />
    </AppShell>
  );
}
