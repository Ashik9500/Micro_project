import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenizeProgram, tokenizeLine } from '../services/flat/tokenizer';
import { validateLine, validateProgram } from '../services/flat/validator';
import { simulateRegisterDFA } from '../services/flat/dfa';

describe('FLAT Module — Tokenizer Tests', () => {
  it('correctly tokenizes a valid ADD instruction with registers and commas', () => {
    const tokens = tokenizeLine('ADD R2, R1, R3', 1);
    // Tokens: ADD, R2, COMMA, R1, COMMA, R3
    assert.strictEqual(tokens.length, 6);
    assert.strictEqual(tokens[0].type, 'OPCODE');
    assert.strictEqual(tokens[0].value, 'ADD');
    assert.strictEqual(tokens[1].type, 'REGISTER');
    assert.strictEqual(tokens[1].value, 'R2');
    assert.strictEqual(tokens[2].type, 'COMMA');
    assert.strictEqual(tokens[3].type, 'REGISTER');
    assert.strictEqual(tokens[3].value, 'R1');
    assert.strictEqual(tokens[4].type, 'COMMA');
    assert.strictEqual(tokens[5].type, 'REGISTER');
    assert.strictEqual(tokens[5].value, 'R3');
  });

  it('correctly tokenizes LOAD with integer literal (including signed integers)', () => {
    const tokens = tokenizeLine('LOAD R1, -42', 1);
    // Tokens: LOAD, R1, COMMA, -42
    assert.strictEqual(tokens.length, 4);
    assert.strictEqual(tokens[0].type, 'OPCODE');
    assert.strictEqual(tokens[1].type, 'REGISTER');
    assert.strictEqual(tokens[2].type, 'COMMA');
    assert.strictEqual(tokens[3].type, 'INTEGER');
    assert.strictEqual(tokens[3].value, '-42');
  });

  it('correctly tags trailing comments', () => {
    const tokens = tokenizeLine('MOV R1, R2 ; Copy value', 1);
    // Tokens: MOV, R1, COMMA, R2, COMMENT
    assert.strictEqual(tokens.length, 5);
    assert.strictEqual(tokens[4].type, 'COMMENT');
    assert.strictEqual(tokens[4].value, '; Copy value');
  });

  it('flags unexpected characters as INVALID tokens', () => {
    const tokens = tokenizeLine('ADD R1, $R2, @R3', 1);
    const invalidTokens = tokens.filter((t) => t.type === 'INVALID');
    assert.ok(invalidTokens.length > 0);
  });
});

