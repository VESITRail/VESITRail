import { z } from "zod";

export const AddressChangeSchema = z.object({
	verificationDocUrl: z.string().url(),
	newStationId: z.string().min(1, "Please select a new station"),
	building: z
		.string()
		.min(1, "House / Building is required")
		.max(100, "House / Building cannot exceed 100 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "House / Building cannot be empty after trimming"),
	area: z
		.string()
		.min(1, "Area / Locality is required")
		.max(100, "Area / Locality cannot exceed 100 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "Area / Locality cannot be empty after trimming"),
	city: z
		.string()
		.min(1, "City is required")
		.max(50, "City cannot exceed 50 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "City cannot be empty after trimming"),
	pincode: z
		.string()
		.min(6, "Pincode must be 6 digits")
		.max(6, "Pincode must be 6 digits")
		.regex(/^\d{6}$/, "Pincode must contain only numbers")
});

export type AddressChangeForm = z.infer<typeof AddressChangeSchema>;

export default AddressChangeSchema;
