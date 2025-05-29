import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export { cn };
