/**
 * Calculator API — POST /api/calc
 *
 * Request:  { "a": number, "b": number, "operation": "add"|"subtract"|"multiply"|"divide" }
 * Success:  200 { "result": number, "operation": string }
 * Failure:  400 { "error": string }
 *
 * Numeric edge cases, per the PRD:
 *  - Floating point uses native JS arithmetic, so 0.1 + 0.2 === 0.30000000000000004.
 *    Rounding is deliberately out of scope; callers format for display.
 *  - Negative zero (e.g. 0 * -1) is normalised to 0 so the response never contains "-0".
 *  - Extra fields in the body are ignored rather than rejected, keeping the endpoint
 *    forward-compatible.
 */

const OPERATIONS = ["add", "subtract", "multiply", "divide"] as const;

type Operation = (typeof OPERATIONS)[number];

export async function calc(req: Request): Promise<Response> {
  // Reject non-JSON payloads with a specific message rather than a parse failure.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return fail("Content-Type must be application/json.");
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return fail("Request body must be valid JSON.");
  }

  if (!isPlainObject(payload)) {
    return fail("Request body must be a JSON object.");
  }

  const { a, b, operation } = payload;

  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return fail("Both 'a' and 'b' must be finite numbers.");
  }

  if (!isOperation(operation)) {
    return fail(`'operation' must be one of: ${OPERATIONS.join(", ")}.`);
  }

  if (operation === "divide" && b === 0) {
    return fail("Division by zero is not allowed.");
  }

  return json({ result: compute(a, b, operation), operation }, 200);
}

function compute(a: number, b: number, operation: Operation): number {
  let result: number;

  switch (operation) {
    case "add":
      result = a + b;
      break;
    case "subtract":
      result = a - b;
      break;
    case "multiply":
      result = a * b;
      break;
    case "divide":
      result = a / b;
      break;
  }

  // Normalise -0 to 0 so the response never carries a signed zero.
  return result === 0 ? 0 : result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOperation(value: unknown): value is Operation {
  return (
    typeof value === "string" &&
    (OPERATIONS as readonly string[]).includes(value)
  );
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
