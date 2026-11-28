import {
	useSidebar,
	SidebarMenu,
	SidebarGroup,
	SidebarMenuItem,
	SidebarGroupLabel,
	SidebarMenuButton
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { shouldResetDashboardPage } from "@/lib/dashboard-navigation";

const NavMain = ({
	navMain,
	onResetPage
}: {
	navMain: {
		label: string;
		items: { url: string; name: string; icon: LucideIcon; resetOnReselect?: boolean }[];
	}[];
	onResetPage: () => void;
}) => {
	const pathname = usePathname();
	const { isMobile, setOpenMobile } = useSidebar();

	const handleNavClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return navMain.map((element, index) => {
		const { label, items } = element;

		return (
			<SidebarGroup key={index} className="group-data-[collapsible=icon]:hidden">
				<SidebarGroupLabel>{label}</SidebarGroupLabel>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton asChild>
								<Link
									href={item.url}
									onClick={handleNavClick}
									onNavigate={(event) => {
										if (shouldResetDashboardPage(pathname, item.url, item.resetOnReselect)) {
											event.preventDefault();
											onResetPage();
										}
									}}
								>
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
