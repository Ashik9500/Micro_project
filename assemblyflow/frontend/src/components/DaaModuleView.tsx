import React, { useState } from 'react';
import type { DAAAnalysisResult, DependencyType } from '../types';

interface DaaModuleViewProps {
  code: string;
  onReturnToOverview: () => void;
  onAnalyze: () => Promise<void>;
  analysisResult: DAAAnalysisResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
}

export const DaaModuleView: React.FC<DaaModuleViewProps> = ({
  code,
  onReturnToOverview,
  onAnalyze,
  analysisResult,
  isAnalyzing,
  analysisError,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getHazardBadgeClass = (type: DependencyType): string => {
    switch (type) {
      case 'RAW':
        return 'hazard-badge-raw';
      case 'WAR':
        return 'hazard-badge-war';
      case 'WAW':
        return 'hazard-badge-waw';
    }
  };

  return (
    <section className="daa-module-container" aria-label="DAA Dependency Analysis Module">
      {/* Top Navigation Row */}
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
          <span className="preview-tag daa-tag">Algorithms &bull; DAG Scheduling</span>
          <span className="step-badge active-step-badge">Active Engine &bull; Step 4</span>
        </div>
      </div>

      {/* Main DAA Card */}
      <div className="daa-main-card">
        <div className="daa-header-intro">
          <h2 className="module-detail-title">DAA Module: Instruction Dependency Analysis &amp; Topological Sorting</h2>
          <p className="module-detail-summary">
            Design and Analysis of Algorithms provides graph-theoretic models to detect data hazards and construct
            a Directed Acyclic Graph (DAG) for valid instruction scheduling using Kahn&apos;s algorithm.
          </p>

          {/* Academic Concepts Callout */}
          <div className="flat-concepts-grid">
            <div className="concept-box">
              <span className="concept-number">1</span>
              <div>
                <strong>Hazard Classification (Bernstein&apos;s Conditions)</strong>
                <p>Identifies <strong>RAW</strong> (true data dependency), <strong>WAR</strong> (anti-dependency), and <strong>WAW</strong> (output dependency) between register read/write sets.</p>
              </div>
            </div>
            <div className="concept-box">
              <span className="concept-number">2</span>
              <div>
                <strong>Directed Acyclic Graph (DAG)</strong>
                <p>Represents instructions as vertices $V$ and required execution precedence constraints as directed edges $E$. Duplicate edges are strictly avoided.</p>
              </div>
            </div>
            <div className="concept-box">
              <span className="concept-number">3</span>
              <div>
                <strong>Kahn&apos;s Algorithm with Tie-Breaking</strong>
                <p>Computes valid execution order in <em>O(V + E)</em> time by iteratively picking nodes with in-degree 0. Ties are broken deterministically by program order.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flat-action-bar">
          <div className="flat-action-info">
            <span className="supported-grammar-badge">
              <strong>DAA Scope:</strong> RAW &bull; WAR &bull; WAW &bull; Kahn&apos;s Algorithm &bull; <em>O(V + E)</em> Complexity
            </span>
          </div>

          <button
            id="run-daa-analyze-btn"
            className="run-validate-button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !code.trim()}
          >
            {isAnalyzing ? (
              <>
                <span className="button-spinner" aria-hidden="true"></span>
                <span>Analyzing Dependencies...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Analyze Dependencies (DAA)</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {analysisError && (
          <div className="validation-alert-box error" role="alert">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <div>
              <strong>DAA Analysis Error:</strong> {analysisError}
            </div>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysisResult && (
          <div className="daa-results-area" id="daa-results-container">
            {/* Status Summary Banner */}
            <div
              className={`validation-status-banner ${
                analysisResult.isIndependent ? 'banner-valid' : 'banner-daa-dependent'
              }`}
            >
              <div className="banner-title-group">
                <span className="banner-icon">
                  {analysisResult.isIndependent ? '✓' : '⟲'}
                </span>
                <div>
                  <h3 className="banner-heading">
                    {analysisResult.isIndependent
                      ? 'Independent Instructions: No Data Hazards Detected'
                      : `Dependency Graph Built: ${analysisResult.totalDependencies} Precedence Edge(s) Found`}
                  </h3>
                  <p className="banner-subtext">
                    {analysisResult.nodes.length} instruction node(s) &bull;{' '}
                    {analysisResult.rawCount} RAW (True) &bull;{' '}
                    {analysisResult.warCount} WAR (Anti) &bull;{' '}
                    {analysisResult.wawCount} WAW (Output) &bull;{' '}
                    Schedule: {analysisResult.topologicalSort.hasCycle ? 'Cycle Detected' : 'Valid DAG Order'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Nodes & Register Read/Write Matrix */}
            <div className="daa-section-box">
              <h3 className="sub-panel-title">1. Instruction Nodes &amp; Register Read/Write Sets</h3>
              <p className="sub-panel-subtitle">
                Bernstein&apos;s conditions require analyzing the exact set of registers read $R(I)$ and written $W(I)$ for each instruction.
              </p>

              <div className="nodes-cards-grid">
                {analysisResult.nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const inEdges = analysisResult.edges.filter((e) => e.to === node.id);
                  const outEdges = analysisResult.edges.filter((e) => e.from === node.id);

                  return (
                    <div
                      key={node.id}
                      className={`node-card ${isSelected ? 'node-card-selected' : ''}`}
                      onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                      title="Click to highlight related dependency edges"
                    >
                      <div className="node-card-header">
                        <span className="node-id-badge">{node.id}</span>
                        <span className="node-line-label">Line {node.lineNumber}</span>
                        <span className="node-indegree-pill" title="Number of incoming dependency edges">
                          in-degree: {inEdges.length}
                        </span>
                      </div>

                      <div className="node-raw-code font-mono">{node.raw}</div>

                      <div className="node-sets-row">
                        <div className="register-set-pill write-set">
                          <span className="set-label">Writes W:</span>
                          <span className="set-vals font-mono">
                            {node.writes.length > 0 ? node.writes.join(', ') : '∅'}
                          </span>
                        </div>
                        <div className="register-set-pill read-set">
                          <span className="set-label">Reads R:</span>
                          <span className="set-vals font-mono">
                            {node.reads.length > 0 ? node.reads.join(', ') : '∅'}
                          </span>
                        </div>
                      </div>

                      <div className="node-card-footer">
                        <span>Predecessors: {inEdges.length}</span>
                        <span>Successors: {outEdges.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Dependency Graph Visualization */}
            <div className="daa-section-box">
              <div className="graph-visual-header">
                <div>
                  <h3 className="sub-panel-title">2. Visual Dependency Graph (DAG)</h3>
                  <p className="sub-panel-subtitle">
                    Directed edges $(I_i \to I_j)$ enforce execution order to prevent pipeline race conditions.
                  </p>
                </div>
                <div className="hazard-legend">
                  <span className="legend-item"><span className="legend-dot raw-dot"></span> RAW (True)</span>
                  <span className="legend-item"><span className="legend-dot war-dot"></span> WAR (Anti)</span>
                  <span className="legend-item"><span className="legend-dot waw-dot"></span> WAW (Output)</span>
                </div>
              </div>

              {analysisResult.edges.length === 0 ? (
                <div className="empty-graph-notice">
                  <span className="notice-icon">✓</span>
                  <div>
                    <strong>All instructions are completely independent.</strong>
                    <p>There are no shared register hazards. Any instruction order satisfies data integrity.</p>
                  </div>
                </div>
              ) : (
                <div className="graph-flow-visualizer">
                  <div className="nodes-flow-row">
                    {analysisResult.nodes.map((node, nIdx) => (
                      <React.Fragment key={node.id}>
                        <div
                          className={`flow-node-item ${
                            selectedNodeId === node.id ? 'flow-selected' : ''
                          }`}
                          onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
                        >
                          <div className="flow-node-top">
                            <span className="flow-id">{node.id}</span>
                            <span className="flow-opcode">{node.opcode}</span>
                          </div>
                          <div className="flow-raw font-mono">{node.raw}</div>
                          <div className="flow-rw-tags">
                            <span className="rw-w" title={`Writes ${node.writes.join(', ')}`}>
                              W: {node.writes.join(', ') || '—'}
                            </span>
                            <span className="rw-r" title={`Reads ${node.reads.join(', ')}`}>
                              R: {node.reads.join(', ') || '—'}
                            </span>
                          </div>
                        </div>

                        {nIdx < analysisResult.nodes.length - 1 && (
                          <div className="flow-connector-slot" aria-hidden="true">
                            &bull;
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Edges List Visual Connectors */}
                  <div className="edges-visual-list">
                    <span className="edges-visual-heading">Active Dependency Edges:</span>
                    <div className="edges-chips-grid">
                      {analysisResult.edges.map((edge) => {
                        const isHighlighted =
                          selectedNodeId === edge.from || selectedNodeId === edge.to;
                        return (
                          <div
                            key={edge.id}
                            className={`edge-chip ${isHighlighted ? 'edge-chip-highlight' : ''}`}
                            title={edge.explanation}
                          >
                            <span className="edge-chip-nodes font-mono">
                              <strong>{edge.from}</strong> &rarr; <strong>{edge.to}</strong>
                            </span>
                            <div className="edge-chip-badges">
                              {edge.types.map((t) => (
                                <span key={t} className={`hazard-badge ${getHazardBadgeClass(t)}`}>
                                  {t}
                                </span>
                              ))}
                              <span className="edge-chip-reg font-mono">
                                [{edge.registers.join(', ')}]
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dependency Edges Explanations Table */}
            <div className="daa-section-box">
              <h3 className="sub-panel-title">3. Dependency Constraints &amp; Hazard Reasons</h3>
              <p className="sub-panel-subtitle">
                Precise academic explanations for each detected precedence edge.
              </p>

              {analysisResult.edges.length === 0 ? (
                <p className="text-muted" style={{ padding: '8px 0' }}>
                  No dependencies detected.
                </p>
              ) : (
                <div className="line-inspector-table-wrapper">
                  <table className="line-inspector-table">
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Edge</th>
                        <th style={{ width: '150px' }}>Hazard Type</th>
                        <th style={{ width: '100px' }}>Register(s)</th>
                        <th>Ordering Constraint &amp; Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.edges.map((edge) => (
                        <tr key={edge.id}>
                          <td className="font-mono">
                            <strong>{edge.from} &rarr; {edge.to}</strong>
                          </td>
                          <td>
                            <div className="hazard-badges-list">
                              {edge.types.map((t) => (
                                <span key={t} className={`hazard-badge ${getHazardBadgeClass(t)}`}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="font-mono">
                            <strong>{edge.registers.join(', ')}</strong>
                          </td>
                          <td className="edge-explanation-text">
                            {edge.explanation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Kahn's Algorithm Topological Sorting Schedule */}
            <div className="daa-section-box" id="topological-order-section">
              <div className="section-header-row">
                <div>
                  <h3 className="sub-panel-title">4. Kahn&apos;s Algorithm Topological Execution Schedule</h3>
                  <p className="sub-panel-subtitle">
                    A valid execution order generated by iteratively removing vertices with in-degree 0 (O(V + E)).
                  </p>
                </div>
                <span className="complexity-badge">Complexity: O(V + E)</span>
              </div>

              {analysisResult.topologicalSort.hasCycle ? (
                <div className="validation-alert-box error" role="alert">
                  <strong>Cycle Detected:</strong> {analysisResult.topologicalSort.cycleError}
                </div>
              ) : (
                <>
                  <div className="topological-order-banner">
                    <span className="order-banner-label">Computed Topological Order:</span>
                    <div className="order-sequence-row">
                      {analysisResult.topologicalSort.order.map((nodeId, idx) => {
                        const node = analysisResult.nodes.find((n) => n.id === nodeId);
                        return (
                          <React.Fragment key={nodeId}>
                            <div className="order-pill" title={node?.raw}>
                              <span className="order-idx">{idx + 1}</span>
                              <span className="order-node-id font-mono">{nodeId}</span>
                              <span className="order-node-code font-mono">{node?.raw}</span>
                            </div>
                            {idx < analysisResult.topologicalSort.order.length - 1 && (
                              <span className="order-arrow" aria-hidden="true">&rarr;</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  <p className="order-clarification-note">
                    <strong>Model Clarification:</strong> This topological schedule represents a mathematically valid execution order that satisfies all RAW, WAR, and WAW data constraints. Under this static dependency model, it is not claimed to be an &ldquo;optimized&rdquo; hardware schedule, but rather a dependency-respecting sequence.
                  </p>

                  {/* Step-by-Step Kahn's Trace Table */}
                  <h4 className="reference-title" style={{ marginTop: '16px' }}>
                    Kahn&apos;s Algorithm Step-by-Step Resolution Trace
                  </h4>
                  <div className="line-inspector-table-wrapper">
                    <table className="line-inspector-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>Step</th>
                          <th style={{ width: '120px' }}>Selected Node</th>
                          <th style={{ width: '180px' }}>Candidate Set (in-degree 0)</th>
                          <th style={{ width: '160px' }}>Tie-Breaker Rule</th>
                          <th>In-Degree Decrements &amp; Resolution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisResult.topologicalSort.steps.map((st) => (
                          <tr key={st.step}>
                            <td><strong>{st.step}</strong></td>
                            <td className="font-mono">
                              <span className="status-pill pill-success">{st.selectedNode}</span>
                            </td>
                            <td className="font-mono">
                              [{st.availableNodes.join(', ')}]
                            </td>
                            <td>
                              {st.availableNodes.length > 1
                                ? `Program order tie-break (selected ${st.selectedNode})`
                                : 'Sole available candidate'}
                            </td>
                            <td className="font-mono" style={{ fontSize: '0.82rem' }}>
                              {st.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
