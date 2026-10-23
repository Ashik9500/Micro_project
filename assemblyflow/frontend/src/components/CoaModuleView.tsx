import React from 'react';
import type { COASimulationResult, PipelineStage } from '../types';

interface CoaModuleViewProps {
  code: string;
  onReturnToOverview: () => void;
  onSimulate: (forwardingEnabled: boolean) => void;
  simulationResult: COASimulationResult | null;
  isSimulating: boolean;
  simulationError: string | null;
  forwardingEnabled: boolean;
  onToggleForwarding: () => void;
}

export const CoaModuleView: React.FC<CoaModuleViewProps> = ({
  code,
  onReturnToOverview,
  onSimulate,
  simulationResult,
  isSimulating,
  simulationError,
  forwardingEnabled,
  onToggleForwarding,
}) => {
  const lineCount = code.trim() ? code.trim().split('\n').filter((l) => l.trim() && !l.trim().startsWith(';')).length : 0;

  const getStageBadgeClass = (stage: PipelineStage): string => {
    switch (stage) {
      case 'IF':
        return 'stage-badge stage-if';
      case 'ID':
        return 'stage-badge stage-id';
      case 'EX':
        return 'stage-badge stage-ex';
      case 'MEM':
        return 'stage-badge stage-mem';
      case 'WB':
        return 'stage-badge stage-wb';
      case 'STALL':
        return 'stage-badge stage-stall';
      default:
        return 'stage-empty';
    }
  };

  const getStageLabel = (stage: PipelineStage): string => {
    switch (stage) {
      case 'IF':
        return 'IF';
      case 'ID':
        return 'ID';
      case 'EX':
        return 'EX';
      case 'MEM':
        return 'MEM';
      case 'WB':
        return 'WB';
      case 'STALL':
        return 'STALL';
      default:
        return '';
    }
  };

  return (
    <section className="module-detail-view" aria-label="COA Pipeline Simulator">
      {/* Top Header & Breadcrumb */}
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
          <span className="preview-tag coa-tag">Step 5: COA Active</span>
          <span className="step-badge">5-Stage In-Order RISC Pipeline</span>
          <span className={`status-badge-pill ${forwardingEnabled ? 'pill-forwarding-on' : 'pill-forwarding-off'}`}>
            Forwarding: {forwardingEnabled ? 'ENABLED' : 'DISABLED (Default)'}
          </span>
        </div>
      </div>

      <div className="module-detail-card">
        {/* Title & Introduction */}
        <div className="module-title-section">
          <h2 className="module-detail-title">
            Computer Organization &amp; Architecture &mdash; 5-Stage Pipeline Simulator
          </h2>
          <p className="module-detail-summary">
            Simulate cycle-by-cycle execution of normalized assembly code across classic RISC stages (IF, ID, EX, MEM, WB).
            Identifies Read-After-Write (RAW) data hazards, calculates stall bubble penalties, and computes realistic Cycles Per Instruction (CPI).
          </p>
        </div>

        {/* Action Controls & Forwarding Toggle */}
        <div className="coa-controls-bar">
          <div className="coa-controls-left">
            <button
              className="run-coa-button"
              onClick={() => onSimulate(forwardingEnabled)}
              disabled={isSimulating}
              id="simulate-pipeline-btn"
            >
              {isSimulating ? (
                <>
                  <span className="button-spinner" aria-hidden="true"></span>
                  <span>Simulating Pipeline...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">&#9654;</span>
                  <span>Simulate Pipeline Execution</span>
                </>
              )}
            </button>

            <button
              className={`forwarding-toggle-btn ${forwardingEnabled ? 'active' : ''}`}
              onClick={onToggleForwarding}
              title="Toggle Data Forwarding bypass paths"
              id="toggle-forwarding-btn"
            >
              <span className="toggle-switch-icon">{forwardingEnabled ? '⚡' : '🛑'}</span>
              <span>
                Forwarding: <strong>{forwardingEnabled ? 'Enabled' : 'Disabled (Default)'}</strong>
              </span>
            </button>
          </div>

          <div className="coa-controls-right">
            <span className="loaded-instructions-hint">
              Loaded: <strong>{lineCount}</strong> instruction(s) in editor
            </span>
          </div>
        </div>

        {/* Error Callout */}
        {simulationError && (
          <div className="coa-error-banner" role="alert">
            <div className="error-banner-header">
              <span className="error-icon" aria-hidden="true">&#9888;</span>
              <strong>Pipeline Simulation Error</strong>
            </div>
            <p className="error-message-text">{simulationError}</p>
            <p className="error-hint-text">
              Ensure your assembly code is valid under FLAT grammar rules (LOAD, MOV, ADD, SUB with R0&ndash;R15).
            </p>
          </div>
        )}

        {/* Simulation Results Display */}
        {simulationResult && (
          <div className="coa-results-container">
            {/* 1. Metric Cards Bar */}
            <div className="coa-metrics-grid">
              <div className="coa-metric-box">
                <span className="metric-box-label">Total Instructions (N)</span>
                <span className="metric-box-val">{simulationResult.totalInstructions}</span>
                <span className="metric-box-sub">Executable assembly statements</span>
              </div>

              <div className="coa-metric-box">
                <span className="metric-box-label">Total Clock Cycles</span>
                <span className="metric-box-val metric-val-cycles">{simulationResult.totalCycles} CC</span>
                <span className="metric-box-sub">
                  Ideal: {simulationResult.idealCycles} CC ({simulationResult.totalStalls} stall bubbles)
                </span>
              </div>

              <div className="coa-metric-box">
                <span className="metric-box-label">Performance (CPI)</span>
                <span className="metric-box-val metric-val-cpi">{simulationResult.cpi.toFixed(2)}</span>
                <span className="metric-box-sub">Cycles Per Instruction (CC / N)</span>
              </div>

              <div className="coa-metric-box">
                <span className="metric-box-label">Total Stall Cycles</span>
                <span className={`metric-box-val ${simulationResult.totalStalls > 0 ? 'metric-val-stalls' : 'metric-val-nostalls'}`}>
                  {simulationResult.totalStalls}
                </span>
                <span className="metric-box-sub">
                  {simulationResult.totalStalls > 0 ? 'RAW data hazard bubbles' : 'Zero bubbles (Ideal flow)'}
                </span>
              </div>

              <div className="coa-metric-box">
                <span className="metric-box-label">Pipeline Speedup</span>
                <span className="metric-box-val metric-val-speedup">{simulationResult.speedup.toFixed(2)}x</span>
                <span className="metric-box-sub">vs Non-pipelined (N &times; 5 CC)</span>
              </div>
            </div>

            {/* 2. Cycle-by-Cycle Pipeline Timing Diagram */}
            <div className="coa-timing-section">
              <div className="section-header-row">
                <h3 className="section-subheading" style={{ margin: 0 }}>
                  Cycle-by-Cycle Pipeline Timing Diagram
                </h3>
                <span className="grid-scroll-hint">&larr; Scroll horizontally to view all cycles &rarr;</span>
              </div>

              <div className="timing-table-wrapper">
                <table className="pipeline-timing-table" aria-label="Pipeline execution grid">
                  <thead>
                    <tr>
                      <th className="col-inst-id">Inst</th>
                      <th className="col-assembly">Assembly Instruction</th>
                      <th className="col-rw">Read / Write</th>
                      <th className="col-stalls">Stalls</th>
                      {simulationResult.cycleHeaders.map((cycleNum) => (
                        <th key={cycleNum} className="col-cycle-header">
                          CC{cycleNum}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.schedule.map((item) => (
                      <tr key={item.id} className={item.stallCycles > 0 ? 'row-has-stall' : 'row-clean'}>
                        <td className="cell-inst-id">
                          <span className="inst-badge">{item.id}</span>
                        </td>
                        <td className="cell-assembly">
                          <code className="assembly-snippet">{item.raw}</code>
                        </td>
                        <td className="cell-rw">
                          <div className="rw-tags">
                            {item.writes.map((w) => (
                              <span key={w} className="rw-tag-write" title={`Writes ${w}`}>
                                W:{w}
                              </span>
                            ))}
                            {item.reads.map((r) => (
                              <span key={r} className="rw-tag-read" title={`Reads ${r}`}>
                                R:{r}
                              </span>
                            ))}
                            {item.writes.length === 0 && item.reads.length === 0 && (
                              <span className="rw-tag-none">&mdash;</span>
                            )}
                          </div>
                        </td>
                        <td className="cell-stalls">
                          {item.stallCycles > 0 ? (
                            <span className="stall-count-pill" title={item.stallReasons.join('; ')}>
                              +{item.stallCycles} stall{item.stallCycles > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="stall-none-pill">0</span>
                          )}
                        </td>
                        {simulationResult.cycleHeaders.map((cycleNum) => {
                          const stage = item.timeline[cycleNum] || '';
                          return (
                            <td key={cycleNum} className="cell-stage">
                              {stage ? (
                                <span
                                  className={getStageBadgeClass(stage)}
                                  title={
                                    stage === 'STALL'
                                      ? `Clock Cycle ${cycleNum}: STALL (Pipeline Bubble) — ${item.stallReasons[0] || 'RAW Hazard'}`
                                      : `Clock Cycle ${cycleNum}: ${item.id} in ${stage} stage`
                                  }
                                >
                                  {getStageLabel(stage)}
                                </span>
                              ) : (
                                <span className="stage-dot" aria-hidden="true">&middot;</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Stage Legend & Explanation Strip */}
            <div className="pipeline-legend-strip">
              <div className="legend-item">
                <span className="stage-badge stage-if">IF</span>
                <span><strong>Instruction Fetch</strong> &bull; Load instruction into IF/ID buffer</span>
              </div>
              <div className="legend-item">
                <span className="stage-badge stage-id">ID</span>
                <span><strong>Instruction Decode</strong> &bull; Decode opcode &amp; read registers</span>
              </div>
              <div className="legend-item">
                <span className="stage-badge stage-ex">EX</span>
                <span><strong>Execute</strong> &bull; ALU compute arithmetic or branch target</span>
              </div>
              <div className="legend-item">
                <span className="stage-badge stage-mem">MEM</span>
                <span><strong>Memory</strong> &bull; Access data memory cache</span>
              </div>
              <div className="legend-item">
                <span className="stage-badge stage-wb">WB</span>
                <span><strong>Write Back</strong> &bull; Commit result to destination register</span>
              </div>
              <div className="legend-item">
                <span className="stage-badge stage-stall">STALL</span>
                <span><strong>Hazard Bubble</strong> &bull; NOP cycle inserted for RAW dependency</span>
              </div>
            </div>

            {/* 4. Hazard Analysis Table */}
            <div className="coa-hazards-section">
              <h3 className="section-subheading">
                Detected RAW Data Hazards &amp; Stall Resolution
              </h3>

              {simulationResult.hazards.length === 0 ? (
                <div className="no-hazards-card">
                  <span className="no-hazards-icon" aria-hidden="true">&#10003;</span>
                  <div>
                    <strong>No Data Hazards Detected:</strong> All instructions in this sequence have their operands available without requiring pipeline stall bubbles.
                  </div>
                </div>
              ) : (
                <div className="hazards-table-wrapper">
                  <table className="coa-hazards-table">
                    <thead>
                      <tr>
                        <th>Hazard ID</th>
                        <th>Type</th>
                        <th>Producer &rarr; Consumer</th>
                        <th>Register</th>
                        <th>Stalls Incurred</th>
                        <th>Resolution Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.hazards.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <code>{h.id}</code>
                          </td>
                          <td>
                            <span className="hazard-type-pill pill-raw">{h.type}</span>
                          </td>
                          <td>
                            <strong>{h.producerId}</strong> &rarr; <strong>{h.consumerId}</strong>
                          </td>
                          <td>
                            <span className="hazard-reg-pill">{h.register}</span>
                          </td>
                          <td>
                            <span className={h.stallCycles > 0 ? 'hazard-stall-pill' : 'hazard-forward-pill'}>
                              {h.stallCycles > 0 ? `${h.stallCycles} Cycle(s)` : '0 Cycles (Forwarded)'}
                            </span>
                          </td>
                          <td className="hazard-explanation-cell">{h.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Documented Pipeline Architectural Assumptions */}
            <div className="coa-assumptions-section">
              <h3 className="section-subheading">Documented Pipeline Architectural Model</h3>
              <div className="assumptions-card">
                <p className="assumptions-intro">
                  This educational simulator models a canonical single-issue RISC pipeline under explicit, reproducible textbook rules:
                </p>
                <ul className="assumptions-list">
                  {simulationResult.assumptions.map((item, idx) => (
                    <li key={idx}>
                      <span className="assumption-bullet">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty State before Running Simulation */}
        {!simulationResult && !simulationError && !isSimulating && (
          <div className="coa-empty-state">
            <div className="empty-state-icon" aria-hidden="true">&#9881;</div>
            <h3 className="empty-state-heading">5-Stage Pipeline Simulator Ready</h3>
            <p className="empty-state-desc">
              Click <strong>&ldquo;Simulate Pipeline Execution&rdquo;</strong> to run this assembly sequence through the 5-stage RISC pipeline (IF, ID, EX, MEM, WB).
            </p>
            <div className="empty-state-info-grid">
              <div className="empty-info-card">
                <span className="empty-info-title">1. One-Cycle Stages</span>
                <span className="empty-info-sub">Single-issue in-order execution without out-of-order reordering.</span>
              </div>
              <div className="empty-info-card">
                <span className="empty-info-title">2. RAW Stall Insertion</span>
                <span className="empty-info-sub">Inserts 2 stall cycles for back-to-back true dependencies (without forwarding).</span>
              </div>
              <div className="empty-info-card">
                <span className="empty-info-title">3. CPI &amp; Speedup Metrics</span>
                <span className="empty-info-sub">Calculates total cycles, realistic CPI, and speedup vs sequential execution.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
