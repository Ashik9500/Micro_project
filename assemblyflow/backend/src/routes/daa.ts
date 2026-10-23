import { Router } from 'express';
import { DaaController } from '../controllers/daa.controller';

const router = Router();

// POST /api/daa/analyze - Analyze register dependencies and compute topological sort
router.post('/analyze', DaaController.analyze);

export default router;
