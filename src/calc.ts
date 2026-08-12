type Operation = "add" | "subtract" | "multiply" | "divide";

const OPERATIONS: Operation[] = ["add", "subtract", "multiply", "divide"];

export async function calc(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Request body must be valid JSON.");
  }

  const { a, b, operation } = (body ?? {}) as Record<string, unknown>;

  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return fail("Both 'a' and 'b' must be finite numbers.");
  }
  if (typeof operation !== "string" || !OPERATIONS.includes(operation as Operation)) {
    return fail(`'operation' must be one of: ${OPERATIONS.join(", ")}.`);
  }
  if (operation === "divide" && b === 0) {
    return fail("Division by zero is not allowed.");
  }

  const result =
    operation === "add" ? a + b
    : operation === "subtract" ? a - b
    : operation === "multiply" ? a * b
    : a / b;

  return json({ result, operation }, 200);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function fail(message: string): Response {
  return json({ error: message }, 400);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}