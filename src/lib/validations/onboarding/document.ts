import { z } from "zod";

const DocumentSchema = z.object({
  verificationDocUrl: z.string().url(),
});

export default DocumentSchema;
