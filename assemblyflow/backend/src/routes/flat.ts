import { Router } from 'express';
import { FlatController } from '../controllers/flat.controller';

const router = Router();

// POST /api/flat/tokenize - Tokenize assembly code into structured line-by-line tokens
router.post('/tokenize', FlatController.tokenize);

// POST /api/flat/validate - Validate assembly program against grammar rules
router.post('/validate', FlatController.validate);

// GET /api/flat/dfa - Retrieve formal definition of the Register Identifier DFA
router.get('/dfa', FlatController.getDfaDefinition);

// POST /api/flat/dfa/simulate - Trace candidate token through the Register DFA
router.post('/dfa/simulate', FlatController.simulateDfa);

export default router;
