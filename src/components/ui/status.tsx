"use client";

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
  button?: {
    label: string;
    href: string;
    variant?: "default" | "outline" | "ghost";
  };
}

export const Status = ({
  title,
  icon: Icon,
  description,
  iconClassName,
  button,
  iconBg = "bg-muted/50",
  iconColor = "text-muted-foreground",
}: StatusProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
              variant={button.variant || "default"}
              className="mt-2"
            >
              <Link href={button.href}>{button.label}</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
