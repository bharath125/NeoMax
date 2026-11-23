const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise;

export function loadRazorpay() {
	if (window.Razorpay) return Promise.resolve();
	scriptPromise ??= new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = CHECKOUT_SRC;
		script.async = true;
		script.onload = resolve;
		script.onerror = () => {
			scriptPromise = undefined;
			reject(new Error('Failed to load Razorpay Checkout'));
		};
		document.head.appendChild(script);
	});
	return scriptPromise;
}

// Opens Razorpay Checkout. Resolves with the payment response once a payment succeeds, or rejects with
// { dismissed: true } if the user closes the popup first.
//
// A failed attempt does NOT settle the promise: Checkout stays open so the user can retry with another method,
// and that retry may still succeed. `onFailure` just lets the caller tell the user what went wrong.
export async function openCheckout(options, { onFailure } = {}) {
	await loadRazorpay();
	return new Promise((resolve, reject) => {
		const checkout = new window.Razorpay({
			...options,
			handler: resolve,
			modal: { ondismiss: () => reject({ dismissed: true }) },
		});
		checkout.on('payment.failed', (response) => onFailure?.(response.error));
		checkout.open();
	});
}
