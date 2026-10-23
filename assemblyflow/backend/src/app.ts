import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import healthRoutes from './routes/health';
import flatRoutes from './routes/flat';
import daaRoutes from './routes/daa';
import coaRoutes from './routes/coa';
import analyzeRoutes from './routes/analyze';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', healthRoutes);
app.use('/api/flat', flatRoutes);
app.use('/api/daa', daaRoutes);
app.use('/api/coa', coaRoutes);
app.use('/api/analyze', analyzeRoutes);

// Candidate paths for built frontend static assets (supports dev, monorepo, and containerized layouts)
const candidateFrontendPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'assemblyflow/frontend/dist'),
  path.resolve(process.cwd(), 'dist/frontend'),
];

const frontendDistPath = candidateFrontendPaths.find(
  (candidate) => fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))
);

if (frontendDistPath) {
  // Serve static assets (HTML, CSS, JS, images)
  app.use(express.static(frontendDistPath));

  // Catch-all handler for Single Page Application (SPA) client-side routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Root fallback route when static frontend build is not found
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Welcome to AssemblyFlow API. Use /api/health to check server status.'
    });
  });
}

export default app;

