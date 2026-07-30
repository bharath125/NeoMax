import { app } from './src/app.js';
import { config } from './src/config/index.js';
import { connectDb } from './src/config/db.js';
import { logger } from './src/utils/logger.js';

async function start() {
	await connectDb();
	app.listen(config.port, () => logger.info(`ViewMax API listening on :${config.port}`));
}

start();
