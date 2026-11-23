import { config } from './index.js';

// PLACEHOLDER PRICING — set these to what you actually want to charge. Amounts are in the currency's smallest
// unit (paise for INR, cents for USD). Credits cost ~8/sec of video; at HeyGen 768p one credit is about $0.0045.
// The server is the only source of truth for prices: the client just sends a package key.
const PACKAGES = {
	small: { name: 'Starter', credits: 500 },
	medium: { name: 'Creator', credits: 2000 },
	large: { name: 'Studio', credits: 6000 },
};

const PRICES = {
	INR: { small: 39900, medium: 149900, large: 399900 },
	USD: { small: 500, medium: 1900, large: 4900 },
};

export function getCreditPackages() {
	const prices = PRICES[config.billing.currency];
	if (!prices) throw new Error(`No credit package prices defined for currency ${config.billing.currency}`);

	return Object.entries(PACKAGES).map(([key, pkg]) => ({ key, ...pkg, amount: prices[key], currency: config.billing.currency }));
}

export function getCreditPackage(key) {
	return getCreditPackages().find((pkg) => pkg.key === key);
}
