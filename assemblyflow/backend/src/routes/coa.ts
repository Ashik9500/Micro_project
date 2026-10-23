import { Router } from 'express';
import { CoaController } from '../controllers/coa.controller';

const router = Router();

// POST /api/coa/simulate - Run 5-stage RISC pipeline simulation
router.post('/simulate', CoaController.simulate);

export default router;
