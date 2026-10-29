import { toTitleCase } from "./utils";
import { APIError } from "better-auth/api";

const VES_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@ves\.ac\.in$/;

export const beforeUserCreate = async <T extends { email?: string | null; name?: string | null }>(user: T) => {
	if (!user.email || !VES_EMAIL_PATTERN.test(user.email)) {
		throw new APIError("BAD_REQUEST", {
			code: "INVALID_EMAIL_DOMAIN",
			message: "INVALID_EMAIL_DOMAIN"
		});
	}

	return {
		data: {
			...user,
			name: user.name ? toTitleCase(user.name.trim()) : user.name
		}
	};
};
