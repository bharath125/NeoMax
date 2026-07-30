/**
 * Contract every video-gen provider module must implement, so the worker can swap
 * Kling/Runway/Luma without touching queue or controller code.
 *
 * createGeneration({ prompt, imageUrl, durationSeconds, resolution }) => Promise<{ providerJobId: string }>
 * getStatus(providerJobId) => Promise<{ status: 'processing'|'completed'|'failed', videoUrl?: string, error?: string }>
 */
