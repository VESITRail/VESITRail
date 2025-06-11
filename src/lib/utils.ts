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
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export { cn, toTitleCase, formatFieldName };
