"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ResponsiveSidebarTrigger() {
  const { open } = useSidebar();

  return (
    <SidebarTrigger
      className={cn(
        "fixed left-4 top-4 z-40 flex h-12 w-12 rounded-full border border-border/60 bg-background/90 shadow-lg backdrop-blur transition-all duration-300 ease-in-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        open ? "md:left-[17rem]" : "md:left-10"
      )}
    />
  );
}
