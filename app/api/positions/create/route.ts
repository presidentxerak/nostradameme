import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { createPosition } from "@/lib/services/positions";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const result = await createPosition(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
