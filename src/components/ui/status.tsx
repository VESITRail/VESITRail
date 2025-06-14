import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading2, Paragraph } from "@/components/ui/typography";

interface StatusProps {
  title: string;
  iconBg?: string;
  icon: LucideIcon;
  iconColor?: string;
  description: string;
  iconClassName?: string;
  containerClassName?: string;
  button?: {
    href: string;
    label: string;
    icon: LucideIcon;
    variant?: "default" | "outline" | "ghost";
  };
}

export const Status = ({
  title,
  button,
  icon: Icon,
  description,
  iconClassName,
  iconBg = "bg-muted/50",
  containerClassName = "min-h-screen",
  iconColor = "text-muted-foreground",
}: StatusProps) => {
  return (
    <div
      className={`flex items-center justify-center p-4 bg-background ${containerClassName}`}
    >
      <Card className="w-full max-w-md sm:max-w-lg transition-all">
        <div className="p-6 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div
              className={cn(
                iconBg,
                "w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full"
              )}
            >
              <Icon
                className={cn(
                  iconColor,
                  iconClassName,
                  "w-7 h-7 sm:w-8 sm:h-8"
                )}
              />
            </div>
            <div className="absolute inset-0 rounded-full border-t-2 border-primary/10 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <Heading2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {title}
            </Heading2>
            <Paragraph className="text-base text-muted-foreground max-w-sm mx-auto">
              {description}
            </Paragraph>
          </div>
          {button && (
            <Button
              asChild
              size="lg"
              className="mt-2"
              variant={button.variant || "default"}
            >
              <Link href={button.href}>
                <button.icon
                  className={cn(iconClassName, "w-5 h-5 sm:w-10 sm:h-10")}
                />

                {button.label}
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
