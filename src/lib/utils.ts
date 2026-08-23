import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { AuthErrorCode, authErrorMessages } from "@/types/error";
import type { ConcessionBookletStatusType } from "@/generated/zod";

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};

export const normalizeDob = (dateInput: Date | string | null | undefined): Date | null => {
	if (!dateInput) return null;

	if (typeof dateInput === "string") {
		const trimmed = dateInput.trim();
		if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
			const [year, month, day] = trimmed.split("-").map(Number);
			return new Date(year, month - 1, day);
		}
	}

	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return null;

	const utcHours = d.getUTCHours();
	if (utcHours >= 12) {
		const localDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
		return new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
	}
	return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export const formatDateOfBirth = (
	dateInput: Date | string | null | undefined,
	formatStr: string = "dd/MM/yyyy"
): string => {
	const normalized = normalizeDob(dateInput);
	if (!normalized) return "";
	return format(normalized, formatStr);
};

export const formatDobForInput = (dateInput: Date | string | null | undefined): string => {
	return formatDateOfBirth(dateInput, "yyyy-MM-dd");
};

export const calcAgeFromDob = (dateInput: Date | string | null | undefined): { years: number; months: number } => {
	const birth = normalizeDob(dateInput);
	if (!birth) return { years: 0, months: 0 };

	const today = new Date();
	let years = today.getFullYear() - birth.getFullYear();
	let months = today.getMonth() - birth.getMonth();
	if (today.getDate() < birth.getDate()) months--;
	if (months < 0) {
		years--;
		months += 12;
	}
	return { years, months };
};

export const formatFieldName = (field: string) => {
	return field.replace(/([A-Z])/g, " $1").toLowerCase();
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

export const calculateSerialEndNumber = (serialStartNumber: string, totalPages: number): string => {
	const startNumber = serialStartNumber.toUpperCase();
	const match = startNumber.match(/^([A-Z]+)(\d+)$/);

	if (!match) {
		throw new Error("Invalid serial number format. Expected format: Letters followed by numbers (e.g., A0807550)");
	}

	const prefix = match[1];
	const startNum = parseInt(match[2], 10);
	const endNum = startNum + totalPages - 1;

	return `${prefix}${endNum.toString().padStart(match[2].length, "0")}`;
};

export const calculateConcessionValidity = (
	approvedAt: Date,
	durationInMonths: number
): {
	isValid: boolean;
	expiryDate: Date;
	daysRemaining: number;
} => {
	const now = new Date();
	const expiryDate = new Date(approvedAt.getTime());
	expiryDate.setMonth(expiryDate.getMonth() + durationInMonths);

	if (approvedAt.getDate() !== expiryDate.getDate()) {
		expiryDate.setDate(0);
	}

	const msInDay = 1000 * 60 * 60 * 24;
	const timeDiff = expiryDate.getTime() - now.getTime();
	const daysRemaining = Math.max(Math.ceil(timeDiff / msInDay), 0);

	return {
		expiryDate,
		daysRemaining,
		isValid: daysRemaining > 0
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
			M: 1000
		};

		let total = 0;

		for (let i = 0; i < roman.length; i++) {
			const current = map[roman[i]];
			const next = map[roman[i + 1]];
			total += next && current < next ? -current : current;
		}

		return total;
	};

	return data.sort((a, b) => romanToInt(String(a[key])) - romanToInt(String(b[key])));
};

export const sortByYearOrder = <T extends { name?: string; code?: string }>(data: T[]): T[] => {
	const getYearRank = (item: T): number => {
		const code = (item.code || "").toUpperCase().trim();
		const name = (item.name || "").toUpperCase().trim();

		if (
			code.includes("FE") ||
			code.includes("FY") ||
			code === "1" ||
			code === "1ST" ||
			code === "I" ||
			name.includes("FIRST") ||
			name.includes("1ST")
		) {
			return 1;
		}

		if (
			code.includes("SE") ||
			code.includes("SY") ||
			code === "2" ||
			code === "2ND" ||
			code === "II" ||
			name.includes("SECOND") ||
			name.includes("2ND")
		) {
			return 2;
		}

		if (
			code.includes("TE") ||
			code.includes("TY") ||
			code === "3" ||
			code === "3RD" ||
			code === "III" ||
			name.includes("THIRD") ||
			name.includes("3RD")
		) {
			return 3;
		}

		if (
			code.includes("BE") ||
			code.includes("LY") ||
			code === "4" ||
			code === "4TH" ||
			code === "IV" ||
			name.includes("FOURTH") ||
			name.includes("FINAL") ||
			name.includes("4TH")
		) {
			return 4;
		}

		return 99;
	};

	return [...data].sort((a, b) => getYearRank(a) - getYearRank(b));
};

export const isValidErrorCode = (code: string): code is AuthErrorCode => {
	return code in authErrorMessages;
};

export const calculateBookletStatus = (
	applicationCount: number,
	totalPages: number = 50,
	isManuallyExhausted: boolean = false
): ConcessionBookletStatusType => {
	if (isManuallyExhausted) {
		return "Exhausted";
	}

	if (applicationCount >= totalPages) {
		return "Exhausted";
	}

	if (applicationCount > 0) {
		return "InUse";
	}

	return "Available";
};
