import express from 'express';
import path from 'path';
import fs from 'fs';
import { apiRouter } from '../src/server/api.ts';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'vercel-serverless', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api', apiRouter);
// Fallback para chamadas diretas
app.use(apiRouter);

export default app;
