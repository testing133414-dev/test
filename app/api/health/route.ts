// Health check endpoint.
// GET /api/health -> 200 { status: "ok" }
// Public (no auth), synchronous, no external/database calls.
export function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
