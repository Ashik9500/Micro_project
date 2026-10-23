import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateProgram } from '../services/flat/validator';
import {
  buildInstructionNodes,
  buildDependencyGraph,
  extractRegisterUsage,
} from '../services/daa/dependencyGraph';
import { kahnTopologicalSort } from '../services/daa/topologicalSort';
import { DAANode, DAAEdge } from '../services/daa/types';

describe('DAA Module — Register Usage Extraction', () => {
  it('correctly extracts writes and empty reads for LOAD', () => {
    const { reads, writes } = extractRegisterUsage({
      opcode: 'LOAD',
      destination: 'R1',
      operands: [100],
    });
    assert.deepStrictEqual(writes, ['R1']);
    assert.deepStrictEqual(reads, []);
  });

  it('correctly extracts reads and writes for MOV', () => {
    const { reads, writes } = extractRegisterUsage({
      opcode: 'MOV',
      destination: 'R2',
      operands: ['R1'],
    });
    assert.deepStrictEqual(writes, ['R2']);
    assert.deepStrictEqual(reads, ['R1']);
  });

  it('correctly extracts reads and writes for ADD and SUB', () => {
    const addUsage = extractRegisterUsage({
      opcode: 'ADD',
      destination: 'R3',
      operands: ['R1', 'R2'],
    });
    assert.deepStrictEqual(addUsage.writes, ['R3']);
    assert.strictEqual(addUsage.reads.includes('R1'), true);
    assert.strictEqual(addUsage.reads.includes('R2'), true);

    // Repeated read operand (e.g. ADD R1, R2, R2)
    const repeatedUsage = extractRegisterUsage({
      opcode: 'ADD',
      destination: 'R1',
      operands: ['R2', 'R2'],
    });
    assert.deepStrictEqual(repeatedUsage.reads, ['R2']); // Deduplicated read set
  });
});

describe('DAA Module — Dependency Graph Construction (RAW, WAR, WAW)', () => {
  it('identifies RAW (Read-After-Write) true dependencies', () => {
    const code = `
      LOAD R1, 10
      ADD  R2, R1, R0
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges, rawCount } = buildDependencyGraph(nodes);

    assert.strictEqual(rawCount, 1);
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].from, 'I1');
    assert.strictEqual(edges[0].to, 'I2');
    assert.strictEqual(edges[0].types.includes('RAW'), true);
    assert.strictEqual(edges[0].registers.includes('R1'), true);
  });

  it('identifies WAR (Write-After-Read) anti-dependencies', () => {
    const code = `
      MOV R2, R1
      LOAD R1, 50
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges, warCount } = buildDependencyGraph(nodes);

    assert.strictEqual(warCount, 1);
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].from, 'I1');
    assert.strictEqual(edges[0].to, 'I2');
    assert.strictEqual(edges[0].types.includes('WAR'), true);
    assert.strictEqual(edges[0].registers.includes('R1'), true);
  });

  it('identifies WAW (Write-After-Write) output dependencies', () => {
    const code = `
      LOAD R1, 10
      LOAD R1, 20
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges, wawCount } = buildDependencyGraph(nodes);

    assert.strictEqual(wawCount, 1);
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].from, 'I1');
    assert.strictEqual(edges[0].to, 'I2');
    assert.strictEqual(edges[0].types.includes('WAW'), true);
    assert.strictEqual(edges[0].registers.includes('R1'), true);
  });

  it('prevents duplicate edges between the same two instructions', () => {
    // Instruction 1 writes R1 and reads R2. Instruction 2 reads R1 and writes R2.
    // Both RAW on R1 and WAR on R2 exist between I1 and I2.
    const code = `
      MOV R1, R2
      MOV R2, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges } = buildDependencyGraph(nodes);

    assert.strictEqual(edges.length, 1); // Consolidated into one edge
    assert.strictEqual(edges[0].types.includes('RAW'), true);
    assert.strictEqual(edges[0].types.includes('WAR'), true);
    assert.strictEqual(edges[0].registers.includes('R1'), true);
    assert.strictEqual(edges[0].registers.includes('R2'), true);
  });

  it('detects completely independent instructions', () => {
    const code = `
      LOAD R1, 10
      LOAD R2, 20
      LOAD R3, 30
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges } = buildDependencyGraph(nodes);

    assert.strictEqual(edges.length, 0); // No dependencies
  });

  it('correctly handles multi-instruction dependency chains', () => {
    const code = `
      LOAD R1, 100
      LOAD R2, 200
      ADD  R3, R1, R2
      SUB  R4, R3, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges, rawCount } = buildDependencyGraph(nodes);

    // Dependencies:
    // I1 -> I3 (RAW on R1)
    // I1 -> I4 (RAW on R1)
    // I2 -> I3 (RAW on R2)
    // I3 -> I4 (RAW on R3)
    assert.strictEqual(rawCount, 4);
    assert.strictEqual(edges.length, 4);
  });
});

describe("DAA Module — Kahn's Topological Sorting", () => {
  it('schedules simple dependency chains in valid topological order', () => {
    const code = `
      LOAD R1, 10
      ADD  R2, R1, R0
      SUB  R3, R2, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges } = buildDependencyGraph(nodes);
    const sortRes = kahnTopologicalSort(nodes, edges);

    assert.strictEqual(sortRes.hasCycle, false);
    assert.deepStrictEqual(sortRes.order, ['I1', 'I2', 'I3']);
  });

  it('preserves deterministic tie-breaking for independent instructions', () => {
    // When I1, I2, I3 are independent, deterministic tie-breaking should preserve I1, I2, I3
    const code = `
      LOAD R3, 30
      LOAD R2, 20
      LOAD R1, 10
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const { edges } = buildDependencyGraph(nodes);
    const sortRes = kahnTopologicalSort(nodes, edges);

    assert.strictEqual(sortRes.hasCycle, false);
    assert.deepStrictEqual(sortRes.order, ['I1', 'I2', 'I3']);
  });

  it('detects cycles when artificially presented with a cyclical graph', () => {
    // Artificial cyclic edge I2 -> I1 on nodes I1, I2
    const mockNodes: DAANode[] = [
      {
        id: 'I1',
        instructionIndex: 1,
        lineNumber: 1,
        raw: 'LOAD R1, 10',
        opcode: 'LOAD',
        operands: [10],
        reads: [],
        writes: ['R1'],
      },
      {
        id: 'I2',
        instructionIndex: 2,
        lineNumber: 2,
        raw: 'LOAD R2, 20',
        opcode: 'LOAD',
        operands: [20],
        reads: [],
        writes: ['R2'],
      },
    ];

    const mockEdges: DAAEdge[] = [
      {
        id: 'I1->I2',
        from: 'I1',
        to: 'I2',
        fromIndex: 1,
        toIndex: 2,
        types: ['RAW'],
        registers: ['R1'],
        explanation: 'I1 -> I2',
      },
      {
        id: 'I2->I1',
        from: 'I2',
        to: 'I1',
        fromIndex: 2,
        toIndex: 1,
        types: ['WAR'],
        registers: ['R2'],
        explanation: 'I2 -> I1 (Cycle)',
      },
    ];

    const sortRes = kahnTopologicalSort(mockNodes, mockEdges);
    assert.strictEqual(sortRes.hasCycle, true);
    assert.ok(sortRes.cycleError?.includes('Cycle detected'));
    assert.ok(sortRes.order.length < mockNodes.length);
  });
});
