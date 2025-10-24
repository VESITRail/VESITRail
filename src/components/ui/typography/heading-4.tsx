import { cn } from "@/lib/utils";

interface Heading4Props extends React.HTMLAttributes<HTMLHeadingElement> {
	children: React.ReactNode;
}

const Heading4 = ({ children, className, ...props }: Heading4Props) => {
	return (
		<h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props}>
			{children}
		</h4>
	);
};

export { Heading4 };
