# Micro Project Report: Computer Organization & Architecture (COA)

---

## Academic Project Information

| Field | Detail |
| :--- | :--- |
| **Project Title** | **AssemblyFlow: Automated Assembly Code Normalizer & Pipelined Execution Analyzer** |
| **Subject** | **Computer Organization and Architecture (COA)** |
| **Student Name** | **Ashik Ameen** |
| **GitHub Repository** | [https://github.com/Ashik9500/Micro_project.git](https://github.com/Ashik9500/Micro_project.git) |
| **Deployed Web Application** | [https://micro-project-a338.onrender.com/](https://micro-project-a338.onrender.com/) |
| **Technology Stack** | TypeScript, Node.js, Express, React 19, Vite |
| **Submission Date** | October 2026 |

---

## 1. Executive Summary & Abstract

Pipelining is a fundamental architectural technique in modern microprocessors that yields high instruction throughput by overlapping the execution phases of consecutive instructions. In **AssemblyFlow**, the **Computer Organization and Architecture (COA)** module acts as **Stage 3 (The Microarchitecture Simulator)**.

Operating on normalized instructions that have been syntactically verified by the FLAT module and dependency-analyzed by the DAA module, the COA engine implements a cycle-accurate discrete simulation of the classic **5-stage in-order RISC pipeline**:
$$\text{IF} \rightarrow \text{ID} \rightarrow \text{EX} \rightarrow \text{MEM} \rightarrow \text{WB}$$

The simulator models:
1. **Split-phase register file operations** (WB writes in the first half of the cycle, ID reads in the second half).
2. **Read-After-Write (RAW) data hazard detection** and automatic stall bubble injection (NOPs) when hardware interlocks stall execution in the ID stage.
3. An interactive toggle for **Data Forwarding (ALU-to-ALU bypassing)**, demonstrating how bypass multiplexers resolve data hazards without stall penalties.
4. Quantitative computation of microarchitectural performance figures: **Cycles Per Instruction (CPI)**, execution speedup over non-pipelined hardware, and ideal vs. stalled clock cycles.

---

## 2. Theoretical Foundations in Computer Organization & Architecture

### 2.1 The Classic 5-Stage RISC Pipeline
In a standard Reduced Instruction Set Computer (RISC) architecture (e.g., MIPS / DLX / RISC-V), each instruction progresses through five discrete stages, each separated by pipeline registers:

```mermaid
flowchart LR
    IF[IF: Instruction Fetch] --> ID[ID: Instruction Decode / Reg Read]
    ID --> EX[EX: Execute / ALU Address]
    EX --> MEM[MEM: Data Memory Access]
    MEM --> WB[WB: Write-Back to Register File]
```

1. **IF (Instruction Fetch)**:
   - Fetches the instruction pointed to by the Program Counter (PC) into the IF/ID pipeline register.
   - PC is incremented: $\text{PC} \leftarrow \text{PC} + 4$.
2. **ID (Instruction Decode & Register Read)**:
   - Decodes opcode bits and reads source registers ($Rs_1, Rs_2$) from the dual-port Register File.
   - Evaluates potential data hazards against preceding instructions currently in EX, MEM, or WB stages.
3. **EX (Execution / Address Calculation)**:
   - The Arithmetic Logic Unit (ALU) performs arithmetic/logical operations (`ADD`, `SUB`) or computes effective memory addresses.
4. **MEM (Memory Access)**:
   - Accesses data cache/memory. In AssemblyFlow's register-to-register instruction set, immediate values and arithmetic results pass through to the MEM/WB register.
5. **WB (Write-Back)**:
   - Writes computed results or loaded values back into the destination register ($Rd$) in the Register File.

### 2.2 Split-Phase Register File Timing
A critical microarchitectural design principle is the **split-phase (dual-edge) clocking** of the Register File:
- **First Half of Cycle ($0 \rightarrow \frac{T}{2}$)**: The WB stage writes new data to destination registers on the falling or mid-cycle clock edge.
- **Second Half of Cycle ($\frac{T}{2} \rightarrow T$)**: The ID stage reads operands from the Register File.

**Impact on Hazard Resolution**:
If Instruction $I_1$ is in WB during clock cycle $C$, and Instruction $I_2$ is in ID during the same cycle $C$, $I_2$ successfully reads the updated value of the register written by $I_1$ in cycle $C$ without needing an extra stall cycle.

### 2.3 Pipeline Data Hazards & Resolution Mechanisms
A **Data Hazard** arises when an instruction depends on the result of a previous instruction that has not yet completed its write-back.

#### 1. Read-After-Write (RAW) Hazard (True Data Dependency)
Occurs when Instruction $I_2$ reads a register written by $I_1$, while $I_1$ has not yet written back to the register file.
- **Condition**: $W(I_1) \cap R(I_2) \neq \emptyset$ with $I_1$ preceding $I_2$.

#### 2. Resolution Strategy A: Pipeline Stall Insertion (Bubbles)
In baseline architectures without forwarding:
- The hardware interlock in the ID stage holds the consumer instruction in ID until the producer completes the WB stage.
- While the consumer is stalled in ID:
  - The PC and IF/ID register are frozen (holding the subsequent instruction in IF).
  - A **NOP (bubble)** is injected into the ID/EX register, ensuring downstream stages (EX, MEM, WB) execute inert operations.
- **Penalty**: For back-to-back dependent ALU instructions without forwarding, **2 stall cycles** are required:
  - Cycle 1: $I_1$ in IF
  - Cycle 2: $I_1$ in ID, $I_2$ in IF
  - Cycle 3: $I_1$ in EX, $I_2$ in ID (STALL 1: $I_1$ not in WB)
  - Cycle 4: $I_1$ in MEM, $I_2$ in ID (STALL 2: $I_1$ not in WB)
  - Cycle 5: $I_1$ in WB (writes first half), $I_2$ in ID (reads second half, proceeds!)
  - Cycle 6: $I_2$ in EX

#### 3. Resolution Strategy B: Hardware Data Forwarding (Bypassing)
Modern architectures incorporate forwarding multiplexers in front of the ALU inputs:
- The result computed by $I_1$ at the end of the EX stage is available in the EX/MEM pipeline register at cycle 4.
- Rather than waiting for $I_1$ to reach WB at cycle 5, the bypass bus routes the result directly from the EX/MEM register to the ALU input in cycle 4.
- **Result**: **0 stall cycles** are required for dependent ALU-to-ALU operations!

---

## 3. Mathematical Performance Metrics in COA

### 3.1 Non-Pipelined vs. Ideal Pipelined Execution
For an assembly program of $N$ instructions on a $k$-stage pipeline ($k = 5$):

1. **Non-Pipelined Execution Cycles**:
   $$C_{\text{non-pipelined}} = N \times k = 5N$$

2. **Ideal Pipelined Execution Cycles (Zero Hazards)**:
   The first instruction requires $k$ cycles to fill the pipeline; each subsequent instruction completes in 1 additional cycle:
   $$C_{\text{ideal}} = k + (N - 1) = N + 4$$

3. **Actual Pipelined Execution Cycles (With Stalls)**:
   $$C_{\text{actual}} = N + 4 + \sum_{i=1}^{N} \text{StallCycles}_i$$

### 3.2 Cycles Per Instruction (CPI)
CPI measures the average number of clock cycles required to execute an instruction:
$$\text{CPI} = \frac{C_{\text{actual}}}{N}$$
- In an ideal 5-stage pipeline as $N \rightarrow \infty$, $\text{CPI} \rightarrow 1.0$.
- In the presence of RAW hazard stalls, $\text{CPI} > 1.0$.

### 3.3 Pipeline Speedup ($S$)
Speedup represents the performance improvement of pipelined over non-pipelined execution:
$$S = \frac{\text{Execution Time}_{\text{non-pipelined}}}{\text{Execution Time}_{\text{pipelined}}} = \frac{C_{\text{non-pipelined}}}{C_{\text{actual}}} = \frac{5N}{C_{\text{actual}}}$$
- Under ideal conditions without stalls ($N \gg k$):
  $$S_{\text{max}} = k = 5.0\times$$

---

## 4. Implementation in AssemblyFlow (`pipelineSimulator.ts`)

The simulation engine is implemented in `assemblyflow/backend/src/services/coa/pipelineSimulator.ts`:

### 4.1 Hazard Detection & Stall Insertion Logic

```typescript
// Tracking latest producer instruction for each register
const lastWriterMap = new Map<string, number>();

for (let i = 0; i < n; i++) {
  const node = nodes[i];
  const fetchCycle = i === 0 ? 1 : schedule[i - 1].decodeCycle;
  const earliestIdCycle = fetchCycle + 1;
  let requiredIdCycle = earliestIdCycle;

  // Check RAW hazards for every read register
  for (const readReg of node.reads) {
    const reg = readReg.toUpperCase();
    if (lastWriterMap.has(reg)) {
      const producerIdx = lastWriterMap.get(reg)!;
      const producer = schedule[producerIdx];

      let operandAvailableCycle: number;
      if (forwardingEnabled) {
        // Forwarding: available at the end of producer's EX stage
        operandAvailableCycle = producer.executeCycle;
      } else {
        // No forwarding: available when written back in producer's WB stage
        operandAvailableCycle = producer.writeBackCycle;
      }

      if (operandAvailableCycle > requiredIdCycle) {
        requiredIdCycle = operandAvailableCycle;
      }
    }
  }

  // Insert STALL bubbles
  const instStalls = requiredIdCycle - earliestIdCycle;
  for (let c = earliestIdCycle; c < requiredIdCycle; c++) {
    timeline[c] = 'STALL';
  }

  // Place non-stalled stages
  timeline[requiredIdCycle] = 'ID';
  timeline[requiredIdCycle + 1] = 'EX';
  timeline[requiredIdCycle + 2] = 'MEM';
  timeline[requiredIdCycle + 3] = 'WB';
}
```

---

## 5. Experimental Test Cases & Verification

The pipeline simulator has been verified through automated regression suites (`coa.test.ts` and `step7_comprehensive.test.ts`).

### Test Case 1: Independent Instruction Stream (Zero Hazards)
- **Assembly Program**:
  ```assembly
  LOAD R1, 10
  MOV  R2, R3
  LOAD R4, 20
  ```
- **Timeline Matrix**:

| Instruction | CC1 | CC2 | CC3 | CC4 | CC5 | CC6 | CC7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **I1: LOAD R1, 10** | **IF** | **ID** | **EX** | **MEM** | **WB** | | |
| **I2: MOV R2, R3**  | | **IF** | **ID** | **EX** | **MEM** | **WB** | |
| **I3: LOAD R4, 20**  | | | **IF** | **ID** | **EX** | **MEM** | **WB** |

- **Quantitative Results**:
  - Total Instructions ($N$): 3
  - Total Cycles: 7 ($3 + 4 = 7$)
  - Total Stalls: 0
  - CPI: $\frac{7}{3} = 2.33$
  - Speedup: $\frac{3 \times 5}{7} = \frac{15}{7} = 2.14\times$

---

### Test Case 2: Dependent Instruction Chain Without Forwarding
- **Assembly Program**:
  ```assembly
  LOAD R1, 10
  ADD  R2, R1, R3
  SUB  R4, R2, R5
  ```
  *(Hazard: I2 reads R1 written by I1; I3 reads R2 written by I2)*.

- **Timeline Matrix (Forwarding Disabled)**:

| Inst | CC1 | CC2 | CC3 | CC4 | CC5 | CC6 | CC7 | CC8 | CC9 | CC10 | CC11 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **I1: LOAD R1, 10** | **IF** | **ID** | **EX** | **MEM** | **WB** | | | | | | |
| **I2: ADD R2, R1, R3**| | **IF** | **STALL** | **STALL** | **ID** | **EX** | **MEM** | **WB** | | | |
| **I3: SUB R4, R2, R5**| | | | | **IF** | **STALL** | **STALL** | **ID** | **EX** | **MEM** | **WB** |

- **Quantitative Results**:
  - Total Cycles: 11 ($3 + 4 + 4 \text{ stalls} = 11$)
  - Total Stalls: 4 stall bubbles
  - CPI: $\frac{11}{3} = 3.67$
  - Speedup: $\frac{15}{11} = 1.36\times$

---

### Test Case 3: Dependent Instruction Chain With Forwarding Enabled
- **Assembly Program**: Same dependent chain as Test Case 2.
- **Forwarding Enabled (ALU-to-ALU bypass)**:

| Inst | CC1 | CC2 | CC3 | CC4 | CC5 | CC6 | CC7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **I1: LOAD R1, 10** | **IF** | **ID** | **EX** | **MEM** | **WB** | | |
| **I2: ADD R2, R1, R3**| | **IF** | **ID** *(Bypass)* | **EX** | **MEM** | **WB** | |
| **I3: SUB R4, R2, R5**| | | **IF** | **ID** *(Bypass)* | **EX** | **MEM** | **WB** |

- **Quantitative Comparison**:

| Metric | Forwarding Disabled | Forwarding Enabled | Improvement |
| :--- | :---: | :---: | :---: |
| **Total Clock Cycles** | 11 CC | 7 CC | **-36.4% cycles** |
| **Total Stall Bubbles** | 4 Stalls | 0 Stalls | **100% bubbles eliminated** |
| **CPI** | 3.67 | 2.33 | **+36.5% instruction efficiency** |
| **Speedup vs. Non-Pipelined**| 1.36x | 2.14x | **+57.4% throughput gain** |

---

## 6. Frontend Interactive Visualizations

The React frontend (`CoaModuleView.tsx`) delivers an interactive simulator dashboard:
1. **Interactive Cycle Timing Grid**: Renders a complete 2D matrix displaying instructions on the vertical axis and clock cycles ($1 \dots C_{\text{total}}$) on the horizontal axis with color-coded stage badges:
   - `IF`: Lavender
   - `ID`: Cyan
   - `EX`: Emerald Green
   - `MEM`: Amber
   - `WB`: Blue
   - `STALL`: Coral / Salmon with bubble icon
2. **Real-Time Data Forwarding Toggle**: Allows instantaneous switching between forwarding disabled and enabled, dynamically updating all metric cards and timing cells without page reload.
3. **Hazard Diagnostic Cards**: Detail every RAW hazard, naming the producing instruction, consumer instruction, dependent register, and stall cycles injected.

---

## 7. Asymptotic Complexity & Simulation Performance

| Component | Time Complexity | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- |
| **Schedule Computation** | $\mathcal{O}(N \times R)$ | $\mathcal{O}(N)$ | $N$ instructions, $R \le 2$ read registers per instruction |
| **Timeline Generation** | $\mathcal{O}(N \times C_{\text{total}})$ | $\mathcal{O}(N \times C_{\text{total}})$ | Discrete cycle placement for matrix rendering |
| **Hazard Registration** | $\mathcal{O}(H)$ | $\mathcal{O}(H)$ | $H \le N$ hazard records logged |
| **Overall Simulation** | $\mathcal{O}(N)$ | $\mathcal{O}(N \times C)$ | Highly efficient for real-time educational use |

---

## 8. Conclusion & Learning Outcomes

By implementing the COA module in AssemblyFlow:
1. Mastered the inner mechanics of the **5-stage classic RISC pipeline** and the structural role of pipeline registers.
2. Verified the operational importance of **split-phase register file timing** in avoiding extraneous write-read stalls.
3. Quantified the concrete performance benefits of **hardware data forwarding**, proving how bypassing eliminates RAW stalls and maximizes CPI.
4. Built an intuitive, cycle-accurate simulation tool that visualizes instruction progression across discrete clock cycles.

---

## 9. Academic References

1. **Patterson, D. A., & Hennessy, J. L.** (2020). *Computer Organization and Design: The Hardware/Software Interface* (RISC-V Edition). Morgan Kaufmann.
2. **Stallings, W.** (2018). *Computer Organization and Architecture: Designing for Performance* (11th ed.). Pearson.
3. **Hennessy, J. L., & Patterson, D. A.** (2019). *Computer Architecture: A Quantitative Approach* (6th ed.). Morgan Kaufmann.
