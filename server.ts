import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDatabase, getDatabaseStatus } from './server/db';
import projectRoutes from './server/routes/projectRoutes';
import subjectRoutes from './server/routes/subjectRoutes';
import studentRoutes from './server/routes/studentRoutes';
import markEntryRoutes from './server/routes/markEntryRoutes';
import resultRoutes from './server/routes/resultRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  app.use('/api/projects', projectRoutes);
  app.use('/api/projects/:projectId/subjects', subjectRoutes);
  app.use('/api/projects/:projectId/students', studentRoutes);
  app.use('/api/projects/:projectId/mark-entries', markEntryRoutes);
  app.use('/api/projects/:projectId/results', resultRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString()
    });
  });

  // Development vs Production serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Dynamic import of Vite in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
