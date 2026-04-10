import { env } from "@/lib/config/env";
import { THEME } from "@/lib/config/theme";

export const PRIVY_CONFIG = {
  appId: env.NEXT_PUBLIC_PRIVY_APP_ID,
  loginMethods: ["email", "google", "apple"] as Array<
    "email" | "google" | "apple"
  >,
  appearance: {
    theme: "dark" as "dark",
    accentColor: THEME.colors.accent as `#${string}`,
    logo: "/logo.svg",
  },
  embeddedWallets: {
    createOnLogin: "off" as const,
  },
};
