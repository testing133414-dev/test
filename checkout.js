"use server";
import { auth } from "@shipflow/auth/server";
import { headers } from "next/headers";
import { db } from "@shipflow/database";

export async function processPayment(planId, idempotencyKey) {
  // 1. Get authenticated session instead of trusting client userId (Fixes IDOR)
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) {
    throw new Error("Authorization error: Not authenticated");
  }

  // 2. Real database authorization check (Fixes Mock DB bypass)
  const member = await db.workspaceMember.findFirst({
    where: { userId: session.user.id, role: "ADMIN" }
  });
  if (!member) {
    throw new Error("Authorization error: User lacks billing permission");
  }

  // 3. Real plan validation using a catalog source of truth
  const PLAN_CATALOG = {
    "pro_monthly": { priceId: process.env.STRIPE_PRICE_ID_PRO || "price_123" }
  };
  const plan = PLAN_CATALOG[planId];
  if (!plan) {
    throw new Error("Recoverable error: Selected plan is invalid or unavailable");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe configuration missing");
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shipflow.dev";
  const params = new URLSearchParams();
  
  // 4. Embedded mode to ensure Stripe actually returns a client_secret without mock fallbacks
  params.append("ui_mode", "embedded");
  params.append("return_url", `${baseUrl}/return?session_id={CHECKOUT_SESSION_ID}`);
  params.append("mode", "subscription");
  params.append("client_reference_id", session.user.id);
  
  // 5. Use secure Stripe Price ID instead of inline arbitrary price data
  params.append("line_items[0][price]", plan.priceId);
  params.append("line_items[0][quantity]", "1");

  // Call Stripe Checkout Sessions API with idempotency to prevent duplicate charges
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey || crypto.randomUUID()
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Stripe error details:", errorBody);
    throw new Error("Payment checkout failed. Please try again.");
  }

  const data = await response.json();
  
  // Fail explicitly if Stripe does not provide a client_secret (no mock fallback)
  if (!data.client_secret) {
    throw new Error("Stripe integration error: client_secret not returned");
  }

  return { clientSecret: data.client_secret };
}


