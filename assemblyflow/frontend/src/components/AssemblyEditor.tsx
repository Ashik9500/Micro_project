import React, { useRef } from 'react';

interface AssemblyEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onLoadExample: () => void;
  onClearCode: () => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  isStale?: boolean;
}

export const AssemblyEditor: React.FC<AssemblyEditorProps> = ({
  code,
  onChangeCode,
  onLoadExample,
  onClearCode,
  onAnalyze,
  isAnalyzing = false,
  isStale = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Split code into lines to compute line numbers
  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);
  const charCount = code.length;

  // Synchronize vertical scroll between line numbers gutter and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run analysis
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && code.trim() && onAnalyze) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="dashboard-editor-card" aria-label="Assembly Code Input">
      <div className="card-top-bar">
        <div className="editor-card-title-group">
          <span className="editor-card-icon" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span className="editor-card-heading">Assembly Code Editor</span>
        </div>

        <div className="editor-card-actions">
          <button
            id="load-example-btn"
            type="button"
            className="editor-pill-btn"
            onClick={onLoadExample}
            title="Load sample assembly program"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <polyline points="9 14 12 11 15 14" />
            </svg>
            <span>Load Example</span>
          </button>

          <button
            id="clear-code-btn"
            type="button"
            className="editor-pill-btn"
            onClick={onClearCode}
            disabled={!code}
            title="Clear editor contents"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="dark-code-workspace">
        <div className="dark-gutter" ref={lineNumbersRef} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i + 1} className="dark-line-num">
              {i + 1}
            </span>
          ))}
        </div>

        <textarea
          id="assembly-input"
          ref={textareaRef}
          className="dark-editor-textarea"
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="; Enter assembly instructions here (e.g. LOAD R1, 10 or ADD R2, R1, R3)..."
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Assembly code editor"
        />
      </div>

      <div className="dark-editor-footer">
        <span className="footer-meta">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} &bull; {charCount} characters
        </span>
        <span className={`footer-status ${isStale ? 'status-stale' : 'status-ready'}`}>
          {isAnalyzing ? 'Analyzing...' : isStale ? 'Modified' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

