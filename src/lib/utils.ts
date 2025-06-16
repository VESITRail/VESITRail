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

const getUserInitials = (type: "Admin" | "Student", name?: string) => {
  if (!name) return type === "Admin" ? "AD" : "ST";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const calculateConcessionValidity = (
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

export {
  cn,
  toTitleCase,
  getUserInitials,
  capitalizeWords,
  formatFieldName,
  calculateConcessionValidity,
};
