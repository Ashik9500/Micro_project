import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../app';

describe('Step 7 — Comprehensive Backend & End-to-End Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 5000;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ==========================================================================
  // 1. Every Individual API Endpoint Verification
  // ==========================================================================
  describe('Endpoint Verification — All Available Endpoints', () => {
    it('GET /api/health returns 200 and healthy status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.message.includes('AssemblyFlow'));
    });

    it('POST /api/flat/tokenize splits valid instructions into tokens', async () => {
      const res = await fetch(`${baseUrl}/api/flat/tokenize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'LOAD R1, 100' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.lines.length, 1);
      assert.strictEqual(data.lines[0].tokens[0].type, 'OPCODE');
      assert.strictEqual(data.lines[0].tokens[0].value, 'LOAD');
    });

    it('POST /api/flat/tokenize rejects non-string or missing body', async () => {
      const res = await fetch(`${baseUrl}/api/flat/tokenize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 1234 }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('POST /api/flat/validate returns validation results and AST', async () => {
      const res = await fetch(`${baseUrl}/api/flat/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'MOV R2, R1' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.result.isValid, true);
      assert.strictEqual(data.result.instructionCount, 1);
    });

    it('GET /api/flat/dfa returns Register Token DFA 5-tuple definition', async () => {
      const res = await fetch(`${baseUrl}/api/flat/dfa`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.dfa.states.includes('q0'));
      assert.ok(data.dfa.acceptingStates.includes('q4'));
    });

    it('POST /api/flat/dfa/simulate accepts valid register string (R7)', async () => {
      const res = await fetch(`${baseUrl}/api/flat/dfa/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'R7' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.trace.isAccepted, true);
      assert.strictEqual(data.trace.finalState, 'q4');
    });

    it('POST /api/flat/dfa/simulate rejects out-of-range register (R16)', async () => {
      const res = await fetch(`${baseUrl}/api/flat/dfa/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'R16' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.trace.isAccepted, false);
      assert.strictEqual(data.trace.finalState, 'q_trap');
    });

    it('POST /api/daa/analyze builds dependency DAG and topological order', async () => {
      const res = await fetch(`${baseUrl}/api/daa/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'LOAD R1, 10\nMOV R2, R1' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.analysis.totalInstructions, 2);
      assert.strictEqual(data.analysis.rawCount, 1);
      assert.strictEqual(data.analysis.totalDependencies, 1);
      assert.deepStrictEqual(data.analysis.topologicalSort.order, ['I1', 'I2']);
    });

    it('POST /api/daa/analyze rejects code with syntax errors', async () => {
      const res = await fetch(`${baseUrl}/api/daa/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'BOGUS R1, 10' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('POST /api/coa/simulate produces 5-stage timing matrix and CPI', async () => {
      const res = await fetch(`${baseUrl}/api/coa/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'LOAD R1, 10\nMOV R2, R1', forwardingEnabled: false }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.simulation.totalInstructions, 2);
      assert.strictEqual(data.simulation.totalCycles, 8);
      assert.strictEqual(data.simulation.totalStalls, 2);
      assert.strictEqual(data.simulation.cpi, 4.0);
    });

    it('POST /api/coa/simulate rejects empty instruction code', async () => {
      const res = await fetch(`${baseUrl}/api/coa/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '; only comments' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });
  });

  // ==========================================================================
  // 2. Dedicated End-to-End Test Cases (A to G)
  // ==========================================================================
  describe('Specific User Test Cases A through G', () => {
    // Test A: Single instruction
    it('Test A — Single instruction: LOAD R1, 10', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'LOAD R1, 10' }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.stage, 'complete');

      // FLAT
      assert.strictEqual(data.flat.isValid, true);
      assert.strictEqual(data.flat.instructionCount, 1);

      // DAA
      assert.strictEqual(data.daa.totalInstructions, 1);
      assert.strictEqual(data.daa.totalDependencies, 0);
      assert.strictEqual(data.daa.isIndependent, true);
      assert.deepStrictEqual(data.daa.topologicalSort.order, ['I1']);

      // COA
      assert.strictEqual(data.coa.totalInstructions, 1);
      assert.strictEqual(data.coa.totalCycles, 5);
      assert.strictEqual(data.coa.totalStalls, 0);
      assert.strictEqual(data.coa.cpi, 5.0);
    });

    // Test B: Dependent instructions
    it('Test B — Dependent instructions: LOAD R1, 10 / ADD R2, R1, R3 / SUB R4, R2, R5', async () => {
      const code = `
        LOAD R1, 10
        ADD R2, R1, R3
        SUB R4, R2, R5
      `;
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, forwardingEnabled: false }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // FLAT
      assert.strictEqual(data.flat.isValid, true);
      assert.strictEqual(data.flat.instructionCount, 3);

      // DAA: RAW on R1 (I1->I2) and RAW on R2 (I2->I3)
      assert.strictEqual(data.daa.totalInstructions, 3);
      assert.strictEqual(data.daa.rawCount, 2);
      assert.strictEqual(data.daa.totalDependencies, 2);
      assert.strictEqual(data.daa.isIndependent, false);
      assert.deepStrictEqual(data.daa.topologicalSort.order, ['I1', 'I2', 'I3']);

      // COA: 2 stalls for I2 (waiting on R1 WB at CC5), 2 stalls for I3 (waiting on R2 WB at CC8)
      assert.strictEqual(data.coa.totalInstructions, 3);
      assert.strictEqual(data.coa.totalStalls, 4);
      assert.strictEqual(data.coa.totalCycles, 11);
      assert.strictEqual(data.coa.cpi, 3.67);

      // Verify forwarding eliminates the 4 stalls
      const resFwd = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, forwardingEnabled: true }),
      });
      const dataFwd = await resFwd.json();
      assert.strictEqual(dataFwd.coa.totalStalls, 0);
      assert.strictEqual(dataFwd.coa.totalCycles, 7);
      assert.strictEqual(dataFwd.coa.cpi, 2.33);
    });

    // Test C: Independent instructions
    it('Test C — Independent instructions: LOAD R1, 10 / MOV R2, R3 / LOAD R4, 20', async () => {
      const code = `
        LOAD R1, 10
        MOV R2, R3
        LOAD R4, 20
      `;
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // DAA: All independent
      assert.strictEqual(data.daa.totalInstructions, 3);
      assert.strictEqual(data.daa.totalDependencies, 0);
      assert.strictEqual(data.daa.isIndependent, true);
      assert.deepStrictEqual(data.daa.topologicalSort.order, ['I1', 'I2', 'I3']);

      // COA: Zero stalls, ideal N+4 = 7 cycles
      assert.strictEqual(data.coa.totalInstructions, 3);
      assert.strictEqual(data.coa.totalStalls, 0);
      assert.strictEqual(data.coa.totalCycles, 7);
      assert.strictEqual(data.coa.cpi, 2.33);
    });

    // Test D: Invalid opcode
    it('Test D — Invalid opcode: INVALID R1, R2', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'INVALID R1, R2' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.failedStage, 'flat');
      assert.ok(data.error.includes('Stage 1 (FLAT)'));
      assert.strictEqual(data.flat.isValid, false);
      assert.ok(data.flat.lines[0].errorMessage.includes('Unknown opcode'));
      assert.strictEqual(data.daa, null);
      assert.strictEqual(data.coa, null);
    });

    // Test E: Invalid register
    it('Test E — Invalid register: MOV R16, R1', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'MOV R16, R1' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.failedStage, 'flat');
      assert.strictEqual(data.flat.isValid, false);
      assert.ok(data.flat.lines[0].errorMessage.includes('R16'));
      assert.strictEqual(data.daa, null);
      assert.strictEqual(data.coa, null);
    });

    // Test F: Missing operand
    it('Test F — Missing operand: ADD R1, R2', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'ADD R1, R2' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.failedStage, 'flat');
      assert.strictEqual(data.flat.isValid, false);
      assert.ok(
        data.flat.lines[0].errorMessage.includes('Missing second comma') ||
        data.flat.lines[0].errorMessage.includes('Missing')
      );
      assert.strictEqual(data.daa, null);
      assert.strictEqual(data.coa, null);
    });

    // Test G: Empty input
    it('Test G — Empty input: Empty editor submission', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '   \n\n  ' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.failedStage, 'input');
      assert.ok(data.error.includes('empty'));
      assert.strictEqual(data.daa, null);
      assert.strictEqual(data.coa, null);
    });
  });

  // ==========================================================================
  // 3. Consistency Invariant Checks Across Modules
  // ==========================================================================
  describe('Invariants & Consistency Between FLAT, DAA, and COA', () => {
    it('verifies instruction count consistency across FLAT, DAA, and COA for mixed instructions', async () => {
      const code = `
        ; Program Header
        LOAD R0, 10
        LOAD R1, 20
        ADD  R2, R0, R1
        SUB  R3, R2, R0
        MOV  R4, R3
      `;
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();

      const flatCount = data.flat.instructionCount;
      const daaCount = data.daa.totalInstructions;
      const coaCount = data.coa.totalInstructions;

      assert.strictEqual(flatCount, 5);
      assert.strictEqual(daaCount, 5);
      assert.strictEqual(coaCount, 5);
      assert.strictEqual(flatCount, daaCount);
      assert.strictEqual(daaCount, coaCount);

      // Verify that topological order has all 5 instructions
      assert.strictEqual(data.daa.topologicalSort.order.length, 5);

      // Verify schedule has all 5 instructions with valid timelines
      assert.strictEqual(data.coa.schedule.length, 5);
      for (const inst of data.coa.schedule) {
        assert.ok(inst.timeline[inst.fetchCycle] === 'IF');
        assert.ok(inst.timeline[inst.decodeCycle] === 'ID');
        assert.ok(inst.timeline[inst.executeCycle] === 'EX');
        assert.ok(inst.timeline[inst.memoryCycle] === 'MEM');
        assert.ok(inst.timeline[inst.writeBackCycle] === 'WB');
      }
    });
  });
});
