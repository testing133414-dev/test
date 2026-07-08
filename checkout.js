"use server";

export async function processPayment(paymentToken) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe configuration missing");
  
  // Use URLSearchParams to securely encode the payload
  const params = new URLSearchParams();
  params.append("success_url", "https://example.com/success");
  params.append("cancel_url", "https://example.com/cancel");
  params.append("mode", "payment");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][product_data][name]", "Test Product");
  params.append("line_items[0][price_data][unit_amount]", "2000");
  params.append("line_items[0][quantity]", "1");

  // Call the correct Stripe Checkout Sessions API
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error("Payment checkout failed");
  }

  const data = await response.json();
  return { success: true, redirect: data.url };
}


