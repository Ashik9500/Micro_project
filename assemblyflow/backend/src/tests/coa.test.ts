import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateProgram } from '../services/flat/validator';
import { buildInstructionNodes } from '../services/daa/dependencyGraph';
import { simulatePipeline } from '../services/coa/pipelineSimulator';

describe('COA Module — 5-Stage Pipeline Simulator Tests', () => {
  it('correctly simulates a single instruction with ideal 5-stage latency', () => {
    const code = 'LOAD R1, 42';
    const validation = validateProgram(code);
    assert.strictEqual(validation.isValid, true);

    const nodes = buildInstructionNodes(validation.lines);
    assert.strictEqual(nodes.length, 1);

    const result = simulatePipeline(nodes, { forwardingEnabled: false });

    assert.strictEqual(result.totalInstructions, 1);
    assert.strictEqual(result.totalCycles, 5);
    assert.strictEqual(result.totalStalls, 0);
    assert.strictEqual(result.cpi, 5.0);
    assert.strictEqual(result.idealCycles, 5);
    assert.strictEqual(result.hazards.length, 0);

    const i1 = result.schedule[0];
    assert.strictEqual(i1.fetchCycle, 1);
    assert.strictEqual(i1.decodeCycle, 2);
    assert.strictEqual(i1.executeCycle, 3);
    assert.strictEqual(i1.memoryCycle, 4);
    assert.strictEqual(i1.writeBackCycle, 5);
    assert.strictEqual(i1.stallCycles, 0);
  });

  it('correctly schedules multiple independent instructions with 0 stalls', () => {
    const code = `
      LOAD R1, 10
      LOAD R2, 20
      LOAD R3, 30
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const result = simulatePipeline(nodes, { forwardingEnabled: false });

    // 3 instructions in 5-stage pipeline without hazards: N + 4 = 7 cycles
    assert.strictEqual(result.totalInstructions, 3);
    assert.strictEqual(result.totalCycles, 7);
    assert.strictEqual(result.totalStalls, 0);
    assert.strictEqual(result.idealCycles, 7);
    assert.strictEqual(result.cpi, 2.33);
    assert.strictEqual(result.hazards.length, 0);

    // Verify stage staggering
    assert.strictEqual(result.schedule[0].fetchCycle, 1);
    assert.strictEqual(result.schedule[1].fetchCycle, 2);
    assert.strictEqual(result.schedule[2].fetchCycle, 3);

    assert.strictEqual(result.schedule[0].writeBackCycle, 5);
    assert.strictEqual(result.schedule[1].writeBackCycle, 6);
    assert.strictEqual(result.schedule[2].writeBackCycle, 7);
  });

  it('detects a simple RAW dependency and inserts 2 stall cycles without forwarding', () => {
    const code = `
      LOAD R1, 100
      MOV  R2, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);

    // Simulation without forwarding (default)
    const resultNoForwarding = simulatePipeline(nodes, { forwardingEnabled: false });

    // I1 finishes WB in cycle 5. I2 wants ID in cycle 3.
    // I2 must stall in cycles 3 and 4 (2 stall cycles).
    // I2 completes ID in cycle 5, EX in 6, MEM in 7, WB in 8.
    assert.strictEqual(resultNoForwarding.totalInstructions, 2);
    assert.strictEqual(resultNoForwarding.totalCycles, 8);
    assert.strictEqual(resultNoForwarding.totalStalls, 2);
    assert.strictEqual(resultNoForwarding.cpi, 4.0);
    assert.strictEqual(resultNoForwarding.hazards.length, 1);
    assert.strictEqual(resultNoForwarding.hazards[0].register, 'R1');
    assert.strictEqual(resultNoForwarding.hazards[0].stallCycles, 2);

    const i2 = resultNoForwarding.schedule[1];
    assert.strictEqual(i2.fetchCycle, 2);
    assert.strictEqual(i2.timeline[3], 'STALL');
    assert.strictEqual(i2.timeline[4], 'STALL');
    assert.strictEqual(i2.timeline[5], 'ID');
    assert.strictEqual(i2.timeline[6], 'EX');
    assert.strictEqual(i2.timeline[7], 'MEM');
    assert.strictEqual(i2.timeline[8], 'WB');
  });

  it('resolves RAW hazard with 0 stalls when data forwarding is enabled', () => {
    const code = `
      LOAD R1, 100
      MOV  R2, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);

    const resultWithForwarding = simulatePipeline(nodes, { forwardingEnabled: true });

    // With forwarding: value ready at end of EX (cycle 3) for EX in cycle 4
    // Zero stall bubbles inserted!
    assert.strictEqual(resultWithForwarding.totalInstructions, 2);
    assert.strictEqual(resultWithForwarding.totalCycles, 6);
    assert.strictEqual(resultWithForwarding.totalStalls, 0);
    assert.strictEqual(resultWithForwarding.cpi, 3.0);
  });

  it('simulates a 3-instruction dependency chain correctly', () => {
    const code = `
      LOAD R1, 10
      ADD  R2, R1, R1
      SUB  R3, R2, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const result = simulatePipeline(nodes, { forwardingEnabled: false });

    assert.strictEqual(result.totalInstructions, 3);
    // I1: IF:1, ID:2, EX:3, MEM:4, WB:5
    // I2: IF:2, STALL:3, STALL:4, ID:5, EX:6, MEM:7, WB:8 (2 stalls)
    // I3: IF:5, STALL:6, STALL:7, ID:8, EX:9, MEM:10, WB:11 (2 stalls)
    // Total stalls: 4. Total cycles: 11.
    assert.strictEqual(result.totalCycles, 11);
    assert.strictEqual(result.totalStalls, 4);
    assert.strictEqual(result.cpi, 3.67);
    assert.strictEqual(result.schedule[1].stallCycles, 2);
    assert.strictEqual(result.schedule[2].stallCycles, 2);
  });

  it('handles multiple dependencies where consumer reads two separate producer registers', () => {
    const code = `
      LOAD R1, 10
      LOAD R2, 20
      ADD  R3, R1, R2
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const result = simulatePipeline(nodes, { forwardingEnabled: false });

    // I1: IF:1, ID:2, EX:3, MEM:4, WB:5
    // I2: IF:2, ID:3, EX:4, MEM:5, WB:6
    // I3: IF:3. Earliest ID: 4.
    // I3 needs R1 (WB at 5) and R2 (WB at 6).
    // I3 must wait until max(5, 6) = cycle 6.
    // Stalls in cycle 4 and 5 (2 stalls).
    // ID in 6, EX in 7, MEM in 8, WB in 9. Total cycles: 9.
    assert.strictEqual(result.totalInstructions, 3);
    assert.strictEqual(result.totalCycles, 9);
    assert.strictEqual(result.totalStalls, 2);
    assert.strictEqual(result.cpi, 3.0);
    assert.strictEqual(result.hazards.length, 2);
  });

  it('rejects empty input with an informative error and does not compute CPI', () => {
    assert.throws(
      () => {
        simulatePipeline([]);
      },
      {
        message: 'Cannot simulate pipeline for an empty instruction list.',
      }
    );
  });

  it('rejects invalid assembly grammar before simulation', () => {
    const invalidCode = 'INVALID_OP R1, 100';
    const validation = validateProgram(invalidCode);
    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.errorCount, 1);
  });

  it('verifies pipeline timing consistency and structural invariants', () => {
    const code = `
      LOAD R1, 5
      LOAD R2, 10
      ADD  R3, R1, R2
      SUB  R4, R3, R1
    `;
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const result = simulatePipeline(nodes, { forwardingEnabled: false });

    assert.strictEqual(result.success, true);
    assert.ok(result.totalCycles > 0);
    assert.strictEqual(result.cpi, Number((result.totalCycles / result.totalInstructions).toFixed(2)));

    // Verify structural invariant: at any cycle C, each active stage (IF, ID, EX, MEM, WB)
    // is occupied by at most ONE instruction
    const stages: ('IF' | 'ID' | 'EX' | 'MEM' | 'WB')[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

    for (let c = 1; c <= result.totalCycles; c++) {
      for (const stage of stages) {
        let countInStageAtCycle = 0;
        for (const inst of result.schedule) {
          if (inst.timeline[c] === stage) {
            countInStageAtCycle++;
          }
        }
        assert.ok(
          countInStageAtCycle <= 1,
          `Structural hazard detected at cycle ${c} for stage ${stage}: ${countInStageAtCycle} instructions present`
        );
      }
    }
  });

  it('verifies cycle headers and assumptions are fully populated', () => {
    const code = 'LOAD R0, 1';
    const validation = validateProgram(code);
    const nodes = buildInstructionNodes(validation.lines);
    const result = simulatePipeline(nodes);

    assert.deepStrictEqual(result.cycleHeaders, [1, 2, 3, 4, 5]);
    assert.ok(result.assumptions.length >= 5);
    assert.ok(result.assumptions.some((a) => a.includes('5-Stage RISC')));
    assert.ok(result.assumptions.some((a) => a.includes('Split-Phase Register File')));
  });
});
