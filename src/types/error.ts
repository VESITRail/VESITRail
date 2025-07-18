export const authErrorMessages = {
  INVALID_EMAIL_DOMAIN: "Only emails with @ves.ac.in domain are allowed",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;
