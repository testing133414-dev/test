// checkout.js
function processPayment(cardNumber, cvv) {
  // BAD: Logging sensitive data
  console.log("Processing card: " + cardNumber + " CVV: " + cvv);
  
  // BAD: Hardcoded API key
  const stripeKey = "sk_live_123456789";
  
  return true;
}

