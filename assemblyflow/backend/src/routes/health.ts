import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health - Health check endpoint to verify backend status
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AssemblyFlow Backend is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
