# Micro Project Report: Design & Analysis of Algorithms (DAA)

---

## Academic Project Information

| Field | Detail |
| :--- | :--- |
| **Project Title** | **AssemblyFlow: Automated Assembly Code Normalizer & Pipelined Execution Analyzer** |
| **Subject** | **Design and Analysis of Algorithms (DAA)** |
| **Student Name** | **Ashik Ameen** |
| **GitHub Repository** | [https://github.com/Ashik9500/Micro_project.git](https://github.com/Ashik9500/Micro_project.git) |
| **Deployed Web Application** | [https://micro-project-a338.onrender.com/](https://micro-project-a338.onrender.com/) |
| **Technology Stack** | TypeScript, Node.js, Express, React 19, Vite |
| **Submission Date** | October 2026 |

---

## 1. Executive Summary & Abstract

In computer systems and optimizing compilers, determining the valid execution order of computational statements while preserving data integrity is a fundamental graph-algorithmic challenge. Within **AssemblyFlow**, the **Design and Analysis of Algorithms (DAA)** module acts as **Stage 2 (The Graph-Theoretic Dependency & Scheduling Engine)**.

After source instructions have been validated by the FLAT module, the DAA engine applies:
1. **Bernstein's Conditions for Concurrency** to extract Read Sets $R(I)$ and Write Sets $W(I)$ for each instruction, identifying all true dependencies (**RAW**), anti-dependencies (**WAR**), and output dependencies (**WAW**).
2. Construction of a consolidated **Directed Acyclic Graph (DAG)** $G = (V, E)$, avoiding redundant multi-edges while preserving composite hazard relationships.
3. **Kahn's Algorithm for Topological Sorting**, executing in optimal $\mathcal{O}(V + E)$ time with deterministic tie-breaking based on program order.
4. Robust **Cycle Detection** to guarantee that unresolvable circular precedence constraints are flagged before passing the schedule to the COA pipeline simulator.

---

## 2. Theoretical Foundations in DAA

### 2.1 Register Read/Write Sets & Bernstein's Conditions
For any sequential instruction $I$, its memory and architectural footprint is characterized by:
- **Read Set $R(I)$**: The set of registers read during instruction execution.
- **Write Set $W(I)$**: The set of registers modified during instruction execution.

For two instructions $I_i$ and $I_j$ appearing in program order ($i < j$), Bernstein's Conditions establish whether $I_i$ and $I_j$ can execute concurrently or require a precedence edge $I_i \rightarrow I_j$:

| Condition | Mathematical Formulation | Hazard Classification | Architectural Meaning |
| :--- | :--- | :--- | :--- |
| **Condition 1** | $W(I_i) \cap R(I_j) \neq \emptyset$ | **RAW (Read-After-Write)** | **True Dependency**: $I_j$ requires values produced by $I_i$. Cannot be reordered. |
| **Condition 2** | $R(I_i) \cap W(I_j) \neq \emptyset$ | **WAR (Write-After-Read)** | **Anti-Dependency**: $I_j$ overwrites a register that $I_i$ still needs to read. |
| **Condition 3** | $W(I_i) \cap W(I_j) \neq \emptyset$ | **WAW (Write-After-Write)** | **Output Dependency**: Both instructions modify the same register; program output depends on execution order. |

If all three intersections are empty:
$$W(I_i) \cap R(I_j) = \emptyset \quad \land \quad R(I_i) \cap W(I_j) = \emptyset \quad \land \quad W(I_i) \cap W(I_j) = \emptyset$$
Then instructions $I_i$ and $I_j$ are completely independent and may execute in parallel or in arbitrary relative order.

### 2.2 Directed Acyclic Graph (DAG) Modeling
The dependency structure is modeled as a Directed Acyclic Graph:
$$G = (V, E)$$
Where:
- **$V$ is the set of vertices**: Each vertex $v \in V$ corresponds to an instruction $I_k$.
- **$E$ is the set of directed edges**: A directed edge $(I_i, I_j) \in E$ indicates that $I_i$ must complete or reach a specified execution stage before $I_j$ can proceed.

#### Edge Consolidation Property
In real assembly programs, two instructions may simultaneously exhibit multiple hazards (e.g., both a RAW dependency on $R_1$ and a WAW output dependency on $R_2$). Rather than polluting the graph with multi-edges ($|E| > |V|^2$), AssemblyFlow consolidates multiple dependencies between identical pairs $(I_i, I_j)$ into a single composite edge:
$$e = (I_i, I_j, \text{types} = [\text{RAW}, \text{WAW}], \text{registers} = [R_1, R_2])$$

### 2.3 Topological Sorting & Kahn's Algorithm
A **topological sort** of a directed graph $G = (V, E)$ is a linear ordering of its vertices such that for every directed edge $(u, v) \in E$, vertex $u$ appears before vertex $v$ in the ordering. A topological sort exists if and only if the graph has no directed cycles (is a DAG).

#### Mathematical Definitions
- **In-degree ($\text{deg}^-(v)$)**: The number of directed edges entering vertex $v$:
  $$\text{deg}^-(v) = |\{u \in V \mid (u, v) \in E\}|$$
- **Out-degree ($\text{deg}^+(v)$)**: The number of directed edges leaving vertex $v$:
  $$\text{deg}^+(v) = |\{w \in V \mid (v, w) \in E\}|$$

#### Kahn's Algorithm Specification
1. Compute $\text{deg}^-(v)$ for all $v \in V$.
2. Initialize an active set $S \leftarrow \{v \in V \mid \text{deg}^-(v) = 0\}$.
3. Initialize empty result list $L \leftarrow []$.
4. While $S$ is non-empty:
   - **Deterministic Tie-Breaking**: Extract vertex $u \in S$ having the minimal original instruction index:
     $$u = \arg\min_{v \in S} \text{instructionIndex}(v)$$
   - Append $u$ to $L$.
   - For each outgoing neighbor $w$ such that $(u, w) \in E$:
     - Decrement $\text{deg}^-(w) \leftarrow \text{deg}^-(w) - 1$.
     - If $\text{deg}^-(w) = 0$, insert $w$ into $S$.
5. **Cycle Detection Check**:
   - If $|L| == |V|$, $L$ is a valid topological sort.
   - If $|L| < |V|$, the graph contains at least one directed cycle, and topological ordering is impossible.

---

## 3. Architecture & Implementation in AssemblyFlow

The DAA engine is located in `assemblyflow/backend/src/services/daa/`:
- `types.ts`: TypeScript data structures for nodes, edges, hazard types, and step snapshots.
- `dependencyGraph.ts`: Register usage analysis and consolidated DAG edge construction.
- `topologicalSort.ts`: Kahn's algorithm implementation with deterministic tie-breaking and step-by-step trace generation.

### 3.1 Register Extraction Logic (`dependencyGraph.ts`)

```typescript
export function extractRegisterUsage(instruction: InstructionAST): { reads: string[]; writes: string[] } {
  const writes: string[] = [instruction.destination.toUpperCase()];
  const readSet = new Set<string>();

  switch (instruction.opcode) {
    case 'LOAD':
      // LOAD Rd, immediate -> Writes Rd, reads no registers
      break;
    case 'MOV':
      // MOV Rd, Rs -> Writes Rd, reads Rs
      readSet.add(instruction.operands[0].toUpperCase());
      break;
    case 'ADD':
    case 'SUB':
      // ADD/SUB Rd, Rs1, Rs2 -> Writes Rd, reads Rs1 and Rs2
      for (const op of instruction.operands) {
        readSet.add(op.toUpperCase());
      }
      break;
  }

  return { reads: Array.from(readSet), writes };
}
```

### 3.2 Kahn's Algorithm Implementation (`topologicalSort.ts`)

```typescript
export function kahnTopologicalSort(nodes: DAANode[], edges: DAAEdge[]): TopologicalSortResult {
  const inDegree: Record<string, number> = {};
  const adjList = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree[n.id] = 0;
    adjList.set(n.id, []);
  }

  for (const edge of edges) {
    inDegree[edge.to]++;
    adjList.get(edge.from)!.push(edge.to);
  }

  const availableSet = new Set<string>();
  for (const n of nodes) {
    if (inDegree[n.id] === 0) availableSet.add(n.id);
  }

  const sortedOrder: string[] = [];
  const steps: TopologicalStep[] = [];
  let stepCount = 0;

  while (availableSet.size > 0) {
    stepCount++;
    // Deterministic tie-breaker: Lowest instruction index
    const candidateIds = Array.from(availableSet).sort((a, b) => {
      return nodeMap.get(a)!.instructionIndex - nodeMap.get(b)!.instructionIndex;
    });

    const selectedId = candidateIds[0];
    availableSet.delete(selectedId);
    sortedOrder.push(selectedId);

    const neighbors = adjList.get(selectedId) || [];
    for (const neighborId of neighbors) {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        availableSet.add(neighborId);
      }
    }
  }

  const hasCycle = sortedOrder.length < nodes.length;
  return { order: sortedOrder, orderedNodes, hasCycle, steps };
}
```

---

## 4. Asymptotic Complexity Analysis

### 4.1 Time Complexity Analysis
1. **Instruction Read/Write Set Extraction**:
   - For $V$ instructions, each instruction has at most 3 operands.
   - Processing time per instruction is $\mathcal{O}(1)$.
   - Total Set Extraction Time: $\mathcal{O}(V)$.

2. **Dependency Edge Construction**:
   - Compares every pair $(I_i, I_j)$ with $i < j$.
   - Total comparisons: $\frac{V(V - 1)}{2} = \mathcal{O}(V^2)$.
   - In sparse code graphs with small dependency chains, edge count $|E| \ll V^2$.
   - Construction Time: $\mathcal{O}(V^2)$.

3. **Kahn's Topological Sort**:
   - In-degree initialization: $\mathcal{O}(V + E)$.
   - Vertex queue operations: Each vertex is added to and removed from the candidate set exactly once $\rightarrow \mathcal{O}(V)$.
   - Edge relaxation: Each edge is traversed and decremented exactly once $\rightarrow \mathcal{O}(E)$.
   - Tie-breaking: Sorting candidates of size $k \le V$ takes $\mathcal{O}(k \log k)$ per step. With binary min-heap: $\mathcal{O}(V \log V)$.
   - Total Sorting Time: $\mathcal{O}(V + E)$.

### 4.2 Space Complexity Analysis
- **Adjacency List**: Stores $|V|$ vertex lists and $|E|$ directed edge pointers $\rightarrow \mathcal{O}(V + E)$.
- **In-Degree Table**: Hash map containing $|V|$ integer counters $\rightarrow \mathcal{O}(V)$.
- **Candidate Set & Result List**: At most $|V|$ identifiers $\rightarrow \mathcal{O}(V)$.
- **Total Auxiliary Space**: $\mathcal{O}(V + E)$ (Optimal).

---

## 5. Experimental Test Cases & Verification

The DAA engine was evaluated across diverse graph topologies (`daa.test.ts` and `step7_comprehensive.test.ts`).

### Test Case 1: Multi-Hazard Consolidated Graph
- **Assembly Program**:
  ```assembly
  LOAD R1, 10
  ADD  R1, R1, R2
  ```
- **Hazard Analysis**:
  - $I_1$: $W(I_1) = \{R1\}, R(I_1) = \emptyset$
  - $I_2$: $W(I_2) = \{R1\}, R(I_2) = \{R1, R2\}$
  - $W(I_1) \cap R(I_2) = \{R1\} \neq \emptyset \implies \textbf{RAW}$
  - $W(I_1) \cap W(I_2) = \{R1\} \neq \emptyset \implies \textbf{WAW}$
- **Outcome**: A single consolidated edge $I_1 \rightarrow I_2$ tagged with composite hazard `RAW + WAW` on register `R1`. Duplicate edges avoided!

### Test Case 2: Chain of Dependencies & Step-by-Step Kahn's Execution
- **Assembly Program**:
  ```assembly
  LOAD R1, 10
  ADD  R2, R1, R3
  SUB  R4, R2, R5
  ```
- **Graph Topology**:
  - Vertices: $V = \{I_1, I_2, I_3\}$
  - Edges: $E = \{(I_1, I_2), (I_2, I_3)\}$
  - Initial In-Degrees: $\text{deg}^-(I_1) = 0, \text{deg}^-(I_2) = 1, \text{deg}^-(I_3) = 1$.

- **Step-by-Step Kahn Trace**:
  - **Step 1**: Available candidates: $\{I_1\}$. Select $I_1$. Decrement successor $I_2$. $\text{deg}^-(I_2) \rightarrow 0$.
  - **Step 2**: Available candidates: $\{I_2\}$. Select $I_2$. Decrement successor $I_3$. $\text{deg}^-(I_3) \rightarrow 0$.
  - **Step 3**: Available candidates: $\{I_3\}$. Select $I_3$. No successors.
  - **Final Topological Order**: $[I_1, I_2, I_3]$. `hasCycle: false`.

### Test Case 3: Independent Instructions with Tie-Breaking
- **Assembly Program**:
  ```assembly
  LOAD R1, 10
  LOAD R2, 20
  LOAD R3, 30
  ```
- **Graph Topology**: Zero dependency edges ($|E| = 0$).
- **In-Degrees**: $\text{deg}^-(I_1) = 0, \text{deg}^-(I_2) = 0, \text{deg}^-(I_3) = 0$.
- **Tie-Breaking Evaluation**: At step 1, candidate set contains $\{I_1, I_2, I_3\}$. The tie-breaker deterministically picks $I_1$ (index 1), then $I_2$ (index 2), then $I_3$ (index 3).
- **Result**: Preserves natural program order $[I_1, I_2, I_3]$ without arbitrary non-deterministic reordering.

---

## 6. Frontend Visualizations in AssemblyFlow

The React frontend (`DaaModuleView.tsx`) provides graphical analysis tools:
1. **Instruction Read/Write Cards**: Dynamic visualization of $R(I)$ and $W(I)$ register sets alongside in-degree counters.
2. **Interactive Dependency Graph**: Interactive SVG/Card graph displaying consolidated precedence edges with distinctive color badges:
   - RAW: Coral / Amber
   - WAR: Purple
   - WAW: Cyan
3. **Step-by-Step Kahn Execution Stepper**: Allows students to trace the algorithm state cycle-by-cycle, observing the candidate queue, in-degree decrements, and selected vertices.

---

## 7. Comparative Algorithm Analysis: Kahn's vs. DFS Topological Sort

| Feature | Kahn's Algorithm (In-Degree Queue) | Tarjan's / Cormen's DFS Algorithm |
| :--- | :--- | :--- |
| **Approach** | Breadth-First / In-degree reduction | Depth-First Search / Post-order reversal |
| **Time Complexity** | $\mathcal{O}(V + E)$ | $\mathcal{O}(V + E)$ |
| **Space Complexity** | $\mathcal{O}(V + E)$ (Adjacency list + queue) | $\mathcal{O}(V + E)$ (Recursion stack + colors) |
| **Cycle Handling** | Natural detection ($|L| < |V|$) | Requires 3-color vertex marking (White/Gray/Black) |
| **Tie-Breaking** | Trivial: sort candidate queue by priority | Non-trivial: dependent on DFS branch visit order |
| **Educational Fit** | **Superior for Instruction Scheduling** | Better suited for strongly connected components |

AssemblyFlow selects **Kahn's algorithm** because its step-by-step reduction directly mirrors hardware instruction ready-queues in out-of-order processors and instruction reservation stations.

---

## 8. Conclusion & Learning Outcomes

By implementing the DAA module in AssemblyFlow:
1. Applied **Bernstein's Conditions** to convert programmatic assembly code into mathematical read and write sets.
2. Modeled data hazards as a **Directed Acyclic Graph** with edge consolidation.
3. Implemented and benchmarked **Kahn's Topological Sorting Algorithm**, demonstrating $\mathcal{O}(V + E)$ efficiency and deterministic priority tie-breaking.
4. Designed an educational workbench that demystifies graph theory through interactive visual traces.

---

## 9. Academic References

1. **Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C.** (2022). *Introduction to Algorithms* (4th ed.). MIT Press. (Chapter 22: Elementary Graph Algorithms).
2. **Kleinberg, J., & Tardos, É.** (2006). *Algorithm Design*. Pearson / Addison-Wesley. (Topological Ordering and DAGs).
3. **Bernstein, A. J.** (1966). *Analysis of Programs for Parallel Processing*. IEEE Transactions on Electronic Computers, EC-15(5), 757–763.
