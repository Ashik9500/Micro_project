import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../app';

describe('Integration — Full AssemblyFlow Workflow (POST /api/analyze)', () => {
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

  it('executes full workflow for a single valid instruction', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'LOAD R1, 100' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.stage, 'complete');

    // Stage 1 (FLAT)
    assert.ok(body.flat);
    assert.strictEqual(body.flat.isValid, true);
    assert.strictEqual(body.flat.instructionCount, 1);

    // Stage 2 (DAA)
    assert.ok(body.daa);
    assert.strictEqual(body.daa.totalInstructions, 1);
    assert.strictEqual(body.daa.totalDependencies, 0);
    assert.deepStrictEqual(body.daa.topologicalSort.order, ['I1']);

    // Stage 3 (COA)
    assert.ok(body.coa);
    assert.strictEqual(body.coa.totalInstructions, 1);
    assert.strictEqual(body.coa.totalCycles, 5);
    assert.strictEqual(body.coa.cpi, 5.0);
    assert.strictEqual(body.coa.totalStalls, 0);
  });

  it('executes full workflow for multiple independent instructions', async () => {
    const code = `
      LOAD R1, 10
      LOAD R2, 20
      LOAD R3, 30
    `;
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // FLAT
    assert.strictEqual(body.flat.instructionCount, 3);
    assert.strictEqual(body.flat.errorCount, 0);

    // DAA
    assert.strictEqual(body.daa.isIndependent, true);
    assert.strictEqual(body.daa.totalDependencies, 0);
    assert.deepStrictEqual(body.daa.topologicalSort.order, ['I1', 'I2', 'I3']);

    // COA
    assert.strictEqual(body.coa.totalInstructions, 3);
    assert.strictEqual(body.coa.totalCycles, 7);
    assert.strictEqual(body.coa.totalStalls, 0);
    assert.strictEqual(body.coa.cpi, 2.33);
  });

  it('correctly handles RAW, WAR, and WAW dependencies across all 3 modules', async () => {
    const code = `
      LOAD R1, 100       ; I1: writes R1
      ADD  R2, R1, R0    ; I2: reads R1 (RAW from I1), writes R2
      MOV  R1, R3        ; I3: reads R3, writes R1 (WAR from I2, WAW from I1)
    `;
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // FLAT check
    assert.strictEqual(body.flat.instructionCount, 3);

    // DAA check: Hazards detected
    assert.ok(body.daa.rawCount > 0, 'RAW hazard should be detected');
    assert.ok(body.daa.warCount > 0, 'WAR hazard should be detected');
    assert.ok(body.daa.wawCount > 0, 'WAW hazard should be detected');
    assert.strictEqual(body.daa.isIndependent, false);

    // COA check: Stalls inserted for RAW
    assert.ok(body.coa.totalStalls > 0);
    assert.ok(body.coa.totalCycles > 7);
  });

  it('simulates dependent chains with and without forwarding', async () => {
    const code = `
      LOAD R1, 50
      ADD  R2, R1, R1
      SUB  R3, R2, R1
    `;

    // Without forwarding (default)
    const resNoFwd = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, forwardingEnabled: false }),
    });

    assert.strictEqual(resNoFwd.status, 200);
    const bodyNoFwd = await resNoFwd.json();
    assert.strictEqual(bodyNoFwd.coa.forwardingEnabled, false);
    assert.strictEqual(bodyNoFwd.coa.totalStalls, 4);
    assert.strictEqual(bodyNoFwd.coa.totalCycles, 11);

    // With forwarding
    const resFwd = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, forwardingEnabled: true }),
    });

    assert.strictEqual(resFwd.status, 200);
    const bodyFwd = await resFwd.json();
    assert.strictEqual(bodyFwd.coa.forwardingEnabled, true);
    assert.strictEqual(bodyFwd.coa.totalStalls, 0);
    assert.strictEqual(bodyFwd.coa.totalCycles, 7);
  });

  it('halts at Stage 1 (FLAT) on invalid opcode and never runs DAA or COA', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID_OP R1, 10' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.failedStage, 'flat');
    assert.ok(body.error.includes('Stage 1 (FLAT)'));
    assert.strictEqual(body.flat.isValid, false);
    assert.strictEqual(body.flat.errorCount, 1);
    assert.strictEqual(body.daa, null);
    assert.strictEqual(body.coa, null);
  });

  it('halts at Stage 1 (FLAT) on invalid register format or range', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'LOAD R99, 10' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.failedStage, 'flat');
    assert.strictEqual(body.daa, null);
    assert.strictEqual(body.coa, null);
  });

  it('halts at Stage 1 (FLAT) on missing operands or missing commas', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ADD R1 R2 R3' }), // Missing comma
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.failedStage, 'flat');
    assert.strictEqual(body.daa, null);
    assert.strictEqual(body.coa, null);
  });

  it('rejects empty input or comment-only input properly', async () => {
    // Completely empty string
    const resEmpty = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '   ' }),
    });

    assert.strictEqual(resEmpty.status, 400);
    const bodyEmpty = await resEmpty.json();
    assert.strictEqual(bodyEmpty.success, false);
    assert.strictEqual(bodyEmpty.failedStage, 'input');
    assert.strictEqual(bodyEmpty.daa, null);
    assert.strictEqual(bodyEmpty.coa, null);

    // Comment-only input
    const resComments = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '; Just a comment line\n; Another comment' }),
    });

    assert.strictEqual(resComments.status, 400);
    const bodyComments = await resComments.json();
    assert.strictEqual(bodyComments.success, false);
    assert.strictEqual(bodyComments.failedStage, 'flat');
    assert.strictEqual(bodyComments.daa, null);
    assert.strictEqual(bodyComments.coa, null);
  });

  it('rejects invalid request body missing the code field', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.failedStage, 'input');
  });
});
