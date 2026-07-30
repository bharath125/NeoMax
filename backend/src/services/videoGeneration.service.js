import { config } from '../config/index.js';
import * as klingProvider from './providers/kling.provider.js';

const providers = {
	kling: klingProvider,
};

export function getProvider(name = config.videoProvider) {
	const provider = providers[name];
	if (!provider) throw new Error(`Unknown video provider: ${name}`);
	return provider;
}
