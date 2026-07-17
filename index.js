const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

exports.createStripePaymentIntent = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'You must be signed in to create a payment intent.'
    );
  }

  const { totalAmount, currency = 'usd' } = data;

  if (!totalAmount || typeof totalAmount !== 'number') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'totalAmount must be provided and must be a number.'
    );
  }

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects amount in cents
      currency: currency,
      metadata: {
        userId: context.auth.uid
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating Stripe PaymentIntent:', error);
    throw new functions.https.HttpsError(
      'internal', 
      'Unable to create payment intent.'
    );
  }
});
