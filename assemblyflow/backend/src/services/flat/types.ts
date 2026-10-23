// Token classification for the educational assembly language
export type TokenType = 'OPCODE' | 'REGISTER' | 'INTEGER' | 'COMMA' | 'COMMENT' | 'INVALID';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface LineTokens {
  lineNumber: number;
  raw: string;
  tokens: Token[];
}

export interface InstructionAST {
  opcode: 'LOAD' | 'MOV' | 'ADD' | 'SUB';
  destination: string;
  operands: (string | number)[];
}

export interface LineValidationResult {
  lineNumber: number;
  raw: string;
  isEmpty: boolean;
  isCommentOnly: boolean;
  isValid: boolean;
  errorMessage?: string;
  tokens: Token[];
  instruction?: InstructionAST;
}

export interface ProgramValidationResult {
  isValid: boolean;
  totalLines: number;
  instructionCount: number;
  validCount: number;
  errorCount: number;
  lines: LineValidationResult[];
}

// DFA Formal Definition & Simulation types
export interface DFATransition {
  fromState: string;
  symbol: string;
  toState: string;
  description?: string;
}

export interface DFAStep {
  step: number;
  inputChar: string;
  fromState: string;
  toState: string;
  isAccepting: boolean;
  note: string;
}

export interface DFATraceResult {
  input: string;
  isAccepted: boolean;
  finalState: string;
  path: string[];
  steps: DFAStep[];
  explanation: string;
}

export interface DFADefinition {
  name: string;
  languageDescription: string;
  states: string[];
  alphabet: string[];
  startState: string;
  acceptingStates: string[];
  transitions: DFATransition[];
}
