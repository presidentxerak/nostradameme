import { env } from "@/lib/config/env";

export interface FeatureFlags {
  payoutsEnabled: boolean;
  onrampEnabled: boolean;
  realMoneyEnabled: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return {
    payoutsEnabled: env.FEATURE_ENABLE_PAYOUTS,
    onrampEnabled: env.FEATURE_ENABLE_ONRAMP,
    realMoneyEnabled: env.REAL_MONEY_ENABLED,
  };
}
