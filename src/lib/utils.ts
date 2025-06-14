import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

const formatFieldName = (field: string) => {
  field.replace(/([A-Z])/g, " $1").toLowerCase();
};

const toTitleCase = (str?: string) => {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export { cn, toTitleCase, capitalizeWords, formatFieldName };
