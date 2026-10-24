# AssemblyFlow — Automated Assembly Code Normalizer & Pipelined Execution Analyzer

> **Integrated Micro Project for FLAT, DAA, and COA**

---

## 🔗 Project Links

- **Live Deployed Web Application**: [https://micro-project-a338.onrender.com/](https://micro-project-a338.onrender.com/)
- **GitHub Repository**: [https://github.com/Ashik9500/Micro_project.git](https://github.com/Ashik9500/Micro_project.git)

---

## 📖 Project Overview

**AssemblyFlow** is an integrated educational computer science engineering project combining three foundational subjects into an interactive, end-to-end web workbench:

1. **Formal Languages & Automata Theory (FLAT) — Stage 1 (Compiler Front-End)**:
   - Scans and tokenizes assembly source code into structured tokens in $\mathcal{O}(N)$ linear time.
   - Enforces a formal **Deterministic Finite Automaton (DFA)** $M = (Q, \Sigma, \delta, q_0, F)$ recognizing valid register tokens $R0$ through $R15$.
   - Validates assembly syntax against Context-Free Grammar (CFG) rules for `LOAD`, `MOV`, `ADD`, and `SUB`.
   - Halts the pipeline immediately on lexical or syntactic violations with precise line and column diagnostics.

2. **Design & Analysis of Algorithms (DAA) — Stage 2 (Graph-Theoretic Scheduler)**:
   - Extracts Read Sets $R(I)$ and Write Sets $W(I)$ using **Bernstein's Conditions for Concurrency**.
   - Identifies **RAW** (true data dependency), **WAR** (anti-dependency), and **WAW** (output dependency).
   - Constructs a consolidated **Directed Acyclic Graph (DAG)** with composite multi-hazard edges.
   - Executes **Kahn's Topological Sorting Algorithm** in $\mathcal{O}(V + E)$ time with deterministic priority tie-breaking and cycle detection.

3. **Computer Organization & Architecture (COA) — Stage 3 (Microarchitecture Simulator)**:
   - Simulates execution across the classic **5-stage RISC pipeline**: `IF -> ID -> EX -> MEM -> WB`.
   - Models **split-phase register file timing** (write in first half of cycle, read in second half).
   - Injects stall bubbles (NOPs) for unresolved RAW hazards under hardware interlocks.
   - Features an interactive toggle for **Hardware Data Forwarding** (ALU-to-ALU bypass paths) to demonstrate stall elimination.
   - Computes realistic **Cycles Per Instruction (CPI)**, total clock cycles, and execution speedup.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### Installation
Clone the repository and install all dependencies for both frontend and backend:
```powershell
git clone https://github.com/Ashik9500/Micro_project.git
cd Micro_project
npm run install:all
```

### Running Development Servers
- **Backend Server (Port 5000)**:
  ```powershell
  npm run dev:backend
  ```
- **Frontend Client (Port 3000 / Vite)**:
  ```powershell
  npm run dev:frontend
  ```

### Running Automated Test Suite
The project includes 67 automated test cases verifying grammar, DFAs, Kahn's algorithm, and 5-stage pipeline schedules:
```powershell
npm test
```

---

## 👨‍💻 Student Information

- **Student Name**: Ashik Ameen
- **Academic Term**: October 2026
- **Submission Type**: Integrated Micro Project (FLAT, COA, DAA)
