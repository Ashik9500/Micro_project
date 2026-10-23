import { Request, Response } from 'express';
import { validateProgram } from '../services/flat/validator';
import {
  buildInstructionNodes,
  buildDependencyGraph,
} from '../services/daa/dependencyGraph';
import { kahnTopologicalSort } from '../services/daa/topologicalSort';
import { DAAAnalysisResult } from '../services/daa/types';

/**
 * Controller handling DAA dependency analysis HTTP requests.
 */
export class DaaController {
  /**
   * POST /api/daa/analyze
   * Validates assembly, builds dependency graph (RAW, WAR, WAW),
   * and computes topological ordering using Kahn's algorithm.
   */
  public static analyze(req: Request, res: Response): void {
    const { code } = req.body;

    if (code === undefined || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'code' field in request body. Must be a string.",
      });
      return;
    }

    try {
      // 1. Validate with FLAT module first - never schedule invalid instructions
      const validation = validateProgram(code);
      if (!validation.isValid || validation.errorCount > 0) {
        res.status(400).json({
          success: false,
          error: `Cannot perform dependency analysis on code with grammar or semantic errors (${validation.errorCount} error(s) found).`,
          validationResult: validation,
        });
        return;
      }

      // 2. Build instruction nodes
      const nodes = buildInstructionNodes(validation.lines);
      if (nodes.length === 0) {
        res.json({
          success: true,
          analysis: {
            success: true,
            totalInstructions: 0,
            nodes: [],
            edges: [],
            rawCount: 0,
            warCount: 0,
            wawCount: 0,
            totalDependencies: 0,
            isIndependent: true,
            topologicalSort: {
              order: [],
              orderedNodes: [],
              hasCycle: false,
              steps: [],
            },
            explanations: ['No executable instructions to analyze.'],
          } as DAAAnalysisResult,
        });
        return;
      }

      // 3. Build directed dependency graph
      const { edges, rawCount, warCount, wawCount, explanations } =
        buildDependencyGraph(nodes);

      // 4. Execute Kahn's algorithm for topological sorting
      const topologicalSort = kahnTopologicalSort(nodes, edges);

      const totalDependencies = edges.length;
      const isIndependent = totalDependencies === 0;

      const analysisResult: DAAAnalysisResult = {
        success: !topologicalSort.hasCycle,
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
            : ['All instructions are completely independent. Any ordering is valid; original program order preserved.'],
      };

      res.json({
        success: true,
        analysis: analysisResult,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown DAA error';
      res.status(500).json({
        success: false,
        error: `DAA dependency analysis failed: ${message}`,
      });
    }
  }
}
