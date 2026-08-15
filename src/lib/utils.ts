import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { AuthErrorCode, authErrorMessages } from "@/types/error";
import type { ConcessionBookletStatusType } from "@/generated/zod";

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
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
	damagedPagesCount: number,
	totalPages: number = 50,
	isManuallyDamaged: boolean = false
): ConcessionBookletStatusType => {
	if (isManuallyDamaged) {
		return "Damaged";
	}

	const totalUsedPages = applicationCount + damagedPagesCount;

	if (totalUsedPages >= totalPages) {
		return "Exhausted";
	}

	if (totalUsedPages > 0) {
		return "InUse";
	}

	return "Available";
};
