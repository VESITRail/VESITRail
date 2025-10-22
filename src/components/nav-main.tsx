import {
	useSidebar,
	SidebarMenu,
	SidebarGroup,
	SidebarMenuItem,
	SidebarGroupLabel,
	SidebarMenuButton
} from "@/components/ui/sidebar";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

const NavMain = ({
	navMain
}: {
	navMain: {
		label: string;
		items: { url: string; name: string; icon: LucideIcon }[];
	}[];
}) => {
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
								<Link href={item.url} onClick={handleNavClick}>
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
