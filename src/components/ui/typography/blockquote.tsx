import { cn } from "@/lib/utils"

interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  children: React.ReactNode
}

const Blockquote = ({ children, className, ...props }: BlockquoteProps) => {
  return (
    <blockquote 
      className={cn(
        "mt-6 border-l-2 pl-6 italic",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
}

export { Blockquote } 