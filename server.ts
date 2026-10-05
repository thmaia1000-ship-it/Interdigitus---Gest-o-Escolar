import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

  // Rotas de API
  app.use('/api', apiRouter);

  // Rota de Health Check (para Cloud Run, Docker e monitoramento)
  app.get(['/health', '/_healthz', '/healthz'], (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 para rotas de API não encontradas
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });

  if (!isProduction) {
    // Modo de Desenvolvimento: Vite Dev Server integrado
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo de Produção: arquivos estáticos do dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Interdigitus] Servidor operacional na porta ${PORT} (Modo: ${isProduction ? 'Produção' : 'Desenvolvimento'})`);
  });
}

startServer().catch((err) => {
  console.error('[Interdigitus] Falha crítica ao iniciar servidor:', err);
  process.exit(1);
});
