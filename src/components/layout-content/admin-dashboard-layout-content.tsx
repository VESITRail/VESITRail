"use client";

import {
  SidebarInset,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AdminAppSidebar from "@/components/app-sidebar/admin/app-sidebar";

const AdminDashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const generateBreadcrumbs = () => {
    let currentPath = "";
    const breadcrumbs = [];
    const pathSegments = pathname.split("/").filter(Boolean);

    if (pathname === "/dashboard/admin") {
      breadcrumbs.push({
        isActive: true,
        label: "Dashboard",
        href: "/dashboard/admin",
      });
    } else {
      breadcrumbs.push({
        isActive: false,
        label: "Dashboard",
        href: "/dashboard/admin",
      });

      pathSegments.forEach((segment, index) => {
        if (segment === "dashboard") return;

        currentPath += `/${segment}`;
        const fullPath = `/dashboard${currentPath}`;
        const isLast = index === pathSegments.length - 1;

        if (segment === "admin" && pathSegments.length > 2) {
          return;
        }

        if (segment !== "admin") {
          breadcrumbs.push({
            href: fullPath,
            isActive: isLast,
            label: toTitleCase(segment),
          });
        }
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <AdminAppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b-[1.5px]">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />

            <Separator orientation="vertical" className="mr-2 h-4" />

            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div
                    key={breadcrumb.href}
                    className="flex items-center gap-1.5"
                  >
                    {index > 0 && <BreadcrumbSeparator />}

                    <BreadcrumbItem className="font-medium">
                      {breadcrumb.isActive ? (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={breadcrumb.href}>
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <Button
            size="icon"
            className="mr-5"
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminDashboardLayoutContent;
