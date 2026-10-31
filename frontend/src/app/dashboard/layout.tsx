import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Toaster } from "@/components/dashboard/toaster";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";

const SIDEBAR_SIZES = {
  "--sidebar-width": "17rem",
  "--sidebar-width-icon": "4rem",
} as React.CSSProperties;

// The session comes from a cookie, so everything below streams in per request.
async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <TooltipProvider>
      <a
        href="#page-content"
        className="sr-only z-50 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SidebarProvider style={SIDEBAR_SIZES} className="bg-canvas">
        <AppSidebar user={user} />
        <SidebarInset className="min-w-0 bg-canvas">
          <DashboardHeader user={user} />
          <div key={user.role} id="page-content" tabIndex={-1} className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-6 px-4 pb-8 outline-none pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 md:px-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

function ShellFallback() {
  return (
    <div className="flex min-h-svh gap-4 bg-canvas p-2" aria-busy>
      <div className="hidden w-[16rem] shrink-0 rounded-[32px] bg-ink md:block" />
      <div className="flex-1 space-y-4 p-4">
        <div className="h-11 max-w-2xl rounded-full bg-black/[0.06] motion-safe:animate-pulse" />
        <div className="h-14 max-w-xl rounded-3xl bg-black/[0.06] motion-safe:animate-pulse" />
        <div className="h-64 rounded-[32px] bg-black/[0.06] motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
