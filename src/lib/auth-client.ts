import type { auth } from "./auth";
import { createAuthClient } from "better-auth/react";
import { oneTapClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    oneTapClient({
      context: "signin",
      autoSelect: false,
      cancelOnTapOutside: true,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
    }),
  ],
});
