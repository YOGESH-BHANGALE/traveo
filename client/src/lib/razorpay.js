/**
 * Load Razorpay checkout script dynamically
 */
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Open Razorpay checkout modal
 * @param {object} options
 * @param {string} options.orderId - Razorpay order ID from backend
 * @param {number} options.amount - Amount in paise
 * @param {string} options.description
 * @param {object} options.user - { name, email, phone }
 * @param {function} options.onSuccess - ({ razorpayPaymentId, razorpayOrderId, razorpaySignature }) => void
 * @param {function} options.onFailure - (error) => void
 */
export const openRazorpayCheckout = async ({ orderId, amount, description, user, onSuccess, onFailure }) => {
  const loaded = await loadRazorpay();
  if (!loaded) {
    onFailure?.(new Error('Razorpay SDK failed to load'));
    return;
  }

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount,
    currency: 'INR',
    name: 'Traveo+',
    description: description || 'Ride Payment',
    image: '/icons/icon-192x192.png',
    order_id: orderId,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: '#fbbf24' },
    handler: (response) => {
      onSuccess?.({
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => onFailure?.(new Error('Payment cancelled')),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => onFailure?.(new Error(response.error.description)));
  rzp.open();
};
