import { DAANode } from '../daa/types';

export type PipelineStage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'STALL' | '';

export interface PipelineCycleCell {
  cycle: number;
  stage: PipelineStage;
  isStall: boolean;
  stallReason?: string;
  sourceHazard?: string;
}

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

export interface COASimulationOptions {
  forwardingEnabled?: boolean;
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
