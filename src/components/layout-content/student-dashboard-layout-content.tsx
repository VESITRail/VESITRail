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
import { Bell, Moon, Sun } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import NotificationSheet from "@/components/student/notification-sheet";
import StudentAppSidebar from "@/components/app-sidebar/student/app-sidebar";
import NotificationPermissionHandler from "@/components/student/notification-permission-handler";

const StudentDashboardLayoutContent = ({
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

    if (pathname === "/dashboard/student") {
      breadcrumbs.push({
        isActive: true,
        label: "Dashboard",
        href: "/dashboard/student",
      });
    } else {
      breadcrumbs.push({
        isActive: false,
        label: "Dashboard",
        href: "/dashboard/student",
      });

      pathSegments.forEach((segment, index) => {
        if (segment === "dashboard") return;

        currentPath += `/${segment}`;
        const fullPath = `/dashboard${currentPath}`;
        const isLast = index === pathSegments.length - 1;

        if (segment === "student" && pathSegments.length > 2) {
          return;
        }

        if (segment !== "student") {
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
      <StudentAppSidebar />
      <NotificationPermissionHandler />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b-[1.5px]">
          <div className="flex items-center gap-2 px-4 min-w-0 flex-1">
            <SidebarTrigger className="-ml-1 flex-shrink-0" />

            <Separator
              orientation="vertical"
              className="mr-2 h-4 flex-shrink-0"
            />

            <div className="relative min-w-0 flex-1">
              <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />

              <Breadcrumb>
                <div className="overflow-x-auto scrollbar-none">
                  <BreadcrumbList className="flex-nowrap">
                    {breadcrumbs.map((breadcrumb, index) => (
                      <div
                        key={breadcrumb.href}
                        className="flex items-center gap-1.5 flex-shrink-0"
                      >
                        {index > 0 && (
                          <BreadcrumbSeparator className="flex-shrink-0" />
                        )}

                        <BreadcrumbItem className="font-medium whitespace-nowrap">
                          {breadcrumb.isActive ? (
                            <BreadcrumbPage className="font-medium">
                              {breadcrumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={breadcrumb.href}>
                              {breadcrumb.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </div>
              </Breadcrumb>
            </div>
          </div>

          <NotificationSheet>
            <Button size="icon" className="mr-2 flex-shrink-0">
              <Bell className="size-[1.2rem]" />
              <span className="sr-only">Notifications</span>
            </Button>
          </NotificationSheet>

          <Button
            size="icon"
            variant="outline"
            className="mr-5 flex-shrink-0"
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

export default StudentDashboardLayoutContent;
