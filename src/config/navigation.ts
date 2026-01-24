import { Home, Mail, Users, BookOpen } from "lucide-react";

interface NavigationItem {
	href: string;
	label: string;
	icon: React.ElementType;
}

export const navigationItems: NavigationItem[] = [
	{
		href: "/",
		icon: Home,
		label: "Home"
	},
	{
		icon: BookOpen,
		label: "Guide",
		href: "/#guide"
	},
	{
		icon: Users,
		label: "Contributors",
		href: "/#contributors"
	},
	{
		icon: Mail,
		label: "Contact",
		href: "/#contact"
	}
];
