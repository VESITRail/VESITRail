import { cn } from "@/lib/utils";

interface Heading3Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const Heading3 = ({ children, className, ...props }: Heading3Props) => {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export { Heading3 };
