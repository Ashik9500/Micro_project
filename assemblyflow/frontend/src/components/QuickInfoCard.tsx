import React from 'react';

interface QuickInfoCardProps {
  onOpenGrammar?: () => void;
}

export const QuickInfoCard: React.FC<QuickInfoCardProps> = ({ onOpenGrammar }) => {
  return (
    <div className="dashboard-card quick-info-card" id="quick-info-card">
      <div className="card-top-bar">
        <div className="quick-info-header">
          <span className="lightbulb-icon" aria-hidden="true">💡</span>
          <span className="card-heading-title">Quick Info</span>
        </div>
      </div>

      <div className="quick-info-body">
        {/* Item 1: Supported Instructions */}
        <div className="quick-info-row">
          <div className="info-icon-badge badge-green" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="info-row-text">
            <span className="info-row-title">Supported Instructions</span>
            <span className="info-row-value">LOAD, MOV, ADD, SUB</span>
          </div>
        </div>

        {/* Item 2: Registers */}
        <div className="quick-info-row">
          <div className="info-icon-badge badge-teal" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="7" rx="1.5" />
              <rect x="2" y="13" width="20" height="7" rx="1.5" />
              <line x1="6" y1="7.5" x2="6.01" y2="7.5" />
              <line x1="6" y1="16.5" x2="6.01" y2="16.5" />
            </svg>
          </div>
          <div className="info-row-text">
            <span className="info-row-title">Registers</span>
            <span className="info-row-value">R0 &ndash; R15</span>
          </div>
        </div>

        {/* Item 3: Integer Literals */}
        <div className="quick-info-row">
          <div className="info-icon-badge badge-dark" aria-hidden="true">
            <span className="info-letter-icon">i</span>
          </div>
          <div className="info-row-text">
            <span className="info-row-title">Integer Literals</span>
            <span className="info-row-value">Signed integers (e.g., <code className="inline-code-blue">10</code>, <code className="inline-code-blue">-5</code>)</span>
          </div>
        </div>

        {/* Item 4: Grammar */}
        <div className="quick-info-row clickable-row" onClick={onOpenGrammar}>
          <div className="info-icon-badge badge-green" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="info-row-text">
            <span className="info-row-title">Grammar</span>
            <span className="info-row-value grammar-link-text">See FLAT module for details</span>
          </div>
        </div>
      </div>
    </div>
  );
};
