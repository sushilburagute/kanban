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
  TerminalSquareIcon,
} from "lucide-react";
import { ThemeToggleButton } from "../ThemeToggleButton";

const sidebarLinks = [
  { name: "controlPanel", url: "/", icon: <LayoutDashboardIcon /> },
  { name: "stats", url: "/stats", icon: <LockIcon /> },
];

const sidebarBoardLinks = [
  { name: "boardOne", url: "/", icon: <KanbanIcon /> },
  { name: "boardTwo", url: "/", icon: <KanbanIcon /> },
];

const sidebarFooterLinks = [
  { name: "howItsMade", url: "https://sush.dev/articles", icon: <LucideEarth /> },
  { name: "madeBySush", url: "https://sush.dev/", icon: <TerminalSquareIcon /> },
];
// Refactor this
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl">kanban</SidebarGroupLabel>
          <SidebarGroupAction title="toggle theme">
            <ThemeToggleButton />
          </SidebarGroupAction>
          <SidebarSeparator className="my-4" />
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarLinks.map((link) => (
                <SidebarMenuItem key={link.name}>
                  <SidebarMenuButton asChild>
                    <a href={link.url}>
                      {link.icon}
                      <span>{link.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarSeparator className="my-4" />
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarBoardLinks.map((link) => (
                <SidebarMenuItem key={link.name}>
                  <SidebarMenuButton asChild>
                    <a href={link.url}>
                      {link.icon}
                      <span>{link.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="my-4" />

      <SidebarFooter>
        {/* <SidebarMenu>
          <SidebarMenuItem>made by sush.dev</SidebarMenuItem>
        </SidebarMenu> */}
        <SidebarMenu>
          {sidebarFooterLinks.map((link) => (
            <SidebarMenuItem key={link.name}>
              <SidebarMenuButton asChild>
                <a href={link.url}>
                  {link.icon}
                  <span>{link.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
