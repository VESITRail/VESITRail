import {
	useSidebar,
	SidebarMenu,
	SidebarGroup,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarGroupContent
} from "@/components/ui/sidebar";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

const NavSecondary = ({
	items,
	...props
}: {
	items: {
		url: string;
		title: string;
		icon: LucideIcon;
	}[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) => {
	const { isMobile, setOpenMobile } = useSidebar();

	const handleNavClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="sm">
								<Link href={item.url} onClick={handleNavClick}>
									<item.icon />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
};

export default NavSecondary;
