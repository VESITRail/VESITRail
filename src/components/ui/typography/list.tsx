import { cn } from "@/lib/utils";

interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
	children: React.ReactNode;
}

const List = ({ children, className, ...props }: ListProps) => {
	return (
		<ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props}>
			{children}
		</ul>
	);
};

export { List };
