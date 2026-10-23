import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../apiConfig';
import type {
  ProgramValidationResult,
  DFADefinition,
  DFATraceResult,
  TokenType,
} from '../types';

interface FlatModuleViewProps {
  code: string;
  onReturnToOverview: () => void;
  onValidate: () => Promise<void>;
  validationResult: ProgramValidationResult | null;
  isValidating: boolean;
  validationError: string | null;
}

export const FlatModuleView: React.FC<FlatModuleViewProps> = ({
  code,
  onReturnToOverview,
  onValidate,
  validationResult,
  isValidating,
  validationError,
}) => {
  // DFA state management
  const [dfaDef, setDfaDef] = useState<DFADefinition | null>(null);
  const [testToken, setTestToken] = useState<string>('R14');
  const [dfaTrace, setDfaTrace] = useState<DFATraceResult | null>(null);
  const [isSimulatingDfa, setIsSimulatingDfa] = useState<boolean>(false);
  const [dfaError, setDfaError] = useState<string | null>(null);

  // Fetch formal DFA definition on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchDfa = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/flat/dfa`);
        if (response.ok && isMounted) {
          const data = await response.json();
          if (data.success) {
            setDfaDef(data.dfa);
          }
        }
      } catch {
        // Fallback or offline state handled gracefully
      }
    };
    fetchDfa();
    return () => {
      isMounted = false;
    };
  }, []);

  // Simulate DFA for candidate token
  const handleSimulateDfa = useCallback(async (tokenCandidate?: string) => {
    const tokenToTest = (tokenCandidate !== undefined ? tokenCandidate : testToken).trim();
    if (!tokenToTest) return;

    setIsSimulatingDfa(true);
    setDfaError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/flat/dfa/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToTest }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDfaTrace(data.trace);
        } else {
          setDfaError(data.error || 'DFA simulation failed');
        }
      } else {
        setDfaError(`Server error (${response.status}) during DFA simulation`);
      }
    } catch {
      setDfaError('Unable to contact backend DFA simulation service');
    } finally {
      setIsSimulatingDfa(false);
    }
  }, [testToken]);

  // Run initial simulation on load
  useEffect(() => {
    let isMounted = true;
    const runInitialSimulation = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/flat/dfa/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'R14' }),
        });
        if (response.ok && isMounted) {
          const data = await response.json();
          if (data.success) {
            setDfaTrace(data.trace);
          }
        }
      } catch {
        // Handled gracefully
      }
    };
    runInitialSimulation();
    return () => {
      isMounted = false;
    };
  }, []);

  // Badge class helper for tokens
  const getTokenBadgeClass = (type: TokenType): string => {
    switch (type) {
      case 'OPCODE':
        return 'token-badge-opcode';
      case 'REGISTER':
        return 'token-badge-register';
      case 'INTEGER':
        return 'token-badge-integer';
      case 'COMMA':
        return 'token-badge-comma';
      case 'COMMENT':
        return 'token-badge-comment';
      case 'INVALID':
        return 'token-badge-invalid';
    }
  };

  return (
    <section className="flat-module-container" aria-label="FLAT Module Engine">
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
          <span className="preview-tag flat-tag">Formal Language &amp; Automata</span>
          <span className="step-badge active-step-badge">Active Engine &bull; Step 3</span>
        </div>
      </div>

      {/* Main Module Card */}
      <div className="flat-main-card">
        <div className="flat-header-intro">
          <h2 className="module-detail-title">FLAT Module: Lexical Tokenization &amp; Grammar Validation</h2>
          <p className="module-detail-summary">
            Formal Languages and Automata Theory provides the foundational mathematics for compilers and assemblers.
            This module decomposes raw assembly text into discrete tokens using deterministic patterns and validates instruction syntax against production rules.
          </p>

          {/* Educational Concepts Callout */}
          <div className="flat-concepts-grid">
            <div className="concept-box">
              <span className="concept-number">1</span>
              <div>
                <strong>Lexical Analysis (Scanner)</strong>
                <p>Scans source lines left-to-right to emit atomic tokens (opcodes, registers, integer literals, commas) with precise column numbers. Time Complexity: <em>O(N)</em>.</p>
              </div>
            </div>
            <div className="concept-box">
              <span className="concept-number">2</span>
              <div>
                <strong>Grammar Production Rules</strong>
                <p>Enforces strict educational grammar for <code>LOAD</code>, <code>MOV</code>, <code>ADD</code>, and <code>SUB</code> with operands constrained to <code>R0–R15</code> and signed integers.</p>
              </div>
            </div>
            <div className="concept-box">
              <span className="concept-number">3</span>
              <div>
                <strong>Deterministic Finite Automaton (DFA)</strong>
                <p>Recognizes the regular language of valid register identifiers <em>L = &#123;R0, ..., R15&#125;</em> with formal state transitions and a trap/rejection state.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Action Bar */}
        <div className="flat-action-bar">
          <div className="flat-action-info">
            <span className="supported-grammar-badge">
              <strong>Grammar:</strong> LOAD &bull; MOV &bull; ADD &bull; SUB &bull; Registers: R0–R15 &bull; Signed Integers
            </span>
          </div>

          <button
            id="run-flat-validate-btn"
            className="run-validate-button"
            onClick={onValidate}
            disabled={isValidating || !code.trim()}
          >
            {isValidating ? (
              <>
                <span className="button-spinner" aria-hidden="true"></span>
                <span>Validating with FLAT...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Validate Assembly (FLAT)</span>
              </>
            )}
          </button>
        </div>

        {/* API Error Alert */}
        {validationError && (
          <div className="validation-alert-box error" role="alert">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <div>
              <strong>Validation API Error:</strong> {validationError}
            </div>
          </div>
        )}

        {/* Validation Results Section */}
        {validationResult && (
          <div className="validation-results-area" id="validation-results-container">
            <div
              className={`validation-status-banner ${
                validationResult.isValid ? 'banner-valid' : 'banner-invalid'
              }`}
            >
              <div className="banner-title-group">
                <span className="banner-icon">
                  {validationResult.isValid ? '✓' : '⚠'}
                </span>
                <div>
                  <h3 className="banner-heading">
                    {validationResult.isValid
                      ? 'Validation Successful: Assembly Matches Grammar'
                      : 'Validation Failed: Syntax or Semantic Errors Detected'}
                  </h3>
                  <p className="banner-subtext">
                    Analyzed {validationResult.instructionCount} instruction line(s) across {validationResult.totalLines} total lines &bull; {validationResult.validCount} valid &bull; {validationResult.errorCount} error(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Line-by-Line Token & Validation Inspector */}
            <div className="line-inspector-table-wrapper">
              <table className="line-inspector-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Line</th>
                    <th style={{ width: '240px' }}>Source Code</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th>Tokens &amp; Lexical Classification</th>
                    <th style={{ width: '300px' }}>Parser Diagnostic / AST</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.lines.map((line) => {
                    if (line.isEmpty) {
                      return (
                        <tr key={line.lineNumber} className="row-empty">
                          <td className="line-cell-num">{line.lineNumber}</td>
                          <td className="line-cell-raw"><em>(empty line)</em></td>
                          <td><span className="status-pill pill-neutral">EMPTY</span></td>
                          <td className="line-cell-tokens"><span className="empty-token-hint">—</span></td>
                          <td className="line-cell-diag"><span className="text-muted">Ignored by scanner</span></td>
                        </tr>
                      );
                    }

                    if (line.isCommentOnly) {
                      return (
                        <tr key={line.lineNumber} className="row-comment">
                          <td className="line-cell-num">{line.lineNumber}</td>
                          <td className="line-cell-raw font-mono text-muted">{line.raw}</td>
                          <td><span className="status-pill pill-neutral">COMMENT</span></td>
                          <td className="line-cell-tokens">
                            <span className="token-badge token-badge-comment">{line.raw.trim()}</span>
                          </td>
                          <td className="line-cell-diag"><span className="text-muted">Comment line</span></td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={line.lineNumber}
                        className={line.isValid ? 'row-valid' : 'row-invalid'}
                      >
                        <td className="line-cell-num">{line.lineNumber}</td>
                        <td className="line-cell-raw font-mono">{line.raw}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              line.isValid ? 'pill-success' : 'pill-error'
                            }`}
                          >
                            {line.isValid ? 'VALID' : 'INVALID'}
                          </span>
                        </td>
                        <td className="line-cell-tokens">
                          <div className="tokens-flex-list">
                            {line.tokens.map((tok, tIdx) => (
                              <span
                                key={tIdx}
                                className={`token-badge ${getTokenBadgeClass(tok.type)}`}
                                title={`Type: ${tok.type} | Col: ${tok.column}`}
                              >
                                <span className="tok-type">{tok.type}:</span>
                                <span className="tok-val">{tok.value}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="line-cell-diag">
                          {line.isValid ? (
                            <div className="ast-tag">
                              <span className="ast-opcode">{line.instruction?.opcode}</span>
                              <span className="ast-dest">&rarr; {line.instruction?.destination}</span>
                              <span className="ast-ops">[{line.instruction?.operands.join(', ')}]</span>
                            </div>
                          ) : (
                            <div className="error-text-callout">
                              <span className="error-icon" aria-hidden="true">✕</span>
                              <span>{line.errorMessage}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            Deterministic Finite Automaton (DFA) Demonstration Section
            ------------------------------------------------------------------ */}
        <div className="dfa-section" id="dfa-demonstration-section">
          <div className="dfa-section-header">
            <div>
              <h3 className="dfa-section-title">Deterministic Finite Automaton (DFA) Demonstration</h3>
              <p className="dfa-section-subtitle">
                Formal state machine recognizing Register Tokens <em>L = &#123;R0, R1, ..., R15&#125;</em>.
              </p>
            </div>
            <span className="dfa-formal-badge">M = (Q, &Sigma;, &delta;, q0, F)</span>
          </div>

          <div className="dfa-disclaimer-box">
            <span className="info-icon" aria-hidden="true">ℹ</span>
            <span>
              <strong>Educational Note:</strong> This DFA strictly recognizes individual <strong>Register Tokens</strong> during the lexical phase. Full instruction validation (operand count, commas, instruction ordering) is subsequently executed by the <strong>Grammar Validator</strong>.
            </span>
          </div>

          {/* Interactive DFA Tester */}
          <div className="dfa-tester-panel">
            <div className="dfa-tester-controls">
              <label htmlFor="dfa-token-input" className="dfa-input-label">
                Test Register Token:
              </label>
              <div className="dfa-input-row">
                <input
                  id="dfa-token-input"
                  type="text"
                  className="dfa-input-field font-mono"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="e.g. R5, R14, R16, X1"
                  maxLength={10}
                />
                <button
                  id="simulate-dfa-btn"
                  className="simulate-button"
                  onClick={() => handleSimulateDfa()}
                  disabled={isSimulatingDfa || !testToken.trim()}
                >
                  {isSimulatingDfa ? 'Simulating...' : 'Trace State Transitions'}
                </button>
              </div>

              {/* Quick Sample Buttons */}
              <div className="quick-samples-row">
                <span className="samples-label">Quick Test Candidates:</span>
                {['R0', 'R5', 'R12', 'R15', 'R16', 'R25', 'X1', 'R1A'].map((sample) => (
                  <button
                    key={sample}
                    className="quick-sample-pill"
                    onClick={() => {
                      setTestToken(sample);
                      handleSimulateDfa(sample);
                    }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* DFA Trace Result Display */}
            {dfaError && (
              <div className="validation-alert-box error" role="alert">
                {dfaError}
              </div>
            )}

            {dfaTrace && (
              <div className="dfa-trace-display">
                <div className="trace-summary-header">
                  <div className="trace-status-group">
                    <span
                      className={`trace-badge ${
                        dfaTrace.isAccepted ? 'trace-accepted' : 'trace-rejected'
                      }`}
                    >
                      {dfaTrace.isAccepted ? '✓ ACCEPTED' : '✕ REJECTED'}
                    </span>
                    <span className="trace-final-state">
                      Final State: <code>{dfaTrace.finalState}</code>
                    </span>
                  </div>
                  <span className="trace-explanation">{dfaTrace.explanation}</span>
                </div>

                {/* Transition Path Visualization */}
                <div className="trace-path-flow">
                  <div className="path-label">State Path:</div>
                  <div className="path-chain">
                    {dfaTrace.path.map((state, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={`path-node ${
                            state === 'q_trap'
                              ? 'node-trap'
                              : dfaDef?.acceptingStates.includes(state)
                              ? 'node-accepting'
                              : 'node-regular'
                          }`}
                        >
                          {state}
                          {dfaDef?.acceptingStates.includes(state) && state !== 'q_trap' && (
                            <span className="double-ring-indicator">&bull;</span>
                          )}
                        </div>
                        {idx < dfaTrace.path.length - 1 && (
                          <div className="path-arrow">
                            <span className="arrow-char">
                              &lsquo;{dfaTrace.steps[idx]?.inputChar}&rsquo;
                            </span>
                            <span className="arrow-sym">&rarr;</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Transition Table */}
                <div className="trace-steps-table-wrapper">
                  <table className="trace-steps-table">
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Input Character</th>
                        <th>From State</th>
                        <th>Transition &delta;</th>
                        <th>To State</th>
                        <th>State Class</th>
                        <th>Automaton Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dfaTrace.steps.map((st) => (
                        <tr key={st.step}>
                          <td>{st.step}</td>
                          <td className="font-mono"><strong>'{st.inputChar}'</strong></td>
                          <td className="font-mono">{st.fromState}</td>
                          <td className="font-mono">&delta;({st.fromState}, '{st.inputChar}')</td>
                          <td className="font-mono"><strong>{st.toState}</strong></td>
                          <td>
                            {st.toState === 'q_trap' ? (
                              <span className="state-badge badge-trap">Trap / Dead</span>
                            ) : st.isAccepting ? (
                              <span className="state-badge badge-accepting">Accepting</span>
                            ) : (
                              <span className="state-badge badge-intermediate">Intermediate</span>
                            )}
                          </td>
                          <td className="step-note">{st.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Formal States & Transition Reference Table */}
          {dfaDef && (
            <div className="dfa-formal-reference">
              <h4 className="reference-title">Formal Transition Table &delta;(q, a)</h4>
              <div className="reference-table-wrapper">
                <table className="reference-table">
                  <thead>
                    <tr>
                      <th>Source State</th>
                      <th>Input Symbol Class</th>
                      <th>Target State</th>
                      <th>Formal Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dfaDef.transitions.map((tr, idx) => (
                      <tr key={idx}>
                        <td className="font-mono"><strong>{tr.fromState}</strong></td>
                        <td className="font-mono">{tr.symbol}</td>
                        <td className="font-mono"><strong>{tr.toState}</strong></td>
                        <td>{tr.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
