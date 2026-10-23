export type NavSection = 'overview' | 'flat' | 'daa' | 'coa';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp?: string;
}

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  subtext: string;
  iconName: 'instructions' | 'dependency' | 'cycles' | 'performance';
}

// FLAT Token Types
export type TokenType = 'OPCODE' | 'REGISTER' | 'INTEGER' | 'COMMA' | 'COMMENT' | 'INVALID';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
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

// FLAT DFA Types
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

// DAA Dependency Analysis Types
export type DependencyType = 'RAW' | 'WAR' | 'WAW';

export interface DAANode {
  id: string;
  instructionIndex: number;
  lineNumber: number;
  raw: string;
  opcode: 'LOAD' | 'MOV' | 'ADD' | 'SUB';
  destination?: string;
  operands: (string | number)[];
  reads: string[];
  writes: string[];
}

export interface DAAEdge {
  id: string;
  from: string;
  to: string;
  fromIndex: number;
  toIndex: number;
  types: DependencyType[];
  registers: string[];
  explanation: string;
}

export interface TopologicalStep {
  step: number;
  selectedNode: string;
  availableNodes: string[];
  remainingInDegrees: Record<string, number>;
  description: string;
}

export interface TopologicalSortResult {
  order: string[];
  orderedNodes: DAANode[];
  hasCycle: boolean;
  steps: TopologicalStep[];
  cycleError?: string;
}

export interface DAAAnalysisResult {
  success: boolean;
  totalInstructions: number;
  nodes: DAANode[];
  edges: DAAEdge[];
  rawCount: number;
  warCount: number;
  wawCount: number;
  totalDependencies: number;
  isIndependent: boolean;
  topologicalSort: TopologicalSortResult;
  explanations: string[];
}

// COA Pipeline Simulation Types
export type PipelineStage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'STALL' | '';

export interface InstructionPipelineSchedule {
  id: string;
  instructionIndex: number;
  lineNumber: number;
  raw: string;
  opcode: 'LOAD' | 'MOV' | 'ADD' | 'SUB';
  destination?: string;
  operands: (string | number)[];
  reads: string[];
  writes: string[];
  timeline: Record<number, PipelineStage>;
  stallCycles: number;
  stallReasons: string[];
  fetchCycle: number;
  decodeCycle: number;
  executeCycle: number;
  memoryCycle: number;
  writeBackCycle: number;
}

export interface PipelineHazard {
  id: string;
  type: 'RAW';
  producerId: string;
  consumerId: string;
  register: string;
  stallCycles: number;
  explanation: string;
}

export interface COASimulationResult {
  success: boolean;
  totalInstructions: number;
  totalCycles: number;
  cpi: number;
  idealCycles: number;
  totalStalls: number;
  speedup: number;
  forwardingEnabled: boolean;
  schedule: InstructionPipelineSchedule[];
  hazards: PipelineHazard[];
  assumptions: string[];
  cycleHeaders: number[];
}

// Integrated Workflow Response Type (POST /api/analyze)
export interface FullAnalysisResponse {
  success: boolean;
  stage?: 'complete' | 'flat' | 'daa' | 'coa' | 'input' | 'server';
  failedStage?: 'input' | 'flat' | 'daa' | 'coa' | 'server';
  message?: string;
  error?: string;
  flat: ProgramValidationResult | null;
  daa: DAAAnalysisResult | null;
  coa: COASimulationResult | null;
}


