import DocumentSchema from "./document";
import TravelInfoSchema from "./travel-info";
import PersonalInfoSchema from "./personal-info";
import AcademicInfoSchema from "./academic-info";

const OnboardingSchema = PersonalInfoSchema.merge(AcademicInfoSchema)
  .merge(TravelInfoSchema)
  .merge(DocumentSchema);

export {
  DocumentSchema,
  TravelInfoSchema,
  OnboardingSchema,
  PersonalInfoSchema,
  AcademicInfoSchema,
};
