import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";

export async function logAdminAction(args: {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const admin = getAdminSupabase();
  await admin.from("admin_audit_logs").insert({
    admin_id: args.adminId,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId ?? null,
    details: args.details ?? {},
  });
}

export async function logGeoAccess(args: {
  userId?: string | null;
  countryCode: string | null;
  path: string;
  allowed: boolean;
  reason: string;
}): Promise<void> {
  const admin = getAdminSupabase();
  await admin.from("geo_access_logs").insert({
    user_id: args.userId ?? null,
    country_code: args.countryCode,
    path: args.path,
    allowed: args.allowed,
    reason: args.reason,
  });
}
