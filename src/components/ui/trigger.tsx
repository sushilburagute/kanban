"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ResponsiveSidebarTrigger() {
  const { open } = useSidebar();

  return (
    <SidebarTrigger
      className={cn(
        "fixed left-4 top-4 z-40 flex h-10 w-10 rounded-md border bg-card text-foreground shadow-xs transition-all duration-300 ease-in-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        open ? "md:left-[17rem]" : "md:left-4"
      )}
    />
  );
}
