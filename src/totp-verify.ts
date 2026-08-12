
import { timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { rateLimitAsync } from "./rate-limit";
import { getSessionUser } from "./auth";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

export async function verifyTotp(req: Request): Promise<Response> {
  // Authorization: derive identity from the session, never from the body.
  const user = await getSessionUser(req);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const limit = await rateLimitAsync({
    key: `totp:verify:${user.id}`,
    limit: MAX_ATTEMPTS,
    windowSeconds: WINDOW_SECONDS,
  });

  if (!limit.allowed) {
    return json(
      { error: "Too many attempts. Try again later." },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }

  const { code } = await req.json();
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return json({ error: "Invalid code format" }, 400);
  }

  // Parameterised query — no string interpolation.
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { totpSecret: true },
  });

  if (!record?.totpSecret) {
    return json({ error: "2FA is not enabled" }, 400);
  }

  const expected = generateTotp(decryptSecret(record.totpSecret));
  const valid = safeCompare(code, expected);

  await db.totpAttempt.create({
    data: { userId: user.id, succeeded: valid },
  });

  if (!valid) {
    return json({ verified: false }, 401);
  }

  await limit.reset();
  return json({ verified: true }, 200);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
