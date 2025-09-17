"use client";

import { Badge } from "@/components/ui/badge";
import { IdCard, Lightbulb, Home } from "lucide-react";

type DocumentRequirementsProps = {
  className?: string;
};

export function DocumentRequirements({ className }: DocumentRequirementsProps) {
  const documentTypes = [
    {
      icon: IdCard,
      title: "Aadhaar Card",
      description: "Front and back sides",
    },
    {
      icon: Lightbulb,
      title: "Electricity Bill",
      description: "In parent's name",
    },
    {
      icon: Home,
      title: "Rent Agreement",
      description: "Valid document",
    },
  ];

  return (
    <div className={className}>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Please upload{" "}
          <span className="text-foreground font-semibold">one</span> of the
          following documents:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {documentTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="size-8 bg-primary/20 rounded-md flex items-center justify-center">
                    <IconComponent className="size-4" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {type.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="text-xs">
            PDF format only
          </Badge>
          <Badge variant="outline" className="text-xs">
            Max 2MB
          </Badge>
          <Badge variant="outline" className="text-xs">
            Clear & readable
          </Badge>
        </div>
      </div>
    </div>
  );
}
