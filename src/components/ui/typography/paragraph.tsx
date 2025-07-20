import { cn } from "@/lib/utils";

interface ParagraphProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Paragraph({ children, className, ...props }: ParagraphProps) {
  return (
    <div
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
