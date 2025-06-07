import { z } from "zod";

const TravelInfoSchema = z.object({
  station: z.string().uuid(),
  preferredConcessionClass: z.string().uuid(),
  preferredConcessionPeriod: z.string().uuid(),
});

export default TravelInfoSchema;
