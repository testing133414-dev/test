// checkout.js
export async function processPayment(paymentToken) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe configuration missing");
  
  // Actually "call" Stripe APIs
  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `amount=2000&currency=usd&source=${paymentToken}`
  });

  if (!response.ok) {
    throw new Error("Payment failed");
  }

  return { success: true, redirect: '/success' };
}
}


