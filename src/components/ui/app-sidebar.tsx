"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  KanbanIcon,
  LayoutDashboardIcon,
  LockIcon,
  LucideEarth,
  Moon,
  Sun,
  TerminalSquareIcon,
} from "lucide-react";
import { ThemeToggleButton } from "../ThemeToggleButton";
import { JSX } from "react";
import { useTheme } from "next-themes";

const sidebarLinks = [
  { name: "controlPanel", url: "/", icon: <LayoutDashboardIcon /> },
  { name: "stats", url: "/stats", icon: <LockIcon /> },
];

const sidebarBoardLinks = [
  { name: "boardOne", url: "/board-one", icon: <KanbanIcon /> },
  { name: "boardTwo", url: "/board-two", icon: <KanbanIcon /> },
];

const sidebarFooterLinks = [
  { name: "howItsMade", url: "https://sush.dev/articles", icon: <LucideEarth />, external: true },
  { name: "madeBySush", url: "https://sush.dev/", icon: <TerminalSquareIcon />, external: true },
];

function SidebarNavMenu({
  links,
}: {
  links: Array<{ name: string; url: string; icon: JSX.Element; external?: boolean }>;
}) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map(({ name, url, icon, external }) => {
        const isActive = pathname === url;
        const classNames = `flex items-center gap-2 w-full px-2 py-1.5 rounded-md ${
          isActive ? "bg-muted text-primary" : "hover:bg-muted"
        }`;

        return (
          <SidebarMenuItem key={name}>
            <SidebarMenuButton asChild>
              {external ? (
                <a href={url} target="_blank" rel="noreferrer" className={classNames}>
                  {icon}
                  <span>{name}</span>
                </a>
              ) : (
                <Link href={url} className={classNames}>
                  {icon}
                  <span>{name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const { setTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl">kanban</SidebarGroupLabel>
          <SidebarGroupAction title="toggle theme">
            <div onClick={() => setTheme((val) => (val === "light" ? "dark" : "light"))}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </div>
          </SidebarGroupAction>

          <SidebarSeparator className="my-4" />
          <SidebarGroupContent>
            <SidebarNavMenu links={sidebarLinks} />
          </SidebarGroupContent>

          <SidebarSeparator className="my-4" />
          <SidebarGroupContent>
            <SidebarNavMenu links={sidebarBoardLinks} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-4" />
      <SidebarFooter>
        <SidebarNavMenu links={sidebarFooterLinks} />
      </SidebarFooter>
    </Sidebar>
  );
}
