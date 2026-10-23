import { Request, Response } from 'express';
import { validateProgram } from '../services/flat/validator';
import { buildInstructionNodes } from '../services/daa/dependencyGraph';
import { simulatePipeline } from '../services/coa/pipelineSimulator';

/**
 * Controller handling COA pipeline simulation HTTP requests.
 */
export class CoaController {
  /**
   * POST /api/coa/simulate
   * Validates assembly code, checks for syntax/semantic errors,
   * extracts instruction nodes, and runs the 5-stage RISC pipeline simulation.
   */
  public static simulate(req: Request, res: Response): void {
    const { code, forwardingEnabled } = req.body;

    if (code === undefined || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'code' field in request body. Must be a string.",
      });
      return;
    }

    try {
      // 1. Validate assembly code with FLAT module first
      const validation = validateProgram(code);

      if (!validation.isValid || validation.errorCount > 0) {
        res.status(400).json({
          success: false,
          error: `Cannot simulate pipeline for code with syntax or semantic errors (${validation.errorCount} error(s) found).`,
          validationResult: validation,
        });
        return;
      }

      // 2. Extract valid instruction nodes
      const nodes = buildInstructionNodes(validation.lines);

      if (nodes.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot calculate CPI or simulate an empty instruction list. Please provide at least one valid assembly instruction.',
          validationResult: validation,
        });
        return;
      }

      // 3. Run pipeline simulation
      const simulation = simulatePipeline(nodes, {
        forwardingEnabled: Boolean(forwardingEnabled),
      });

      res.json({
        success: true,
        simulation,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown COA simulation error';
      res.status(500).json({
        success: false,
        error: `Pipeline simulation failed: ${message}`,
      });
    }
  }
}
