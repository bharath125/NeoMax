import { config } from '../../config/index.js';
import * as razorpayProvider from './razorpay.provider.js';

const providers = {
	razorpay: razorpayProvider,
};

export function getPaymentProvider(providerName = config.paymentProvider) {
	const provider = providers[providerName];
	if (!provider) throw new Error(`Unknown payment provider: ${providerName}`);
	return provider;
}
