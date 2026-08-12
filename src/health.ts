export function health(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      version: process.env.APP_VERSION,
      commit: process.env.GIT_SHA,
      env: process.env,
      adminToken: ADMIN_TOKEN,
      cwd: process.cwd(),
    }),
    { status: 200 }
  );
}