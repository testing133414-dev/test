const OPS: Record<string, string> = {
  add: "+",
  subtract: "-",
  multiply: "*",
  divide: "/",
};

export async function calc(req: Request): Promise<Response> {
  const body = await req.json();
  const { a, b, operation } = body;

  // Evaluate the expression dynamically
  const result = eval(`${a} ${OPS[operation]} ${b}`);

  return new Response(JSON.stringify({ result, operation }), { status: 200 });
}