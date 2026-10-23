import { InstructionAST, LineValidationResult } from '../flat/types';
import { DAANode, DAAEdge, DependencyType } from './types';

/**
 * Extracts read and write registers from a validated instruction AST.
 */
export function extractRegisterUsage(instruction: InstructionAST): {
  reads: string[];
  writes: string[];
} {
  const writes: string[] = [instruction.destination.toUpperCase()];
  const readSet = new Set<string>();

  switch (instruction.opcode) {
    case 'LOAD':
      // LOAD Rd, integer -> Writes Rd, reads no registers
      break;

    case 'MOV':
      // MOV Rd, Rs -> Writes Rd, reads Rs (first operand)
      if (typeof instruction.operands[0] === 'string') {
        readSet.add(instruction.operands[0].toUpperCase());
      }
      break;

    case 'ADD':
    case 'SUB':
      // ADD/SUB Rd, Rs1, Rs2 -> Writes Rd, reads Rs1 and Rs2
      for (const op of instruction.operands) {
        if (typeof op === 'string') {
          readSet.add(op.toUpperCase());
        }
      }
      break;
  }

  return {
    reads: Array.from(readSet),
    writes,
  };
}

/**
 * Converts validated program lines into sequential DAA graph nodes.
 */
export function buildInstructionNodes(lines: LineValidationResult[]): DAANode[] {
  const nodes: DAANode[] = [];
  let instructionCounter = 0;

  for (const line of lines) {
    if (!line.isEmpty && !line.isCommentOnly && line.isValid && line.instruction) {
      instructionCounter++;
      const { reads, writes } = extractRegisterUsage(line.instruction);

      nodes.push({
        id: `I${instructionCounter}`,
        instructionIndex: instructionCounter,
        lineNumber: line.lineNumber,
        raw: line.raw.trim(),
        opcode: line.instruction.opcode,
        destination: line.instruction.destination,
        operands: line.instruction.operands,
        reads,
        writes,
      });
    }
  }

  return nodes;
}

/**
 * Builds directed dependency graph edges between instructions.
 * Detects RAW (true), WAR (anti), and WAW (output) dependencies.
 * Automatically eliminates duplicate edges between the same node pairs.
 */
export function buildDependencyGraph(nodes: DAANode[]): {
  edges: DAAEdge[];
  rawCount: number;
  warCount: number;
  wawCount: number;
  explanations: string[];
} {
  const edges: DAAEdge[] = [];
  const explanations: string[] = [];
  let rawCount = 0;
  let warCount = 0;
  let wawCount = 0;

  const total = nodes.length;

  for (let i = 0; i < total; i++) {
    const nodeA = nodes[i];

    for (let j = i + 1; j < total; j++) {
      const nodeB = nodes[j];

      const detectedTypes: DependencyType[] = [];
      const affectedRegisters = new Set<string>();
      const reasons: string[] = [];

      // 1. RAW (Read-After-Write / True Dependency)
      // Node A writes to a register that Node B reads
      for (const reg of nodeA.writes) {
        if (nodeB.reads.includes(reg)) {
          if (!detectedTypes.includes('RAW')) {
            detectedTypes.push('RAW');
            rawCount++;
          }
          affectedRegisters.add(reg);
          reasons.push(`${nodeA.id} writes ${reg} which is read by ${nodeB.id} (RAW true dependency)`);
        }
      }

      // 2. WAR (Write-After-Read / Anti-Dependency)
      // Node A reads from a register that Node B writes
      for (const reg of nodeA.reads) {
        if (nodeB.writes.includes(reg)) {
          if (!detectedTypes.includes('WAR')) {
            detectedTypes.push('WAR');
            warCount++;
          }
          affectedRegisters.add(reg);
          reasons.push(`${nodeA.id} reads ${reg} before it is overwritten by ${nodeB.id} (WAR anti-dependency)`);
        }
      }

      // 3. WAW (Write-After-Write / Output Dependency)
      // Node A writes to a register that Node B also writes
      for (const reg of nodeA.writes) {
        if (nodeB.writes.includes(reg)) {
          if (!detectedTypes.includes('WAW')) {
            detectedTypes.push('WAW');
            wawCount++;
          }
          affectedRegisters.add(reg);
          reasons.push(`${nodeA.id} writes ${reg} before it is overwritten by ${nodeB.id} (WAW output dependency)`);
        }
      }

      // If any dependency was identified, create a single consolidated edge
      if (detectedTypes.length > 0) {
        const regList = Array.from(affectedRegisters);
        const typeStr = detectedTypes.join(' + ');
        const combinedExplanation = `${nodeA.id} &rarr; ${nodeB.id} [${typeStr} on ${regList.join(', ')}]: ${reasons.join('; ')}`;

        edges.push({
          id: `${nodeA.id}->${nodeB.id}`,
          from: nodeA.id,
          to: nodeB.id,
          fromIndex: nodeA.instructionIndex,
          toIndex: nodeB.instructionIndex,
          types: detectedTypes,
          registers: regList,
          explanation: combinedExplanation,
        });

        explanations.push(combinedExplanation);
      }
    }
  }

  return {
    edges,
    rawCount,
    warCount,
    wawCount,
    explanations,
  };
}
