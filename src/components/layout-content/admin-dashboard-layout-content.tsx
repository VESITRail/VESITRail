"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { toTitleCase } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import AdminAppSidebar from "@/components/app-sidebar/admin/app-sidebar";
import { SidebarInset, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";

const AdminDashboardLayoutContent = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname();

	const generateBreadcrumbs = () => {
		let currentPath = "";
		const breadcrumbs = [];
		const pathSegments = pathname.split("/").filter(Boolean);

		if (pathname === "/dashboard/admin") {
			breadcrumbs.push({
				isActive: true,
				label: "Dashboard",
				href: "/dashboard/admin"
			});
		} else {
			breadcrumbs.push({
				isActive: false,
				label: "Dashboard",
				href: "/dashboard/admin"
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
						label: toTitleCase(segment)
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
					<div className="flex items-center gap-2 px-4 min-w-0 flex-1">
						<SidebarTrigger className="-ml-1 shrink-0" />

						<Separator orientation="vertical" className="mr-2 h-4 shrink-0" />

						<div className="relative min-w-0 flex-1">
							<div className="absolute right-0 top-0 h-full w-8 bg-linear-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />

							<Breadcrumb>
								<div className="overflow-x-auto scrollbar-none">
									<BreadcrumbList className="flex-nowrap">
										{breadcrumbs.map((breadcrumb, index) => (
											<div key={breadcrumb.href} className="flex items-center gap-1.5 shrink-0">
												{index > 0 && <BreadcrumbSeparator className="shrink-0" />}

												<BreadcrumbItem className="font-medium whitespace-nowrap">
													{breadcrumb.isActive ? (
														<BreadcrumbPage className="font-medium">{breadcrumb.label}</BreadcrumbPage>
													) : (
														<BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
													)}
												</BreadcrumbItem>
											</div>
										))}
									</BreadcrumbList>
								</div>
							</Breadcrumb>
						</div>
					</div>

					<ThemeToggle className="mr-5 shrink-0" />
				</header>

				{children}
			</SidebarInset>
		</SidebarProvider>
	);
};

export default AdminDashboardLayoutContent;
