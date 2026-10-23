export type DependencyType = 'RAW' | 'WAR' | 'WAW';

export interface DAANode {
  id: string; // e.g., 'I1', 'I2'
  instructionIndex: number; // 1-indexed sequential instruction number
  lineNumber: number; // Original line number in source code
  raw: string; // Raw instruction text
  opcode: 'LOAD' | 'MOV' | 'ADD' | 'SUB';
  destination?: string;
  operands: (string | number)[];
  reads: string[]; // Registers read by this instruction
  writes: string[]; // Registers written by this instruction
}

export interface DAAEdge {
  id: string; // e.g., 'I1->I2'
  from: string; // Source instruction ID (must execute first)
  to: string; // Target instruction ID (must execute after)
  fromIndex: number;
  toIndex: number;
  types: DependencyType[]; // Hazard types: RAW, WAR, and/or WAW
  registers: string[]; // Registers involved
  explanation: string;
}

export interface TopologicalStep {
  step: number;
  selectedNode: string;
  availableNodes: string[]; // Nodes with in-degree 0 at this step
  remainingInDegrees: Record<string, number>;
  description: string;
}

export interface TopologicalSortResult {
  order: string[]; // IDs in execution order, e.g. ['I1', 'I2', 'I3']
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
