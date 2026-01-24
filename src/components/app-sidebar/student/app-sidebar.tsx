import { Eye, Send, User, MapPin, Github, LifeBuoy, PlusCircle } from "lucide-react";
import {
	Sidebar,
	useSidebar,
	SidebarMenu,
	SidebarHeader,
	SidebarFooter,
	SidebarContent,
	SidebarMenuItem,
	SidebarMenuButton
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import NavMain from "@/components/nav-main";
import NavSecondary from "@/components/nav-secondary";
import NavUser from "@/components/app-sidebar/student/nav-user";

const data = {
	navSecondary: [
		{
			icon: User,
			title: "Profile",
			url: "/dashboard/student/profile"
		},
		{
			icon: Github,
			title: "GitHub",
			url: "https://github.com/VESITRail/VESITRail"
		},
		{
			icon: LifeBuoy,
			url: "/#contact",
			title: "Support"
		},
		{
			icon: Send,
			title: "Feedback",
			url: "https://forms.gle/GCVuSnV4QRDt5Mu5A"
		}
	],
	navMain: [
		{
			label: "Concession",
			items: [
				{
					icon: Eye,
					name: "View Concessions",
					url: "/dashboard/student"
				},
				{
					icon: PlusCircle,
					name: "Apply Concession",
					url: "/dashboard/student/apply-concession"
				}
			]
		},
		{
			label: "Services",
			items: [
				{
					icon: MapPin,
					name: "Change Address",
					url: "/dashboard/student/change-address"
				}
			]
		}
	]
};

const StudentAppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
	const { isMobile, setOpenMobile } = useSidebar();

	const handleHeaderClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return (
		<Sidebar {...props} variant="inset">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/dashboard/student" onClick={handleHeaderClick}>
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Image width={0} height={0} src="/icon.svg" alt="VESITRail" className="size-8.25 rounded-lg" />
								</div>

								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">VESITRail</span>
									<span className="truncate text-xs">Student Dashboard</span>
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

export default StudentAppSidebar;
