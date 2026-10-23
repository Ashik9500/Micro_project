import { Request, Response } from 'express';
import { tokenizeProgram } from '../services/flat/tokenizer';
import { validateProgram } from '../services/flat/validator';
import {
  REGISTER_DFA_DEFINITION,
  simulateRegisterDFA,
} from '../services/flat/dfa';

/**
 * Controller handling FLAT module HTTP requests.
 */
export class FlatController {
  /**
   * POST /api/flat/tokenize
   * Splits assembly code into structured line-by-line tokens.
   */
  public static tokenize(req: Request, res: Response): void {
    const { code } = req.body;

    if (code === undefined || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'code' field in request body. Must be a string.",
      });
      return;
    }

    try {
      const lineTokens = tokenizeProgram(code);
      res.json({
        success: true,
        lines: lineTokens,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown tokenization error';
      res.status(500).json({
        success: false,
        error: `Tokenization failed: ${message}`,
      });
    }
  }

  /**
   * POST /api/flat/validate
   * Validates assembly code against the supported educational grammar.
   */
  public static validate(req: Request, res: Response): void {
    const { code } = req.body;

    if (code === undefined || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'code' field in request body. Must be a string.",
      });
      return;
    }

    try {
      const result = validateProgram(code);
      res.json({
        success: true,
        result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown validation error';
      res.status(500).json({
        success: false,
        error: `Validation failed: ${message}`,
      });
    }
  }

  /**
   * GET /api/flat/dfa
   * Returns formal definition of the Register Identifier DFA.
   */
  public static getDfaDefinition(_req: Request, res: Response): void {
    res.json({
      success: true,
      dfa: REGISTER_DFA_DEFINITION,
    });
  }

  /**
   * POST /api/flat/dfa/simulate
   * Simulates a candidate string through the Register DFA and returns state trace.
   */
  public static simulateDfa(req: Request, res: Response): void {
    const { token } = req.body;

    if (token === undefined || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'token' field in request body. Must be a string.",
      });
      return;
    }

    try {
      const trace = simulateRegisterDFA(token.trim());
      res.json({
        success: true,
        trace,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown DFA simulation error';
      res.status(500).json({
        success: false,
        error: `DFA simulation failed: ${message}`,
      });
    }
  }
}
