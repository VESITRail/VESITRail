import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

const formatFieldName = (field: string) =>
  field.replace(/([A-Z])/g, " $1").toLowerCase();

export { cn, formatFieldName };
