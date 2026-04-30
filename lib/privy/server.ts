import "server-only";

import { PrivyClient } from "@privy-io/server-auth";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/utils/errors";

let cached: PrivyClient | null = null;

function getPrivy(): PrivyClient {
  if (cached) return cached;
  cached = new PrivyClient(env.NEXT_PUBLIC_PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  return cached;
}

export async function createUserXrplWallet(
  privyUserId: string,
): Promise<{ address: string }> {
  const client = getPrivy();
  try {
    const user = await client.getUserById(privyUserId);
    if (!user) {
      throw new AppError("privy_user_not_found", "User not found", 404);
    }
    // Inspect linked accounts for an existing XRPL-compatible wallet.
    const accounts = (user.linkedAccounts ?? []) as Array<{
      type: string;
      chainType?: string;
      address?: string;
    }>;
    const existing = accounts.find(
      (a) => a.type === "wallet" && a.chainType === "xrpl" && a.address,
    );
    if (existing?.address) {
      return { address: existing.address };
    }
    // Fallback: request wallet creation via Privy's API.
    // The actual creation API is invoked through client.createWallets when
    // supported. If unavailable, surface a clear error so admin can assist.
    const created = (
      client as unknown as {
        createWallets?: (opts: {
          userId: string;
          chainType: "xrpl";
        }) => Promise<{ address: string }>;
      }
    ).createWallets;
    if (typeof created === "function") {
      const result = await created.call(client, {
        userId: privyUserId,
        chainType: "xrpl",
      });
      return { address: result.address };
    }
    throw new AppError(
      "wallet_provisioning_unavailable",
      "Could not provision an account. Please contact support.",
      503,
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError("privy_error", message, 502);
  }
}

export async function getUserXrplAddress(
  privyUserId: string,
): Promise<string | null> {
  const client = getPrivy();
  try {
    const user = await client.getUserById(privyUserId);
    if (!user) return null;
    const accounts = (user.linkedAccounts ?? []) as Array<{
      type: string;
      chainType?: string;
      address?: string;
    }>;
    const match = accounts.find(
      (a) => a.type === "wallet" && a.chainType === "xrpl" && a.address,
    );
    return match?.address ?? null;
  } catch {
    return null;
  }
}

/**
 * Looks up the user's email from their Privy linked accounts.
 * Returns null if the user has no email-typed account or Privy is unreachable.
 */
export async function getUserEmail(
  privyUserId: string,
): Promise<string | null> {
  const client = getPrivy();
  try {
    const user = await client.getUserById(privyUserId);
    if (!user) return null;
    const accounts = (user.linkedAccounts ?? []) as Array<{
      type: string;
      address?: string;
    }>;
    const match = accounts.find(
      (a) => a.type === "email" && typeof a.address === "string" && a.address.length > 0,
    );
    return match?.address ?? null;
  } catch {
    return null;
  }
}

export async function verifyPrivyAccessToken(token: string): Promise<{
  userId: string;
} | null> {
  const client = getPrivy();
  try {
    const result = await client.verifyAuthToken(token);
    return { userId: result.userId };
  } catch {
    return null;
  }
}
