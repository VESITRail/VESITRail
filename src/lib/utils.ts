import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatFieldName = (field: string) => {
  field.replace(/([A-Z])/g, " $1").toLowerCase();
};

export const toTitleCase = (str?: string) => {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getUserInitials = (type: "Admin" | "Student", name?: string) => {
  if (!name) return type === "Admin" ? "AD" : "ST";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const calculateConcessionValidity = (
  approvedAt: Date,
  durationInMonths: number
): {
  isValid: boolean;
  expiryDate: Date;
  daysRemaining: number;
} => {
  const currentDate = new Date();
  const expiryDate = new Date(approvedAt);
  expiryDate.setMonth(expiryDate.getMonth() + durationInMonths);

  const timeDiff = expiryDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    isValid: daysRemaining > 0,
    expiryDate,
    daysRemaining,
  };
};

export const sortByRomanKey = <T>(data: T[], key: keyof T): T[] => {
  const romanToInt = (roman: string): number => {
    const map: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };

    let total = 0;

    for (let i = 0; i < roman.length; i++) {
      const current = map[roman[i]];
      const next = map[roman[i + 1]];
      total += next && current < next ? -current : current;
    }

    return total;
  };

  return data.sort(
    (a, b) => romanToInt(String(a[key])) - romanToInt(String(b[key]))
  );
};
