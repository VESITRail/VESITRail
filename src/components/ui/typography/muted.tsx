import { cn } from "@/lib/utils";

interface MutedProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const Muted = ({ children, className, ...props }: MutedProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
};

export { Muted };
