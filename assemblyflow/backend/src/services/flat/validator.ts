import {
  Token,
  LineValidationResult,
  ProgramValidationResult,
  InstructionAST,
} from './types';
import { tokenizeLine } from './tokenizer';

const MAX_REGISTER_INDEX = 15;

/**
 * Validates whether a register string is in the valid range R0 - R15.
 */
function validateRegister(token: Token): { isValid: boolean; error?: string; regIndex?: number } {
  const match = token.value.toUpperCase().match(/^R([0-9]+)$/);
  if (!match) {
    return {
      isValid: false,
      error: `Invalid register format '${token.value}'. Registers must be named R0 to R15.`,
    };
  }

  const index = parseInt(match[1], 10);
  if (index < 0 || index > MAX_REGISTER_INDEX) {
    return {
      isValid: false,
      error: `Register '${token.value}' is out of range. Allowed registers are R0 to R15.`,
    };
  }

  return { isValid: true, regIndex: index };
}

/**
 * Validates an integer token.
 */
function validateInteger(token: Token): { isValid: boolean; error?: string; value?: number } {
  if (token.type !== 'INTEGER') {
    return {
      isValid: false,
      error: `Expected integer literal, found '${token.value}' (${token.type}).`,
    };
  }

  const num = parseInt(token.value, 10);
  if (Number.isNaN(num)) {
    return {
      isValid: false,
      error: `Invalid integer format '${token.value}'.`,
    };
  }

  return { isValid: true, value: num };
}

/**
 * Validates a single source line of assembly against the educational grammar.
 */
