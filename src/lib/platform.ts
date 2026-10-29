import { FcmPlatformType } from "@/generated/zod";

export const getPlatform = (userAgent: string): FcmPlatformType => {
	const normalizedUserAgent = userAgent.toLowerCase();

	if (/android/.test(normalizedUserAgent)) return "Android";
	if (/iphone|ipad|ipod/.test(normalizedUserAgent)) return "iOS";
	return "Web";
};
