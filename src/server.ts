/**
 * HTTP entry point that mounts the calculator handler at POST /api/calc.
 *
 * Uses only the Node standard library so the endpoint is reachable with no
 * additional dependencies or configuration.
 */

import { createServer } from "node:http";
import { calc } from "./calc";

const PORT = Number(process.env.PORT ?? 8787);
const ROUTE = "/api/calc";

const server = createServer(async (req, res) => {
  const path = (req.url ?? "").split("?")[0];

  if (path !== ROUTE) {
    return send(res, 404, { error: "Not found" });
  }

  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return send(res, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }

    const request = new Request(`http://localhost${ROUTE}`, {
      method: "POST",
      headers: { "content-type": req.headers["content-type"] ?? "" },
      body: Buffer.concat(chunks).toString("utf8"),
    });

    const response = await calc(request);
    res.writeHead(response.status, {
      "content-type": response.headers.get("content-type") ?? "application/json",
    });
    res.end(await response.text());
  } catch {
    // Never leak a stack trace to the caller.
    send(res, 500, { error: "Internal server error." });
  }
});

function send(res: import("node:http").ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

server.listen(PORT, () => {
  console.log(`Calculator API listening on http://localhost:${PORT}${ROUTE}`);
});
