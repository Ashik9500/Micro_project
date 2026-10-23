import { DAANode } from '../daa/types';
import {
  COASimulationOptions,
  COASimulationResult,
  InstructionPipelineSchedule,
  PipelineHazard,
  PipelineStage,
} from './types';

/**
 * Simulates a classic 5-stage in-order RISC pipeline (IF, ID, EX, MEM, WB).
 *
 * Architectural Assumptions:
 * 1. 5-Stage Architecture: IF (Fetch), ID (Decode/RegRead), EX (Execute), MEM (Memory), WB (WriteBack).
 * 2. In-Order, Single-Issue: One instruction enters IF per cycle; instructions cannot bypass preceding instructions.
 * 3. Stage Latency: Exactly 1 clock cycle per pipeline stage.
 * 4. Register File Timing: Split-phase operation (writes occur in the first half of the cycle, reads in the second half).
 * 5. Forwarding Model:
 *    - Forwarding Disabled (Default): Consumer must wait in ID stage until producer writes back in WB.
 *    - Forwarding Enabled: ALU and immediate results are bypassed from EX/MEM stages to EX input, eliminating RAW stalls for ALU ops.
 * 6. Pipeline Interlock: Stalling in ID holds back following instructions in IF and injects NOP bubbles into EX.
 */
