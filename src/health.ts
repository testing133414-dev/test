export function health(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      version: process.env.APP_VERSION ?? "unknown",
      commit: (process.env.GIT_SHA ?? "unknown").slice(0, 7),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}