import {
  SidebarMenu,
  SidebarGroup,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

const NavMain = ({
  navItems,
}: {
  navItems: {
    label: string;
    items: { url: string; name: string; icon: LucideIcon }[];
  }[];
}) => {
  return navItems.map((element) => {
    const { label, items } = element;

    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  });
};

export default NavMain;
