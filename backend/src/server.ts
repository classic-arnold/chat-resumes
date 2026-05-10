import { createServer as createHttpServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { createRealtimeGateway } from './lib/realtime.js';

const app = createApp();
const httpServer = createHttpServer(app);
const realtimeGateway = createRealtimeGateway(httpServer);

httpServer.listen(env.port, () => {
  logger.info('server.started', {
    appBaseUrl: env.appBaseUrl,
    port: env.port,
  });
  realtimeGateway.logActivity({
    event: 'gateway.ready',
    scope: 'system',
  });
});