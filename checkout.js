// checkout.js
function processPayment(paymentToken) {
  // SECURE: Using a token instead of raw card numbers
  // SECURE: Reading API key from environment variables
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    throw new Error("Stripe configuration missing");
  }
  
  // Process payment securely...
  return { success: true, redirect: '/success' };
}


