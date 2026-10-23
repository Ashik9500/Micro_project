import React from 'react';

interface ModuleDetailViewProps {
  section: 'flat' | 'daa' | 'coa';
  code: string;
  onReturnToOverview: () => void;
}

interface ModuleMeta {
  title: string;
  fullName: string;
  step: string;
  badge: string;
  tagClass: string;
  summary: string;
  plannedFeatures: { title: string; description: string }[];
  inputOutputInfo: { input: string; output: string };
}

const MODULE_DATA: Record<'flat' | 'daa' | 'coa', ModuleMeta> = {
  flat: {
    title: 'FLAT Module',
    fullName: 'Formal Language & Automata Theory — Lexical Normalizer',
    step: 'Step 3',
    badge: 'Grammar & Normalization',
    tagClass: 'flat-tag',
    summary:
      'The FLAT engine accepts raw assembly instructions, applies formal regular grammar rules to tokenize mnemonics, registers, and memory addresses, strips irregular whitespace/comments, and validates syntactical compliance.',
    plannedFeatures: [
      {
        title: 'Regex Tokenizer & Lexer',
        description: 'Breaks lines into labels, mnemonics (LOAD, ADD, SUB, STORE, HALT), and comma-delimited operands.',
      },
      {
        title: 'Mnemonic Normalization',
        description: 'Converts mixed-case mnemonics to standard uppercase and standardizes immediate/indirect addressing syntax.',
      },
      {
        title: 'Syntax & Boundary Validation',
        description: 'Flags invalid registers, missing operands, and malformed statements with exact line numbers.',
      },
    ],
    inputOutputInfo: {
      input: 'Raw user-entered assembly text',
      output: 'Clean, normalized instruction array with token types and validation status',
    },
  },
  daa: {
    title: 'DAA Module',
    fullName: 'Design & Analysis of Algorithms — Dependency Graph Analyzer',
    step: 'Step 4',
    badge: 'Hazard & Graph Analysis',
    tagClass: 'daa-tag',
    summary:
      'The DAA engine analyzes register read/write sets between instructions to compute Read-After-Write (RAW), Write-After-Read (WAR), and Write-After-Write (WAW) dependencies, constructing a Directed Acyclic Graph (DAG) for execution ordering.',
    plannedFeatures: [
      {
        title: 'Hazard Matrix Computation',
        description: 'Calculates true dependencies (RAW data hazards) and anti/output dependencies across instructions.',
      },
      {
        title: 'DAG Construction',
        description: 'Generates graph nodes (instructions) and directed edges indicating precedence constraints.',
      },
      {
        title: 'Topological Sort & Critical Path',
        description: 'Computes earliest schedule order and identifies bottleneck instructions.',
      },
    ],
    inputOutputInfo: {
      input: 'Normalized instruction array from FLAT',
      output: 'Dependency adjacency matrix, hazard classification list, and DAG representation',
    },
  },
  coa: {
    title: 'COA Module',
    fullName: 'Computer Organization & Architecture — 5-Stage Pipeline Simulator',
    step: 'Step 5',
    badge: 'Hardware & Pipeline Simulation',
    tagClass: 'coa-tag',
    summary:
      'The COA simulation engine models the classic 5-stage RISC pipeline (IF, ID, EX, MEM, WB). It calculates clock cycle timing, detects stalls from unresolved data dependencies, and simulates forwarding paths.',
    plannedFeatures: [
      {
        title: 'Cycle-by-Cycle Execution Matrix',
        description: 'Visual grid mapping each instruction to its pipeline stage across discrete clock cycles (CC1, CC2, etc.).',
      },
      {
        title: 'Hazard Stall Bubbles',
        description: 'Detects data stalls and inserts NOP/bubble cycles when forwarding cannot resolve the operand in time.',
      },
      {
        title: 'Performance Metrics Calculation',
        description: 'Computes total clock cycles, Cycles Per Instruction (CPI), and speedup ratio.',
      },
    ],
    inputOutputInfo: {
      input: 'Dependency graph from DAA and execution configuration',
      output: 'Pipeline timing matrix, stall counts, CPI, and total cycle breakdown',
    },
  },
};

export const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({
  section,
  code,
  onReturnToOverview,
}) => {
  const meta = MODULE_DATA[section];
  const lineCount = code.trim() ? code.trim().split('\n').length : 0;

  return (
    <section className="module-detail-view" aria-label={`${meta.title} Details`}>
      <div className="module-detail-header">
        <button
          className="back-overview-button"
          onClick={onReturnToOverview}
          aria-label="Return to Dashboard Overview"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Return to Overview</span>
        </button>

        <div className="module-badges-row">
          <span className={`preview-tag ${meta.tagClass}`}>{meta.badge}</span>
          <span className="step-badge">Scheduled: {meta.step}</span>
        </div>
      </div>

      <div className="module-detail-card">
        <h2 className="module-detail-title">{meta.fullName}</h2>
        <p className="module-detail-summary">{meta.summary}</p>

        <div className="spec-callout-box">
          <div className="spec-callout-header">
            <span className="spec-indicator-dot"></span>
            <strong>Implementation Status: Pending {meta.step}</strong>
          </div>
          <p className="spec-callout-text">
            This module interface is defined as part of Step 2 UI architecture. The underlying algorithms and computation logic will be implemented in {meta.step}.
          </p>
        </div>

        <h3 className="section-subheading">Planned Engineering Capabilities</h3>
        <div className="features-grid">
          {meta.plannedFeatures.map((feat, idx) => (
            <div key={idx} className="feature-item-card">
              <div className="feature-item-header">
                <span className="feature-number">0{idx + 1}</span>
                <h4 className="feature-item-title">{feat.title}</h4>
              </div>
              <p className="feature-item-desc">{feat.description}</p>
            </div>
          ))}
        </div>

        <h3 className="section-subheading">Data Flow Contract</h3>
        <div className="data-flow-box">
          <div className="data-flow-item">
            <span className="data-flow-label">Expected Input:</span>
            <span className="data-flow-value">{meta.inputOutputInfo.input}</span>
          </div>
          <div className="data-flow-divider" aria-hidden="true">&rarr;</div>
          <div className="data-flow-item">
            <span className="data-flow-label">Expected Output:</span>
            <span className="data-flow-value">{meta.inputOutputInfo.output}</span>
          </div>
        </div>

        <div className="active-code-preview">
          <div className="active-code-preview-header">
            <span>Current Code in Assembly Editor ({lineCount} instructions/lines loaded)</span>
          </div>
          <pre className="active-code-snippet">
            {code || '; No assembly code currently loaded in the editor.'}
          </pre>
        </div>
      </div>
    </section>
  );
};
