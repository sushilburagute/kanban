import { SidebarLink } from "@/types/SidebarLink";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SidebarNavMenu({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map(({ name, url, icon, external }) => {
        const isActive = pathname === url;
        const classNames = cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive ? "bg-muted text-primary" : "hover:bg-muted"
        );

        return (
          <SidebarMenuItem key={name}>
            <SidebarMenuButton asChild>
              {external ? (
                <a href={url} target="_blank" rel="noreferrer" className={classNames}>
                  {icon}
                  <span className="truncate">{name}</span>
                </a>
              ) : (
                <Link href={url} className={classNames}>
                  {icon}
                  <span className="truncate">{name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
