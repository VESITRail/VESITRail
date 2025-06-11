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
import { toTitleCase } from "@/lib/utils";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

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

      return breadcrumbs;
    }

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

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b-[1.5px]">
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

                    <BreadcrumbItem>
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
        </header>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayoutContent;
