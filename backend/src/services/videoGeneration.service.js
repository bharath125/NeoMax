import { config } from '../config/index.js';
import * as klingProvider from './providers/kling.provider.js';
import * as openrouterProvider from './providers/openrouter.provider.js';

const providers = {
	kling: klingProvider,
	openrouter: openrouterProvider,
};

export function getProvider(name = config.videoProvider) {
	const provider = providers[name];
	if (!provider) throw new Error(`Unknown video provider: ${name}`);
	return provider;
}

// Providers may clamp duration/resolution to what their model supports; callers use this before
// estimating cost so the credits reserved match the video that will actually be generated.
export function normalizeRequest(params, name = config.videoProvider) {
	return getProvider(name).normalizeRequest?.(params) ?? params;
}
