import React, { useState } from 'react';
import type { ProgramValidationResult, DAAAnalysisResult, COASimulationResult, NavSection } from '../types';

interface AnalysisTabsCardProps {
  validationResult: ProgramValidationResult | null;
  daaResult: DAAAnalysisResult | null;
  coaResult: COASimulationResult | null;
  onNavigateToSection: (section: NavSection) => void;
}

export const AnalysisTabsCard: React.FC<AnalysisTabsCardProps> = ({
  validationResult,
  daaResult,
  coaResult,
  onNavigateToSection,
}) => {
  const [activeTab, setActiveTab] = useState<'flat' | 'daa' | 'coa'>('flat');

  return (
    <div className="dashboard-card analysis-tabs-card" id="analysis-tabs-card">
      <div className="card-top-bar">
        <span className="card-heading-title">Analysis Tabs</span>
        <div className="segmented-pill-tabs" role="tablist">
          <button
            type="button"
            className={`pill-tab-btn ${activeTab === 'flat' ? 'active' : ''}`}
            onClick={() => setActiveTab('flat')}
            role="tab"
            aria-selected={activeTab === 'flat'}
          >
            FLAT
          </button>
          <button
            type="button"
            className={`pill-tab-btn ${activeTab === 'daa' ? 'active' : ''}`}
            onClick={() => setActiveTab('daa')}
            role="tab"
            aria-selected={activeTab === 'daa'}
          >
            DAA
          </button>
          <button
            type="button"
            className={`pill-tab-btn ${activeTab === 'coa' ? 'active' : ''}`}
            onClick={() => setActiveTab('coa')}
            role="tab"
            aria-selected={activeTab === 'coa'}
          >
            COA
          </button>
        </div>
      </div>

      <div className="tabs-card-body">
        {/* FLAT Tab Content matching screenshot */}
        {activeTab === 'flat' && (
          <div className="tab-detail-pane">
            <div className="tab-pane-hero">
              <div className="hero-icon-circle green-hero-circle" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="hero-text-block">
                <h3 className="hero-title">FLAT Validation</h3>
                <p className="hero-desc">
                  Validates assembly instructions using formal languages and automata theory.
                </p>
              </div>
            </div>

            <ul className="tab-checklist">
              <li className="tab-check-item">
                <span className="check-bullet" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Tokenization</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Grammar validation</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">DFA demonstration</span>
              </li>
            </ul>

            <div className="tab-callout-pill" onClick={() => onNavigateToSection('flat')}>
              <span className="callout-icon-circle" aria-hidden="true">i</span>
              <span className="callout-text">
                {validationResult
                  ? `FLAT Passed: ${validationResult.validCount} valid instruction(s). Click to view tokens and DFA.`
                  : 'Run the analysis to see validation results, tokens and DFA details.'}
              </span>
            </div>
          </div>
        )}

        {/* DAA Tab Content */}
        {activeTab === 'daa' && (
          <div className="tab-detail-pane">
            <div className="tab-pane-hero">
              <div className="hero-icon-circle blue-hero-circle" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div className="hero-text-block">
                <h3 className="hero-title">DAA Dependency Analysis</h3>
                <p className="hero-desc">
                  Identifies data hazards (RAW, WAR, WAW) and generates Kahn topological order.
                </p>
              </div>
            </div>

            <ul className="tab-checklist">
              <li className="tab-check-item">
                <span className="check-bullet bullet-blue" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Read/Write set extraction</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet bullet-blue" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Dependency DAG generation</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet bullet-blue" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Kahn&apos;s topological sort</span>
              </li>
            </ul>

            <div className="tab-callout-pill" onClick={() => onNavigateToSection('daa')}>
              <span className="callout-icon-circle" aria-hidden="true">i</span>
              <span className="callout-text">
                {daaResult
                  ? `DAA Analyzed: ${daaResult.totalDependencies} hazard edge(s). Order: [${daaResult.topologicalSort.order.join(', ')}]`
                  : 'Run analysis to compute dependency DAG and Kahn order.'}
              </span>
            </div>
          </div>
        )}

        {/* COA Tab Content */}
        {activeTab === 'coa' && (
          <div className="tab-detail-pane">
            <div className="tab-pane-hero">
              <div className="hero-icon-circle purple-hero-circle" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                </svg>
              </div>
              <div className="hero-text-block">
                <h3 className="hero-title">COA Pipeline Simulation</h3>
                <p className="hero-desc">
                  Simulates 5-stage RISC pipeline execution with hazard detection and forwarding.
                </p>
              </div>
            </div>

            <ul className="tab-checklist">
              <li className="tab-check-item">
                <span className="check-bullet bullet-purple" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">5-stage RISC timing matrix</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet bullet-purple" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">Hazard detection &amp; stalls</span>
              </li>
              <li className="tab-check-item">
                <span className="check-bullet bullet-purple" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="check-label">CPI &amp; speedup calculation</span>
              </li>
            </ul>

            <div className="tab-callout-pill" onClick={() => onNavigateToSection('coa')}>
              <span className="callout-icon-circle" aria-hidden="true">i</span>
              <span className="callout-text">
                {coaResult
                  ? `COA Simulated: ${coaResult.totalCycles} cycles, ${coaResult.totalStalls} stalls, CPI: ${coaResult.cpi.toFixed(2)}`
                  : 'Run analysis to compute pipeline timing diagram and CPI.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
