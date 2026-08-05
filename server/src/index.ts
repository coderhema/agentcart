import { app } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import './x402.js';

app.listen(config.port, () => {
  logger.info(`AgentCart admin API running on port ${config.port}`);
  logger.info(`Network: ${config.algorand.network}`);
  logger.info(`Facilitator: ${config.x402.facilitator}`);
});