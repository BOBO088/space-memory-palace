import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface AppShellProps {
  children: React.ReactNode;
  /** Optional right-aligned slot for the page header. */
  actions?: React.ReactNode;
  /** Compact header on inner pages. */
  compact?: boolean;
}

export function AppShell({ children, actions, compact = false }: AppShellProps) {
  return (
    <div className="relative min-h-full bg-slate-950 text-slate-100">
      <BackgroundGrid />
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl",
          compact ? "h-12" : "h-14"
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold tracking-wide"
          >
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">Space Memory Palace</span>
            <span className="sm:hidden">SMP</span>
          </Link>
          <nav className="ml-2 flex items-center gap-1 text-xs text-slate-400">
            <Link
              href="/dashboard"
              className="rounded-md px-2 py-1 transition hover:bg-white/5 hover:text-slate-100"
            >
              空间
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </header>
      <main className="relative">{children}</main>
    </div>
  );
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(217,70,239,0.18),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  );
}
