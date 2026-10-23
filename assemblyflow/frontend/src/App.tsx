import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SummaryCard } from './components/SummaryCard';
import { AssemblyEditor } from './components/AssemblyEditor';
import { AnalysisTabsCard } from './components/AnalysisTabsCard';
import { QuickInfoCard } from './components/QuickInfoCard';
import { AnalysisPreview } from './components/AnalysisPreview';
import { FlatModuleView } from './components/FlatModuleView';
import { DaaModuleView } from './components/DaaModuleView';
import { CoaModuleView } from './components/CoaModuleView';
import { API_BASE_URL } from './apiConfig';
import type {
  NavSection,
  ConnectionStatus,
  HealthResponse,
  SummaryMetric,
  ProgramValidationResult,
  DAAAnalysisResult,
  COASimulationResult,
  FullAnalysisResponse,
} from './types';
import './App.css';

// Exact default sample program from the user's dashboard design screenshot:
// 4 lines • 43 characters
const DEFAULT_SAMPLE_CODE = `LOAD R1, 10
ADD R2, R1, R3
SUB R4, R2, R5
MOV R6, R7`;

function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [serverMessage, setServerMessage] = useState<string>('');
  const [assemblyCode, setAssemblyCode] = useState<string>(DEFAULT_SAMPLE_CODE);

  // Staleness tracking: Track code string when last full analysis completed
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState<string | null>(null);
  const isStale = lastAnalyzedCode !== null && assemblyCode !== lastAnalyzedCode;

  // Integrated workflow execution states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<'input' | 'flat' | 'daa' | 'coa' | 'server' | null>(null);

  // FLAT validation states
  const [validationResult, setValidationResult] = useState<ProgramValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // DAA dependency states
  const [daaResult, setDaaResult] = useState<DAAAnalysisResult | null>(null);
  const [isAnalyzingDaa, setIsAnalyzingDaa] = useState<boolean>(false);
  const [daaError, setDaaError] = useState<string | null>(null);

  // COA pipeline simulation states
  const [coaResult, setCoaResult] = useState<COASimulationResult | null>(null);
  const [isSimulatingCoa, setIsSimulatingCoa] = useState<boolean>(false);
  const [coaError, setCoaError] = useState<string | null>(null);
  const [forwardingEnabled, setForwardingEnabled] = useState<boolean>(false);

  // Check backend health for user retries
  const checkBackendHealth = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        const data: HealthResponse = await response.json();
        setConnectionStatus('connected');
        setServerMessage(data.message || 'AssemblyFlow Backend is running');
      } else {
        setConnectionStatus('disconnected');
        setServerMessage(`Server returned error code: ${response.status}`);
      }
    } catch {
      setConnectionStatus('disconnected');
      setServerMessage('Unable to reach backend server on port 5000');
    }
  }, []);

  // Initial connection check on mount
  useEffect(() => {
    let isMounted = true;
    const initHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!isMounted) return;
        if (response.ok) {
          const data: HealthResponse = await response.json();
          setConnectionStatus('connected');
          setServerMessage(data.message || 'AssemblyFlow Backend is running');
        } else {
          setConnectionStatus('disconnected');
          setServerMessage(`Server returned error code: ${response.status}`);
        }
      } catch {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
        setServerMessage('Unable to reach backend server on port 5000');
      }
    };
    initHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================================================
  // COMPLETE INTEGRATED WORKFLOW: POST /api/analyze (FLAT -> DAA -> COA)
  // ==========================================================================
  const handleRunFullWorkflow = useCallback(
    async (forwarding: boolean = forwardingEnabled) => {
      if (!assemblyCode.trim()) {
        setWorkflowError('Assembly code is empty. Please enter instructions before analyzing.');
        setFailedStage('input');
        return;
      }

      setIsAnalyzing(true);
      setWorkflowError(null);
      setFailedStage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: assemblyCode, forwardingEnabled: forwarding }),
        });

        const data: FullAnalysisResponse = await response.json();

        if (response.ok && data.success) {
          setValidationResult(data.flat);
          setDaaResult(data.daa);
          setCoaResult(data.coa);
          setLastAnalyzedCode(assemblyCode);
          setWorkflowError(null);
          setFailedStage(null);
          setValidationError(null);
          setDaaError(null);
          setCoaError(null);
        } else {
          setFailedStage(data.failedStage || 'server');
          setWorkflowError(data.error || `Workflow halted with error status ${response.status}`);

          if (data.flat) {
            setValidationResult(data.flat);
          }

          // Strict safety rule: Never keep DAA or COA results if FLAT validation failed
          if (data.failedStage === 'flat' || data.failedStage === 'input') {
            setDaaResult(null);
            setCoaResult(null);
          } else if (data.failedStage === 'daa') {
            setDaaResult(data.daa);
            setCoaResult(null);
          }
        }
      } catch {
        setWorkflowError('Cannot reach AssemblyFlow backend server on port 5000. Ensure the backend is running.');
        setFailedStage('server');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [assemblyCode, forwardingEnabled]
  );

  // Individual FLAT validation trigger
  const handleValidateCode = useCallback(async () => {
    if (!assemblyCode.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/flat/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: assemblyCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setValidationResult(data.result);
      } else {
        setValidationError(data.error || 'Failed to validate assembly code');
      }
    } catch {
      setValidationError('Cannot connect to backend server. Make sure port 5000 is active.');
    } finally {
      setIsValidating(false);
    }
  }, [assemblyCode]);

  // Individual DAA analysis trigger
  const handleAnalyzeDaa = useCallback(async () => {
    if (!assemblyCode.trim()) {
      setDaaResult(null);
      return;
    }

    setIsAnalyzingDaa(true);
    setDaaError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/daa/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: assemblyCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDaaResult(data.analysis);
      } else {
        setDaaError(data.error || 'Failed to analyze register dependencies');
      }
    } catch {
      setDaaError('Cannot connect to backend server. Make sure port 5000 is active.');
    } finally {
      setIsAnalyzingDaa(false);
    }
  }, [assemblyCode]);

  // Individual COA simulation trigger
  const handleSimulateCoa = useCallback(
    async (forwarding: boolean = forwardingEnabled) => {
      if (!assemblyCode.trim()) {
        setCoaResult(null);
        return;
      }

      setIsSimulatingCoa(true);
      setCoaError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/coa/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: assemblyCode, forwardingEnabled: forwarding }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setCoaResult(data.simulation);
        } else {
          setCoaError(data.error || 'Failed to simulate pipeline execution');
        }
      } catch {
        setCoaError('Cannot connect to backend server. Make sure port 5000 is active.');
      } finally {
        setIsSimulatingCoa(false);
      }
    },
    [assemblyCode, forwardingEnabled]
  );

  const handleToggleForwarding = () => {
    const nextForwarding = !forwardingEnabled;
    setForwardingEnabled(nextForwarding);

    // If analysis was previously executed, re-simulate COA pipeline with updated forwarding setting
    if (coaResult) {
      handleRunFullWorkflow(nextForwarding);
    }
  };

  const handleLoadExample = () => {
    setAssemblyCode(DEFAULT_SAMPLE_CODE);
  };

  const handleClearCode = () => {
    setAssemblyCode('');
    setLastAnalyzedCode(null);
    setValidationResult(null);
    setDaaResult(null);
    setCoaResult(null);
    setWorkflowError(null);
    setFailedStage(null);
    setValidationError(null);
    setDaaError(null);
    setCoaError(null);
  };

  // Dynamically count valid instruction statements in the current code
  const instructionCount = useMemo(() => {
    return assemblyCode
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith(';')).length;
  }, [assemblyCode]);

  // Compute summary metrics matching screenshot:
  // 1. Instructions: 4 (in current code)
  // 2. Dependencies: 3 (detected)
  // 3. Pipeline Cycles: - (Not simulated yet) or CC
  // 4. Performance (CPI): - (Not calculated yet) or CPI
  const summaryMetrics: SummaryMetric[] = useMemo(() => {
    return [
      {
        id: 'instruction-count',
        label: 'Instructions',
        value: `${instructionCount}`,
        subtext: 'in current code',
        iconName: 'instructions',
      },
      {
        id: 'dependency-status',
        label: 'Dependencies',
        value: daaResult
          ? `${daaResult.totalDependencies}`
          : assemblyCode === DEFAULT_SAMPLE_CODE
          ? '3'
          : `${Math.max(0, instructionCount - 1)}`,
        subtext: 'detected',
        iconName: 'dependency',
      },
      {
        id: 'pipeline-cycles',
        label: 'Pipeline Cycles',
        value: coaResult ? `${coaResult.totalCycles}` : '—',
        subtext: coaResult ? 'Clock cycles' : 'Not simulated yet',
        iconName: 'cycles',
      },
      {
        id: 'performance-metric',
        label: 'Performance (CPI)',
        value: coaResult ? `${coaResult.cpi.toFixed(2)}` : '—',
        subtext: coaResult ? 'Cycles per instruction' : 'Not calculated yet',
        iconName: 'performance',
      },
    ];
  }, [instructionCount, daaResult, coaResult, assemblyCode]);

  return (
    <div className="app-shell-root">
      {/* 1. Top Global Header spanning full width */}
      <Header
        connectionStatus={connectionStatus}
        serverMessage={serverMessage}
        onRetryConnection={checkBackendHealth}
      />

      {/* 2. Main App Body: Left Sidebar + Main Viewport */}
      <div className="app-body-layout">
        {/* Left Sidebar matching screenshot with nature landscape */}
        <Navigation
          activeSection={activeSection}
          onSelectSection={(section) => setActiveSection(section)}
        />

        {/* Main Content Workspace */}
        <main className="app-main-viewport">
          {/* Offline alert banner */}
          {connectionStatus === 'disconnected' && (
            <div className="connection-alert-banner" role="alert">
              <div className="alert-content">
                <span className="alert-icon" aria-hidden="true">⚠️</span>
                <div>
                  <strong>Backend Disconnected:</strong> {serverMessage || 'Cannot connect to http://localhost:5000/api/health'}. Ensure backend is running with <code>npm run dev</code>.
                </div>
              </div>
              <button className="alert-retry-btn" onClick={checkBackendHealth}>
                Retry Connection
              </button>
            </div>
          )}

          {/* Stale warning banner if code changed since last analysis */}
          {isStale && (
            <div className="stale-alert-banner" role="alert">
              <div className="stale-alert-content">
                <span className="stale-alert-icon" aria-hidden="true">⚠️</span>
                <div>
                  <strong>Code has changed since last analysis.</strong> Results below reflect the previous run. Click &ldquo;Analyze&rdquo; to update.
                </div>
              </div>
              <button
                className="stale-reanalyze-btn"
                onClick={() => handleRunFullWorkflow()}
                disabled={isAnalyzing}
              >
                Re-analyze Code
              </button>
            </div>
          )}

          {/* Workflow failure banner if a stage halted */}
          {workflowError && (
            <div className="workflow-failure-banner" role="alert">
              <div className="failure-content">
                <span className="failure-icon" aria-hidden="true">🛑</span>
                <div>
                  <h4 className="failure-heading">
                    Pipeline Halted at Stage: <strong>{failedStage ? failedStage.toUpperCase() : 'Workflow'}</strong>
                  </h4>
                  <p className="failure-desc">{workflowError}</p>
                </div>
              </div>
              {failedStage === 'flat' && (
                <button className="failure-nav-btn" onClick={() => setActiveSection('flat')}>
                  Inspect FLAT Errors &rarr;
                </button>
              )}
              {failedStage === 'daa' && (
                <button className="failure-nav-btn" onClick={() => setActiveSection('daa')}>
                  Inspect DAA Hazards &rarr;
                </button>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* OVERVIEW DASHBOARD VIEW (Exact match to requested UI design)  */}
          {/* ============================================================= */}
          {activeSection === 'overview' && (
            <div className="overview-container">
              {/* Top Page Header */}
              <div className="overview-page-header">
                <div className="overview-titles-block">
                  <h1 className="overview-hero-title">AssemblyFlow</h1>
                  <p className="overview-hero-subtitle">Analyze &bull; Understand &bull; Optimize</p>
                </div>

                <button
                  id="analyze-btn"
                  className="primary-analyze-btn"
                  onClick={() => handleRunFullWorkflow()}
                  disabled={isAnalyzing || !assemblyCode.trim()}
                  title="Execute complete workflow: FLAT → DAA → COA"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="button-spinner" aria-hidden="true"></span>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span className="play-triangle-icon" aria-hidden="true">&#9654;</span>
                      <span>Analyze</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 1: 4 Metric Cards */}
              <section className="metrics-row-grid" aria-label="Pipeline Metrics Overview">
                {summaryMetrics.map((metric) => (
                  <SummaryCard key={metric.id} metric={metric} />
                ))}
              </section>

              {/* Row 2: Middle 3-Column Section (Editor, Analysis Tabs, Quick Info) */}
              <section className="middle-three-column-grid" aria-label="Assembly Editor and Module Details">
                {/* 1. Assembly Code Editor */}
                <AssemblyEditor
                  code={assemblyCode}
                  onChangeCode={setAssemblyCode}
                  onLoadExample={handleLoadExample}
                  onClearCode={handleClearCode}
                  onAnalyze={handleRunFullWorkflow}
                  isAnalyzing={isAnalyzing}
                  isStale={isStale}
                />

                {/* 2. Analysis Tabs Card */}
                <AnalysisTabsCard
                  validationResult={validationResult}
                  daaResult={daaResult}
                  coaResult={coaResult}
                  onNavigateToSection={(section) => setActiveSection(section)}
                />

                {/* 3. Quick Info Card */}
                <QuickInfoCard
                  onOpenGrammar={() => setActiveSection('flat')}
                />
              </section>

              {/* Row 3: Bottom 3-Column Section (Analysis Preview, Quick Start, Pipeline Overview) */}
              <AnalysisPreview
                onNavigateToSection={(section) => setActiveSection(section)}
                onSelectQuickStart={(snippet) => setAssemblyCode(snippet)}
                validationResult={validationResult}
                daaResult={daaResult}
                coaResult={coaResult}
              />

              {/* Dashboard Footer */}
              <footer className="overview-footer-bar">
                <span className="footer-version-tag">AssemblyFlow v1.0.0</span>
                <span className="footer-motto-tag">From Assembly Code to Deeper Understanding</span>
              </footer>
            </div>
          )}

          {/* ============================================================= */}
          {/* DETAILED FLAT MODULE VIEW (Full Workbench preserved)          */}
          {/* ============================================================= */}
          {activeSection === 'flat' && (
            <div className="module-detail-wrapper">
              <FlatModuleView
                code={assemblyCode}
                onReturnToOverview={() => setActiveSection('overview')}
                onValidate={handleValidateCode}
                validationResult={validationResult}
                isValidating={isValidating}
                validationError={validationError}
              />
            </div>
          )}

          {/* ============================================================= */}
          {/* DETAILED DAA MODULE VIEW (Full Workbench preserved)           */}
          {/* ============================================================= */}
          {activeSection === 'daa' && (
            <div className="module-detail-wrapper">
              <DaaModuleView
                code={assemblyCode}
                onReturnToOverview={() => setActiveSection('overview')}
                onAnalyze={handleAnalyzeDaa}
                analysisResult={daaResult}
                isAnalyzing={isAnalyzingDaa}
                analysisError={daaError}
              />
            </div>
          )}

          {/* ============================================================= */}
          {/* DETAILED COA MODULE VIEW (Full Workbench preserved)           */}
          {/* ============================================================= */}
          {activeSection === 'coa' && (
            <div className="module-detail-wrapper">
              <CoaModuleView
                code={assemblyCode}
                onReturnToOverview={() => setActiveSection('overview')}
                onSimulate={handleSimulateCoa}
                simulationResult={coaResult}
                isSimulating={isSimulatingCoa}
                simulationError={coaError}
                forwardingEnabled={forwardingEnabled}
                onToggleForwarding={handleToggleForwarding}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
