import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";

export interface RateLimitOptions {
  /** Bucket key (e.g. "positions:create:user:<uuid>"). */
  key: string;
  /** Maximum number of hits allowed within the window. */
  max: number;
  /** Window in seconds. */
  windowSeconds: number;
}

/**
 * Atomically increments a bucket count and throws an AppError(429) if the
 * configured max is exceeded. Backed by the rate_limit_buckets table +
 * rate_limit_hit() function (migration 0020).
 *
 * Falls open (allows the request) on Postgres errors so a transient DB
 * outage doesn't take down the API.
 */
export async function enforceRateLimit(opts: RateLimitOptions): Promise<void> {
  const admin = getAdminSupabase();
  try {
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_key: opts.key,
      p_window_seconds: opts.windowSeconds,
    });
    if (error) return;
    const count =
      typeof data === "number"
        ? data
        : Number((data as { count?: number } | null)?.count ?? 0);
    if (count > opts.max) {
      throw new AppError(
        "rate_limited",
        "Too many requests. Slow down.",
        429,
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    // DB error — fall open.
  }
}

/** Pulls the best-effort caller IP from common reverse-proxy headers. */
export function callerIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