export function validateLine(lineText: string, lineNumber: number): LineValidationResult {
  const allTokens = tokenizeLine(lineText, lineNumber);

  // Filter out comments for grammar validation
  const meaningfulTokens = allTokens.filter((t) => t.type !== 'COMMENT');

  // Case 1: Empty line
  if (lineText.trim().length === 0) {
    return {
      lineNumber,
      raw: lineText,
      isEmpty: true,
      isCommentOnly: false,
      isValid: true,
      tokens: allTokens,
    };
  }

  // Case 2: Comment-only line
  if (meaningfulTokens.length === 0) {
    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: true,
      isValid: true,
      tokens: allTokens,
    };
  }

  // Case 3: Line starts with an unknown word/opcode (e.g., MUL, JUMP)
  if (meaningfulTokens.length > 0 && meaningfulTokens[0].type === 'INVALID' && /^[a-zA-Z_]+$/.test(meaningfulTokens[0].value)) {
    const unknownOp = meaningfulTokens[0];
    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: false,
      errorMessage: `Syntax error: Unknown opcode '${unknownOp.value}' at column ${unknownOp.column}. Supported opcodes are: LOAD, MOV, ADD, SUB.`,
      tokens: allTokens,
    };
  }

  // Case 4: Line contains lexical errors (INVALID token)
  const invalidToken = meaningfulTokens.find((t) => t.type === 'INVALID');
  if (invalidToken) {
    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: false,
      errorMessage: `Lexical error: Unexpected or invalid token '${invalidToken.value}' at column ${invalidToken.column}.`,
      tokens: allTokens,
    };
  }

  // Case 4: First token MUST be an OPCODE
  const firstToken = meaningfulTokens[0];
  if (firstToken.type !== 'OPCODE') {
    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: false,
      errorMessage: `Syntax error: Line must begin with a supported opcode (LOAD, MOV, ADD, SUB), found '${firstToken.value}'.`,
      tokens: allTokens,
    };
  }

  const opcode = firstToken.value as 'LOAD' | 'MOV' | 'ADD' | 'SUB';
  const operandTokens = meaningfulTokens.slice(1);

  // --------------------------------------------------------------------------
  // Rule 1: LOAD destinationRegister, integer
  // Expected sequence: [REGISTER, COMMA, INTEGER]
  // --------------------------------------------------------------------------
  if (opcode === 'LOAD') {
    if (operandTokens.length === 0) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: LOAD instruction requires 2 operands (e.g. LOAD R1, 100), but no operands were provided.`,
        tokens: allTokens,
      };
    }

    // Check Destination Register
    const destToken = operandTokens[0];
    if (destToken.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected destination register as first operand for LOAD, found '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    const destValidation = validateRegister(destToken);
    if (!destValidation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${destValidation.error}`,
        tokens: allTokens,
      };
    }

    // Check Comma
    if (operandTokens.length < 2) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing comma ',' and integer operand after destination register '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    const commaToken = operandTokens[1];
    if (commaToken.type !== 'COMMA') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected comma ',' separating operands, found '${commaToken.value}'.`,
        tokens: allTokens,
      };
    }

    // Check Integer Literal
    if (operandTokens.length < 3) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing integer operand after comma for LOAD instruction.`,
        tokens: allTokens,
      };
    }
    const intToken = operandTokens[2];
    const intValidation = validateInteger(intToken);
    if (!intValidation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: ${intValidation.error}`,
        tokens: allTokens,
      };
    }

    // Check Extra Tokens
    if (operandTokens.length > 3) {
      const extraToken = operandTokens[3];
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Unexpected extra token '${extraToken.value}' at column ${extraToken.column}. LOAD accepts only 2 operands.`,
        tokens: allTokens,
      };
    }

    const instruction: InstructionAST = {
      opcode: 'LOAD',
      destination: destToken.value.toUpperCase(),
      operands: [intValidation.value!],
    };

    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: true,
      tokens: allTokens,
      instruction,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 2: MOV destinationRegister, sourceRegister
  // Expected sequence: [REGISTER, COMMA, REGISTER]
  // --------------------------------------------------------------------------
  if (opcode === 'MOV') {
    if (operandTokens.length === 0) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: MOV instruction requires 2 operands (e.g. MOV R1, R2), but no operands were provided.`,
        tokens: allTokens,
      };
    }

    // Destination Register
    const destToken = operandTokens[0];
    if (destToken.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected destination register as first operand for MOV, found '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    const destValidation = validateRegister(destToken);
    if (!destValidation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${destValidation.error}`,
        tokens: allTokens,
      };
    }

    // Comma
    if (operandTokens.length < 2) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing comma ',' and source register after '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    const commaToken = operandTokens[1];
    if (commaToken.type !== 'COMMA') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected comma ',' separating operands, found '${commaToken.value}'.`,
        tokens: allTokens,
      };
    }

    // Source Register
    if (operandTokens.length < 3) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing source register after comma for MOV instruction.`,
        tokens: allTokens,
      };
    }
    const srcToken = operandTokens[2];
    if (srcToken.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected source register for MOV, found '${srcToken.value}'.`,
        tokens: allTokens,
      };
    }
    const srcValidation = validateRegister(srcToken);
    if (!srcValidation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${srcValidation.error}`,
        tokens: allTokens,
      };
    }

    // Extra tokens check
    if (operandTokens.length > 3) {
      const extraToken = operandTokens[3];
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Unexpected extra token '${extraToken.value}' at column ${extraToken.column}. MOV accepts only 2 operands.`,
        tokens: allTokens,
      };
    }

    const instruction: InstructionAST = {
      opcode: 'MOV',
      destination: destToken.value.toUpperCase(),
      operands: [srcToken.value.toUpperCase()],
    };

    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: true,
      tokens: allTokens,
      instruction,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 3 & 4: ADD / SUB destinationRegister, sourceRegister1, sourceRegister2
  // Expected sequence: [REGISTER, COMMA, REGISTER, COMMA, REGISTER]
  // --------------------------------------------------------------------------
  if (opcode === 'ADD' || opcode === 'SUB') {
    if (operandTokens.length === 0) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: ${opcode} instruction requires 3 operands (e.g. ${opcode} R3, R1, R2), but no operands were provided.`,
        tokens: allTokens,
      };
    }

    // 1. Destination Register
    const destToken = operandTokens[0];
    if (destToken.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected destination register as first operand for ${opcode}, found '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    const destValidation = validateRegister(destToken);
    if (!destValidation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${destValidation.error}`,
        tokens: allTokens,
      };
    }

    // 2. First Comma
    if (operandTokens.length < 2) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing comma ',' after destination register '${destToken.value}'.`,
        tokens: allTokens,
      };
    }
    if (operandTokens[1].type !== 'COMMA') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected comma ',' after destination register, found '${operandTokens[1].value}'.`,
        tokens: allTokens,
      };
    }

    // 3. First Source Register
    if (operandTokens.length < 3) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing first source register for ${opcode} instruction.`,
        tokens: allTokens,
      };
    }
    const src1Token = operandTokens[2];
    if (src1Token.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected first source register for ${opcode}, found '${src1Token.value}'.`,
        tokens: allTokens,
      };
    }
    const src1Validation = validateRegister(src1Token);
    if (!src1Validation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${src1Validation.error}`,
        tokens: allTokens,
      };
    }

    // 4. Second Comma
    if (operandTokens.length < 4) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing second comma ',' after first source register '${src1Token.value}'.`,
        tokens: allTokens,
      };
    }
    if (operandTokens[3].type !== 'COMMA') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected second comma ',' separating source registers, found '${operandTokens[3].value}'.`,
        tokens: allTokens,
      };
    }

    // 5. Second Source Register
    if (operandTokens.length < 5) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Missing second source register for ${opcode} instruction.`,
        tokens: allTokens,
      };
    }
    const src2Token = operandTokens[4];
    if (src2Token.type !== 'REGISTER') {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Expected second source register for ${opcode}, found '${src2Token.value}'.`,
        tokens: allTokens,
      };
    }
    const src2Validation = validateRegister(src2Token);
    if (!src2Validation.isValid) {
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Semantic error: ${src2Validation.error}`,
        tokens: allTokens,
      };
    }

    // Extra tokens check
    if (operandTokens.length > 5) {
      const extraToken = operandTokens[5];
      return {
        lineNumber,
        raw: lineText,
        isEmpty: false,
        isCommentOnly: false,
        isValid: false,
        errorMessage: `Syntax error: Unexpected extra token '${extraToken.value}' at column ${extraToken.column}. ${opcode} accepts exactly 3 operands.`,
        tokens: allTokens,
      };
    }

    const instruction: InstructionAST = {
      opcode,
      destination: destToken.value.toUpperCase(),
      operands: [src1Token.value.toUpperCase(), src2Token.value.toUpperCase()],
    };

    return {
      lineNumber,
      raw: lineText,
      isEmpty: false,
      isCommentOnly: false,
      isValid: true,
      tokens: allTokens,
      instruction,
    };
  }

  // Fallback (should not be reached due to opcode guard)
  return {
    lineNumber,
    raw: lineText,
    isEmpty: false,
    isCommentOnly: false,
    isValid: false,
    errorMessage: `Unsupported instruction '${opcode}'.`,
    tokens: allTokens,
  };
}

/**
 * Validates an entire assembly program line by line.
 * Time Complexity: O(N) where N is total source code length.
 */
export function validateProgram(sourceCode: string): ProgramValidationResult {
  if (sourceCode === undefined || sourceCode === null) {
    sourceCode = '';
  }

  const lines = sourceCode.split('\n');
  const lineResults: LineValidationResult[] = lines.map((line, idx) =>
    validateLine(line, idx + 1)
  );

  let instructionCount = 0;
  let validCount = 0;
  let errorCount = 0;

  for (const res of lineResults) {
    if (!res.isEmpty && !res.isCommentOnly) {
      instructionCount++;
      if (res.isValid) {
        validCount++;
      } else {
        errorCount++;
      }
    }
  }

  return {
    isValid: errorCount === 0,
    totalLines: lines.length,
    instructionCount,
    validCount,
    errorCount,
    lines: lineResults,
  };
}
