import {
  Sidebar,
  SidebarMenu,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import NavMain from "@/components/nav-main";
import { Eye, User, BookOpen } from "lucide-react";
import NavSecondary from "@/components/nav-secondary";
import NavUser from "@/components/app-sidebar/admin/nav-user";

const data = {
  navSecondary: [
    {
      icon: User,
      title: "Profile",
      url: "/dashboard/admin/profile",
    },
  ],
  navMain: [
    {
      label: "Concession",
      items: [
        {
          icon: Eye,
          url: "/dashboard/admin",
          name: "View Concessions",
        },
        {
          icon: BookOpen,
          name: "Manage Booklets",
          url: "/dashboard/admin/booklets",
        },
      ],
    },
  ],
};

const AdminAppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar {...props} variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    width={0}
                    height={0}
                    src="/icon.svg"
                    alt="VESITRail"
                    className="size-8.25 rounded-lg"
                  />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">VESITRail</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain navMain={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminAppSidebar;
