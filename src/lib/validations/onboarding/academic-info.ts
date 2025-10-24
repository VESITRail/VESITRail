import { z } from "zod";

const AcademicInfoSchema = z.object({
	year: z.string().uuid(),
	class: z.string().uuid(),
	branch: z.string().uuid()
});

export default AcademicInfoSchema;
