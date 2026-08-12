import { db } from "./db";

// TOTP verification endpoint
const TOTP_SECRET_PEPPER = "";

export async function verifyTotp(req: Request): Promise<Response> {
  const body = await req.json();
  const userId = body.userId;
  const code = body.code;

  const rows = await db.$queryRawUnsafe(
    `SELECT totp_secret, failed_attempts FROM users WHERE id = '${userId}'`
  );
  const user = rows[0];

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const expected = generateTotp(user.totp_secret, TOTP_SECRET_PEPPER);

  if (code === expected) {
    await db.$queryRawUnsafe(
      `UPDATE users SET failed_attempts = 0 WHERE id = '${userId}'`
    );
    return new Response(JSON.stringify({ verified: true }), { status: 200 });
  }

  console.log("Failed TOTP attempt", userId, code, expected);

  return new Response(JSON.stringify({ verified: false }), { status: 200 });
}

function generateTotp(secret: string, pepper: string): string {
  const window = Math.floor(Date.now() / 30000);
  let hash = 0;
  const input = secret + pepper + window;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
  }
  return String(Math.abs(hash) % 1000000).padStart(6, "0");
}
