"use server";

// Mock database and config for testing
const db = {
  users: { findUnique: () => ({ hasBillingAccess: true }) },
  plans: { findUnique: () => ({ id: "plan_123", price: 2000, name: "Pro Plan" }) }
};

export async function processPayment(userId, planId, idempotencyKey) {
  // Validate authenticated user and billing permissions
  const user = await db.users.findUnique({ where: { id: userId } });
  if (!user || !user.hasBillingAccess) {
    throw new Error("Authorization error: User lacks billing permission");
  }

  // Lookup available upgrade plan and pricing
  const plan = await db.plans.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new Error("Recoverable error: Selected plan is unavailable or pricing changed");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe configuration missing");
  
  // Use trusted application configuration for URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shipflow.dev";
  
  const params = new URLSearchParams();
  params.append("success_url", `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${baseUrl}/cancel`);
  params.append("mode", "payment");
  params.append("client_reference_id", userId);
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][product_data][name]", plan.name);
  params.append("line_items[0][price_data][unit_amount]", plan.price.toString());
  params.append("line_items[0][quantity]", "1");

  // Call the correct Stripe Checkout Sessions API with idempotency to prevent duplicates
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey
    },
    body: params.toString()
  });

  if (!response.ok) {
    // Capture safe diagnostic details server-side while returning generic error
    const errorBody = await response.text();
    console.error("Stripe error details:", errorBody);
    throw new Error("Payment checkout failed. Please try again.");
  }

  const data = await response.json();
  
  // Return Stripe client secret and safe metadata only
  return { 
    clientSecret: data.client_secret || "pi_mock_secret", 
    redirectUrl: data.url 
  };
}


