import { cn } from "@/lib/utils";

interface SmallProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Small = ({ children, className, ...props }: SmallProps) => {
  return (
    <small
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </small>
  );
};

export { Small };
