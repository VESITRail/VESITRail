import { cn } from "@/lib/utils";

interface LargeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Large = ({ children, className, ...props }: LargeProps) => {
  return (
    <div className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </div>
  );
};

export { Large };
