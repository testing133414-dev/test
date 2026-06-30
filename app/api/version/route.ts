// Version endpoint. GET /api/version -> 200 { version }
// Public, synchronous, no external/database calls.
const APP_VERSION = process.env.APP_VERSION ?? "1.0.0";
export function GET() {
  return Response.json({ version: APP_VERSION }, { status: 200 });
}