describe('FLAT Module — Grammar Validator Tests', () => {
  it('accepts valid LOAD, MOV, ADD, and SUB instructions', () => {
    const sample = `
      LOAD R0, 100
      LOAD R1, -50
      LOAD R2, +0
      MOV R3, R1
      ADD R4, R2, R3
      SUB R5, R4, R1
    `;
    const result = validateProgram(sample);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errorCount, 0);
    assert.strictEqual(result.validCount, 6);
  });

  it('accepts case-insensitive opcodes and registers', () => {
    const sample = `
      load r1, 10
      mov r2, r1
      add r3, r2, r1
      sub r4, r3, r2
    `;
    const result = validateProgram(sample);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.validCount, 4);
  });

  it('handles empty input and blank lines without crashing', () => {
    const result1 = validateProgram('');
    assert.strictEqual(result1.isValid, true);
    assert.strictEqual(result1.instructionCount, 0);

    const result2 = validateProgram('   \n\n\t\n ; only a comment\n');
    assert.strictEqual(result2.isValid, true);
    assert.strictEqual(result2.instructionCount, 0);
  });

  it('rejects unknown opcodes', () => {
    const lineRes = validateLine('MUL R1, R2, R3', 1);
    assert.strictEqual(lineRes.isValid, false);
    assert.match(lineRes.errorMessage || '', /unknown opcode/i);
  });

  it('rejects missing commas', () => {
    const lineRes1 = validateLine('LOAD R1 100', 1);
    assert.strictEqual(lineRes1.isValid, false);
    assert.match(lineRes1.errorMessage || '', /comma/i);

    const lineRes2 = validateLine('ADD R1, R2 R3', 1);
    assert.strictEqual(lineRes2.isValid, false);
    assert.match(lineRes2.errorMessage || '', /comma/i);
  });

  it('rejects incorrect operand counts', () => {
    const lineRes1 = validateLine('LOAD R1', 1);
    assert.strictEqual(lineRes1.isValid, false);

    const lineRes2 = validateLine('MOV R1', 1);
    assert.strictEqual(lineRes2.isValid, false);

    const lineRes3 = validateLine('ADD R1, R2', 1);
    assert.strictEqual(lineRes3.isValid, false);

    const lineRes4 = validateLine('ADD R1, R2, R3, R4', 1);
    assert.strictEqual(lineRes4.isValid, false);
    assert.match(lineRes4.errorMessage || '', /extra token/i);
  });

  it('rejects invalid register names and formats', () => {
    const lineRes1 = validateLine('MOV RX, R1', 1);
    assert.strictEqual(lineRes1.isValid, false);

    const lineRes2 = validateLine('LOAD R_1, 10', 1);
    assert.strictEqual(lineRes2.isValid, false);
  });

  it('rejects registers outside allowed range R0–R15', () => {
    const lineRes1 = validateLine('LOAD R16, 50', 1);
    assert.strictEqual(lineRes1.isValid, false);
    assert.match(lineRes1.errorMessage || '', /out of range/i);

    const lineRes2 = validateLine('MOV R1, R99', 1);
    assert.strictEqual(lineRes2.isValid, false);
    assert.match(lineRes2.errorMessage || '', /out of range/i);
  });

  it('rejects invalid integer literals in LOAD', () => {
    const lineRes1 = validateLine('LOAD R1, 100abc', 1);
    assert.strictEqual(lineRes1.isValid, false);

    const lineRes2 = validateLine('LOAD R1, R2', 1);
    assert.strictEqual(lineRes2.isValid, false);
    assert.match(lineRes2.errorMessage || '', /expected integer literal/i);
  });
});

describe('FLAT Module — Register Token DFA Tests', () => {
  it('accepts valid single-digit registers R0 through R9 (case-insensitive)', () => {
    const validRegisters = ['R0', 'r0', 'R1', 'r1', 'R5', 'R7', 'R9'];
    for (const reg of validRegisters) {
      const trace = simulateRegisterDFA(reg);
      assert.strictEqual(trace.isAccepted, true, `Expected DFA to accept '${reg}'`);
      assert.notStrictEqual(trace.finalState, 'q_trap');
    }
  });

  it('accepts valid two-digit registers R10 through R15', () => {
    const validRegisters = ['R10', 'r10', 'R11', 'R12', 'R13', 'R14', 'R15', 'r15'];
    for (const reg of validRegisters) {
      const trace = simulateRegisterDFA(reg);
      assert.strictEqual(trace.isAccepted, true, `Expected DFA to accept '${reg}'`);
      assert.strictEqual(trace.finalState, 'q5');
    }
  });

  it('rejects out-of-range registers (e.g. R16, R20, R99)', () => {
    const outOfRange = ['R16', 'R17', 'R19', 'R20', 'R25', 'R99'];
    for (const reg of outOfRange) {
      const trace = simulateRegisterDFA(reg);
      assert.strictEqual(trace.isAccepted, false, `Expected DFA to reject '${reg}'`);
      assert.strictEqual(trace.finalState, 'q_trap');
    }
  });

  it('rejects invalid prefix or non-registers (e.g. X1, 12, R, R_1, R1A)', () => {
    const invalidInputs = ['', 'X1', '12', 'R', 'r', 'R_1', 'R1A', 'RA', 'R01'];
    for (const input of invalidInputs) {
      const trace = simulateRegisterDFA(input);
      assert.strictEqual(trace.isAccepted, false, `Expected DFA to reject '${input}'`);
    }
  });
});
