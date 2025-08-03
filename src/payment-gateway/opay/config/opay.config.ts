export default () => ({
  opay: {
    publicKey: process.env.OPAY_PUBLIC_KEY,
    privateKey: process.env.OPAY_PRIVATE_KEY,
    merchantId: process.env.OPAY_MERCHANT_ID,
    paymentUrl: process.env.OPAY_PAYMENT_URL,
    statusUrl: process.env.OPAY_STATUS_URL,
    callbackUrl: process.env.OPAY_CALLBACK_URL,
    returnUrl: process.env.OPAY_RETURN_URL,
    cancelUrl: process.env.OPAY_CANCEL_URL,
    displayName: process.env.OPAY_DISPLAY_NAME,
  },
});
