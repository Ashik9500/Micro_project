import { Request, Response } from 'express';
import { validateProgram } from '../services/flat/validator';
import {
  buildInstructionNodes,
  buildDependencyGraph,
} from '../services/daa/dependencyGraph';
import { kahnTopologicalSort } from '../services/daa/topologicalSort';
import { simulatePipeline } from '../services/coa/pipelineSimulator';
import { DAAAnalysisResult } from '../services/daa/types';

/**
 * Controller for the complete end-to-end AssemblyFlow workflow.
 * Coordinates:
 *   Stage 1: FLAT Lexical & Grammar Validation
 *   Stage 2: DAA Register Dependency Analysis & Kahn DAG Scheduling
 *   Stage 3: COA 5-Stage RISC Pipeline Simulation
 */
export class AnalyzeController {
  /**
   * POST /api/analyze
   * Executes the full pipeline in order. If any stage fails,
   * subsequent stages are safely halted and a structured error is returned.
   */
  public static analyze(req: Request, res: Response): void {
    const { code, forwardingEnabled } = req.body;

    // 1. Verify input existence and type
    if (code === undefined || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        failedStage: 'input',
        error: "Missing or invalid 'code' field in request body. Must be a string.",
        flat: null,
        daa: null,
        coa: null,
      });
      return;
    }

    if (!code.trim()) {
      res.status(400).json({
        success: false,
        failedStage: 'input',
        error: 'Assembly code input is empty. Please enter at least one assembly instruction.',
        flat: null,
        daa: null,
        coa: null,
      });
      return;
    }

    try {
      // ----------------------------------------------------------------------
      // STAGE 1: FLAT Validation (Lexical & Grammar Analysis)
      // ----------------------------------------------------------------------
      const flatValidation = validateProgram(code);

      if (!flatValidation.isValid || flatValidation.errorCount > 0) {
        res.status(400).json({
          success: false,
          failedStage: 'flat',
          error: `Workflow halted at Stage 1 (FLAT): Found ${flatValidation.errorCount} syntax/grammar error(s). Stages DAA and COA were not executed.`,
          flat: flatValidation,
          daa: null,
          coa: null,
        });
        return;
      }

      // Check if code contains only comments or whitespace
      const nodes = buildInstructionNodes(flatValidation.lines);

      if (nodes.length === 0) {
        res.status(400).json({
          success: false,
          failedStage: 'flat',
          error: 'Workflow halted at Stage 1 (FLAT): Code contains no executable assembly instructions (only comments/whitespace).',
          flat: flatValidation,
          daa: null,
          coa: null,
        });
        return;
      }

      // ----------------------------------------------------------------------
      // STAGE 2: DAA Dependency Analysis & Kahn's Topological Scheduling
      // ----------------------------------------------------------------------
      const { edges, rawCount, warCount, wawCount, explanations } =
        buildDependencyGraph(nodes);

      const topologicalSort = kahnTopologicalSort(nodes, edges);

      if (topologicalSort.hasCycle) {
        res.status(400).json({
          success: false,
          failedStage: 'daa',
          error: `Workflow halted at Stage 2 (DAA): ${topologicalSort.cycleError || 'Dependency cycle detected'}. Stage COA was not executed.`,
          flat: flatValidation,
          daa: {
            success: false,
            totalInstructions: nodes.length,
            nodes,
            edges,
            rawCount,
            warCount,
            wawCount,
            totalDependencies: edges.length,
            isIndependent: false,
            topologicalSort,
            explanations,
          } as DAAAnalysisResult,
          coa: null,
        });
        return;
      }

      const totalDependencies = edges.length;
      const isIndependent = totalDependencies === 0;

      const daaResult: DAAAnalysisResult = {
        success: true,
        totalInstructions: nodes.length,
        nodes,
        edges,
        rawCount,
        warCount,
        wawCount,
        totalDependencies,
        isIndependent,
        topologicalSort,
        explanations:
          explanations.length > 0
            ? explanations
            : ['All instructions are completely independent. Original program order preserved.'],
      };

      // ----------------------------------------------------------------------
      // STAGE 3: COA 5-Stage RISC Pipeline Simulation
      // ----------------------------------------------------------------------
      const coaResult = simulatePipeline(nodes, {
        forwardingEnabled: Boolean(forwardingEnabled),
      });

      // ----------------------------------------------------------------------
      // COMPLETE WORKFLOW SUCCESS
      // ----------------------------------------------------------------------
      res.json({
        success: true,
        stage: 'complete',
        message: 'Full AssemblyFlow analysis completed successfully (FLAT → DAA → COA).',
        flat: flatValidation,
        daa: daaResult,
        coa: coaResult,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown pipeline error';
      res.status(500).json({
        success: false,
        failedStage: 'server',
        error: `AssemblyFlow workflow failed due to an internal error: ${message}`,
        flat: null,
        daa: null,
        coa: null,
      });
    }
  }
}
