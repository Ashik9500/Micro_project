import { Router } from 'express';
import { AnalyzeController } from '../controllers/analyze.controller';

const router = Router();

// POST /api/analyze - Run complete AssemblyFlow workflow (FLAT -> DAA -> COA)
router.post('/', AnalyzeController.analyze);

export default router;
