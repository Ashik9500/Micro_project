import React from 'react';
import type { NavSection, ProgramValidationResult, DAAAnalysisResult, COASimulationResult } from '../types';

interface AnalysisPreviewProps {
  onNavigateToSection: (section: NavSection) => void;
  onSelectQuickStart?: (code: string) => void;
  validationResult?: ProgramValidationResult | null;
  daaResult?: DAAAnalysisResult | null;
  coaResult?: COASimulationResult | null;
}

export const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({
  onNavigateToSection,
  onSelectQuickStart,
  validationResult,
  daaResult,
  coaResult,
}) => {
  return (
    <section className="dashboard-bottom-grid" aria-label="Analysis Previews and Pipeline Overview">
      {/* Bottom Card 1: Analysis Preview */}
      <div className="dashboard-card preview-summary-card" id="analysis-preview-card">
        <div className="card-top-bar">
          <div className="preview-header-group">
            <span className="card-heading-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <div>
              <h3 className="card-heading-title">Analysis Preview</h3>
              <p className="card-sub-description">
                Results will appear here after running the complete analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="preview-items-list">
          {/* Row 1: FLAT */}
          <div
            className="preview-module-row"
            onClick={() => onNavigateToSection('flat')}
            role="button"
            tabIndex={0}
            title="Inspect FLAT module"
          >
            <div className="module-icon-box box-green" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="module-meta-info">
              <span className="module-name-title">FLAT</span>
              <span className="module-detail-text">Instruction validation and tokenization</span>
            </div>
            <div className="module-status-badge">
              <span className={`badge-pill ${validationResult?.isValid ? 'badge-passed' : 'badge-pending'}`}>
                {validationResult?.isValid ? 'Passed' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Row 2: DAA */}
          <div
            className="preview-module-row"
            onClick={() => onNavigateToSection('daa')}
            role="button"
            tabIndex={0}
            title="Inspect DAA module"
          >
            <div className="module-icon-box box-blue" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div className="module-meta-info">
              <span className="module-name-title">DAA</span>
              <span className="module-detail-text">Dependency graph and topological order</span>
            </div>
            <div className="module-status-badge">
              <span className={`badge-pill ${daaResult ? 'badge-passed' : 'badge-pending'}`}>
                {daaResult ? 'Passed' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Row 3: COA */}
          <div
            className="preview-module-row"
            onClick={() => onNavigateToSection('coa')}
            role="button"
            tabIndex={0}
            title="Inspect COA module"
          >
            <div className="module-icon-box box-purple" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
              </svg>
            </div>
            <div className="module-meta-info">
              <span className="module-name-title">COA</span>
              <span className="module-detail-text">Pipeline simulation and performance metrics</span>
            </div>
            <div className="module-status-badge">
              <span className={`badge-pill ${coaResult ? 'badge-passed' : 'badge-pending'}`}>
                {coaResult ? 'Passed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card 2: Quick Start */}
      <div className="dashboard-card quick-start-card" id="quick-start-card">
        <div className="card-top-bar">
          <div className="preview-header-group">
            <span className="card-heading-icon icon-lightning" aria-hidden="true">⚡</span>
            <div>
              <h3 className="card-heading-title">Quick Start</h3>
              <p className="card-sub-description">Try these example programs:</p>
            </div>
          </div>
        </div>

        <div className="quick-start-list">
          {/* Example 1: Simple Program */}
          <div
            className="quick-snippet-card"
            onClick={() => onSelectQuickStart && onSelectQuickStart('LOAD R1, 10')}
            role="button"
            tabIndex={0}
            title="Load Simple Program"
          >
            <div className="snippet-text-content">
              <div className="snippet-title">Simple Program</div>
              <div className="snippet-code-sample">
                <span className="code-op">LOAD</span> <span className="code-reg">R1</span>, <span className="code-num">10</span>
              </div>
            </div>
            <span className="snippet-chevron" aria-hidden="true">&rsaquo;</span>
          </div>

          {/* Example 2: With Dependencies */}
          <div
            className="quick-snippet-card"
            onClick={() =>
              onSelectQuickStart &&
              onSelectQuickStart('LOAD R1, 10\nADD R2, R1, R3')
            }
            role="button"
            tabIndex={0}
            title="Load Program with Dependencies"
          >
            <div className="snippet-text-content">
              <div className="snippet-title">With Dependencies</div>
              <div className="snippet-code-sample">
                <div><span className="code-op">LOAD</span> <span className="code-reg">R1</span>, <span className="code-num">10</span></div>
                <div><span className="code-op">ADD</span> <span className="code-reg">R2</span>, <span className="code-reg">R1</span>, <span className="code-reg">R3</span></div>
              </div>
            </div>
            <span className="snippet-chevron" aria-hidden="true">&rsaquo;</span>
          </div>

          {/* Example 3: With Hazards */}
          <div
            className="quick-snippet-card"
            onClick={() =>
              onSelectQuickStart &&
              onSelectQuickStart('LOAD R1, 10\nADD R2, R1, R3\nSUB R4, R2, R5')
            }
            role="button"
            tabIndex={0}
            title="Load Program with Hazards"
          >
            <div className="snippet-text-content">
              <div className="snippet-title">With Hazards</div>
              <div className="snippet-code-sample">
                <div><span className="code-op">LOAD</span> <span className="code-reg">R1</span>, <span className="code-num">10</span></div>
                <div><span className="code-op">ADD</span> <span className="code-reg">R2</span>, <span className="code-reg">R1</span>, <span className="code-reg">R3</span></div>
                <div><span className="code-op">SUB</span> <span className="code-reg">R4</span>, <span className="code-reg">R2</span>, <span className="code-reg">R5</span></div>
              </div>
            </div>
            <span className="snippet-chevron" aria-hidden="true">&rsaquo;</span>
          </div>
        </div>
      </div>

      {/* Bottom Card 3: Pipeline Overview (COA) */}
      <div className="dashboard-card pipeline-overview-card" id="pipeline-overview-card">
        <div className="card-top-bar">
          <div className="preview-header-group">
            <span className="card-heading-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </span>
            <div>
              <h3 className="card-heading-title">Pipeline Overview (COA)</h3>
              <p className="card-sub-description">
                Five-stage pipeline simulation with hazard detection.
              </p>
            </div>
          </div>
        </div>

        <div className="pipeline-diagram-container">
          <div className="five-stage-flex-row">
            {/* IF */}
            <div className="stage-diagram-box stage-box-if">
              <div className="box-stage-name">IF</div>
              <div className="box-stage-sub">Instruction Fetch</div>
            </div>

            <span className="stage-diagram-arrow" aria-hidden="true">&rarr;</span>

            {/* ID */}
            <div className="stage-diagram-box stage-box-id">
              <div className="box-stage-name">ID</div>
              <div className="box-stage-sub">Decode &amp; Read Registers</div>
            </div>

            <span className="stage-diagram-arrow" aria-hidden="true">&rarr;</span>

            {/* EX */}
            <div className="stage-diagram-box stage-box-ex">
              <div className="box-stage-name">EX</div>
              <div className="box-stage-sub">Execute</div>
            </div>

            <span className="stage-diagram-arrow" aria-hidden="true">&rarr;</span>

            {/* MEM */}
            <div className="stage-diagram-box stage-box-mem">
              <div className="box-stage-name">MEM</div>
              <div className="box-stage-sub">Memory Access</div>
            </div>

            <span className="stage-diagram-arrow" aria-hidden="true">&rarr;</span>

            {/* WB */}
            <div className="stage-diagram-box stage-box-wb">
              <div className="box-stage-name">WB</div>
              <div className="box-stage-sub">Write Back</div>
            </div>
          </div>

          {/* Info callout at bottom of pipeline card */}
          <div className="pipeline-callout-pill" onClick={() => onNavigateToSection('coa')}>
            <span className="callout-icon-circle blue-circle" aria-hidden="true">i</span>
            <div className="pipeline-callout-text">
              <span className="callout-strong-title">
                {coaResult ? 'Live Simulation Active' : 'Coming in later steps'}
              </span>
              <span className="callout-sub-msg">
                {coaResult
                  ? `Simulation finished in ${coaResult.totalCycles} cycles (${coaResult.totalStalls} stalls). Click to inspect timing grid.`
                  : 'The COA module will show a cycle-by-cycle pipeline view, hazards, stalls and performance metrics after analysis.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

