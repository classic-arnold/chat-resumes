import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { healthRouter } from './routes/health.js';

export const createApp = () => {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(
    cors({
      origin: clientOrigin,
    }),
  );
  app.use(express.json());

  app.get('/', (_request, response) => {
    response.json({
      name: 'chat-resumes-backend',
      status: 'ok',
    });
  });

  app.use('/health', healthRouter);

  return app;
};