export function simulatePipeline(
  nodes: DAANode[],
  options: COASimulationOptions = {}
): COASimulationResult {
  const forwardingEnabled = options.forwardingEnabled ?? false;
  const n = nodes.length;

  if (n === 0) {
    throw new Error('Cannot simulate pipeline for an empty instruction list.');
  }

  const schedule: InstructionPipelineSchedule[] = [];
  const hazards: PipelineHazard[] = [];
  let totalStalls = 0;

  // Track the latest writer instruction index for each register
  // Key: register name (uppercase, e.g. "R1"), Value: index in nodes array
  const lastWriterMap = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    const timeline: Record<number, PipelineStage> = {};
    const stallReasons: string[] = [];

    // 1. Determine Fetch Cycle (cIF)
    // First instruction enters IF at cycle 1.
    // Subsequent instruction enters IF at the same cycle the preceding instruction successfully completes ID.
    const fetchCycle = i === 0 ? 1 : schedule[i - 1].decodeCycle;
    timeline[fetchCycle] = 'IF';

    // 2. Earliest possible cycle to enter ID
    const earliestIdCycle = fetchCycle + 1;

    // 3. Check RAW Data Hazards against preceding instructions
    let requiredIdCycle = earliestIdCycle;

    for (const readReg of node.reads) {
      const reg = readReg.toUpperCase();
      if (lastWriterMap.has(reg)) {
        const producerIdx = lastWriterMap.get(reg)!;
        const producer = schedule[producerIdx];

        // Determine cycle when register value becomes available
        let operandAvailableCycle: number;

        if (forwardingEnabled) {
          // With forwarding: value is computed in EX and available at the start of EX
          // Producer completes EX at producer.executeCycle
          // So consumer can execute EX at producer.executeCycle + 1
          // Which means consumer can complete ID at producer.executeCycle
          operandAvailableCycle = producer.executeCycle;
        } else {
          // Without forwarding (default): value is written in WB
          // Split-phase: write in first half of cycle, read in second half of cycle
          // Consumer can read in ID at producer.writeBackCycle
          operandAvailableCycle = producer.writeBackCycle;
        }

        if (operandAvailableCycle > earliestIdCycle) {
          if (operandAvailableCycle > requiredIdCycle) {
            requiredIdCycle = operandAvailableCycle;
          }

          const stallsNeeded = operandAvailableCycle - earliestIdCycle;
          const explanation = forwardingEnabled
            ? `RAW hazard on ${reg} produced by ${producer.id} (${producer.raw}): Forwarded from EX/MEM with 0 extra stall.`
            : `RAW hazard on ${reg} produced by ${producer.id} (${producer.raw}): Requires ${stallsNeeded} stall cycle(s) until WB at CC${producer.writeBackCycle}.`;

          stallReasons.push(explanation);

          // Register hazard record if not already recorded for this pair
          const hazardId = `HAZARD-${producer.id}->${node.id}-${reg}`;
          if (!hazards.some((h) => h.id === hazardId)) {
            hazards.push({
              id: hazardId,
              type: 'RAW',
              producerId: producer.id,
              consumerId: node.id,
              register: reg,
              stallCycles: forwardingEnabled ? 0 : stallsNeeded,
              explanation,
            });
          }
        }
      }
    }

    // 4. Fill Stall Cycles in ID stage
    const actualIdCycle = requiredIdCycle;
    const instStalls = actualIdCycle - earliestIdCycle;
    totalStalls += instStalls;

    for (let c = earliestIdCycle; c < actualIdCycle; c++) {
      timeline[c] = 'STALL';
    }

    // 5. Place ID and subsequent pipeline stages
    timeline[actualIdCycle] = 'ID';

    const executeCycle = actualIdCycle + 1;
    timeline[executeCycle] = 'EX';

    const memoryCycle = executeCycle + 1;
    timeline[memoryCycle] = 'MEM';

    const writeBackCycle = memoryCycle + 1;
    timeline[writeBackCycle] = 'WB';

    // 6. Record schedule entry
    schedule.push({
      id: node.id,
      instructionIndex: node.instructionIndex,
      lineNumber: node.lineNumber,
      raw: node.raw,
      opcode: node.opcode,
      destination: node.destination,
      operands: node.operands,
      reads: node.reads,
      writes: node.writes,
      timeline,
      stallCycles: instStalls,
      stallReasons,
      fetchCycle,
      decodeCycle: actualIdCycle,
      executeCycle,
      memoryCycle,
      writeBackCycle,
    });

    // 7. Update last writer for registers written by this instruction
    for (const writeReg of node.writes) {
      lastWriterMap.set(writeReg.toUpperCase(), i);
    }
  }

  // Calculate global summary metrics
  const totalInstructions = n;
  const lastInstruction = schedule[schedule.length - 1];
  const totalCycles = lastInstruction.writeBackCycle;

  // Ideal cycles for N instructions in 5-stage pipeline with no stalls: N + 4
  const idealCycles = totalInstructions + 4;

  // CPI = Total Clock Cycles / Total Instructions
  const cpi = Number((totalCycles / totalInstructions).toFixed(2));

  // Non-pipelined reference execution = N * 5 cycles
  const nonPipelinedCycles = totalInstructions * 5;
  const speedup = Number((nonPipelinedCycles / totalCycles).toFixed(2));

  // Cycle headers: [1, 2, ..., totalCycles]
  const cycleHeaders: number[] = [];
  for (let c = 1; c <= totalCycles; c++) {
    cycleHeaders.push(c);
  }

  const assumptions = [
    '5-Stage RISC Architecture: IF (Instruction Fetch), ID (Decode & RegRead), EX (Execute), MEM (Memory), WB (Write Back).',
    'Single-Issue In-Order Execution: At most 1 instruction enters IF per clock cycle; program sequence is preserved.',
    'Stage Latency: Exactly 1 clock cycle per stage under non-stalled conditions.',
    'Split-Phase Register File: Register writes occur during the first half of the cycle (WB), and reads occur during the second half (ID).',
    forwardingEnabled
      ? 'Data Forwarding Enabled: Direct ALU-to-ALU and MEM-to-ALU bypass paths resolve RAW hazards at the EX stage without stalls for ALU/immediate instructions.'
      : 'Data Forwarding Disabled (Default): Data must be committed to the register file in WB before ID can read, inserting stall bubbles.',
    'Conservative Interlock: When an instruction stalls in ID, dependent subsequent instructions are held in IF, preventing stage overlap.',
  ];

  return {
    success: true,
    totalInstructions,
    totalCycles,
    cpi,
    idealCycles,
    totalStalls,
    speedup,
    forwardingEnabled,
    schedule,
    hazards,
    assumptions,
    cycleHeaders,
  };
}
