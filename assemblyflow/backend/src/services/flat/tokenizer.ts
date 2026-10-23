import { Token, TokenType, LineTokens } from './types';

// Supported opcodes (case-insensitive)
const SUPPORTED_OPCODES = new Set(['LOAD', 'MOV', 'ADD', 'SUB']);

/**
 * Tokenizes a single line of assembly code.
 * Scans left-to-right maintaining accurate 1-indexed column numbers.
 * Time Complexity: O(L) where L is the length of the line.
 */
export function tokenizeLine(lineText: string, lineNumber: number): Token[] {
  const tokens: Token[] = [];
  let col = 0; // 0-indexed cursor for the string

  while (col < lineText.length) {
    const char = lineText[col];

    // 1. Skip Whitespace (spaces and tabs)
    if (char === ' ' || char === '\t' || char === '\r') {
      col++;
      continue;
    }

    const startColumn = col + 1; // 1-indexed column for reporting

    // 2. Comments: semicolon begins a comment running to end-of-line
    if (char === ';') {
      const commentValue = lineText.slice(col);
      tokens.push({
        type: 'COMMENT',
        value: commentValue,
        line: lineNumber,
        column: startColumn,
      });
      break; // rest of the line is comment
    }

    // 3. Comma
    if (char === ',') {
      tokens.push({
        type: 'COMMA',
        value: ',',
        line: lineNumber,
        column: startColumn,
      });
      col++;
      continue;
    }

    // 4. Numbers (signed or unsigned integers): e.g. +10, -5, 42
    // Look ahead to check if '+' or '-' is followed by a digit
    if (
      char.match(/[0-9]/) ||
      ((char === '+' || char === '-') &&
        col + 1 < lineText.length &&
        lineText[col + 1].match(/[0-9]/))
    ) {
      let end = col + 1;
      while (end < lineText.length && lineText[end].match(/[0-9]/)) {
        end++;
      }

      // Check if immediately followed by alphabetical characters (e.g., 100abc -> malformed)
      if (end < lineText.length && lineText[end].match(/[a-zA-Z_]/)) {
        while (end < lineText.length && !lineText[end].match(/[\s,;]/)) {
          end++;
        }
        tokens.push({
          type: 'INVALID',
          value: lineText.slice(col, end),
          line: lineNumber,
          column: startColumn,
        });
        col = end;
        continue;
      }

      tokens.push({
        type: 'INTEGER',
        value: lineText.slice(col, end),
        line: lineNumber,
        column: startColumn,
      });
      col = end;
      continue;
    }

    // 5. Identifiers: Opcodes, Registers, or alphanumeric strings
    if (char.match(/[a-zA-Z_]/)) {
      let end = col + 1;
      while (end < lineText.length && lineText[end].match(/[a-zA-Z0-9_]/)) {
        end++;
      }

      const word = lineText.slice(col, end);
      const upperWord = word.toUpperCase();

      // Check if it's an opcode
      if (SUPPORTED_OPCODES.has(upperWord)) {
        tokens.push({
          type: 'OPCODE',
          value: upperWord,
          line: lineNumber,
          column: startColumn,
        });
      }
      // Check if it matches register token pattern: 'R' or 'r' followed by digits
      else if (/^[Rr][0-9]+$/.test(word)) {
        tokens.push({
          type: 'REGISTER',
          value: upperWord, // Normalized to uppercase for consistency
          line: lineNumber,
          column: startColumn,
        });
      }
      // Otherwise unrecognized word token
      else {
        tokens.push({
          type: 'INVALID',
          value: word,
          line: lineNumber,
          column: startColumn,
        });
      }

      col = end;
      continue;
    }

    // 6. Any other unexpected character (e.g. $, @, #, etc.)
    tokens.push({
      type: 'INVALID',
      value: char,
      line: lineNumber,
      column: startColumn,
    });
    col++;
  }

  return tokens;
}

/**
 * Tokenizes entire assembly program string into line-by-line structured tokens.
 * Time Complexity: O(N) where N is total character count of the code.
 */
export function tokenizeProgram(sourceCode: string): LineTokens[] {
  const lines = sourceCode.split('\n');
  return lines.map((lineText, idx) => ({
    lineNumber: idx + 1,
    raw: lineText,
    tokens: tokenizeLine(lineText, idx + 1),
  }));
}
