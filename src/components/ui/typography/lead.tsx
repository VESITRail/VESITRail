import { cn } from "@/lib/utils";

interface LeadProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const Lead = ({ children, className, ...props }: LeadProps) => {
  return (
    <p className={cn("text-xl text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
};

export { Lead };
