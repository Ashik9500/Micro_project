import React from 'react';
import type { ConnectionStatus } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  serverMessage: string;
  onRetryConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  serverMessage,
  onRetryConnection,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo" aria-hidden="true">
          {/* Circuit / CPU Processor Chip Icon matching screenshot */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="7" y="7" width="18" height="18" rx="3.5" />
            <rect x="12" y="12" width="8" height="8" rx="1.5" />
            <path d="M12 2v5" />
            <path d="M20 2v5" />
            <path d="M12 25v5" />
            <path d="M20 25v5" />
            <path d="M25 12h5" />
            <path d="M25 20h5" />
            <path d="M2 12h5" />
            <path d="M2 20h5" />
          </svg>
        </div>
        <div className="brand-text">
          <h1 className="brand-title" id="app-title">AssemblyFlow</h1>
          <p className="brand-subtitle" id="app-subtitle">
            Automated Assembly Code Normalizer &amp; Pipelined Execution Analyzer
          </p>
        </div>
      </div>

      <div className="header-status-area">
        {/* Backend Connected Indicator with green dot */}
        <div
          id="connection-status"
          className={`backend-status-pill ${connectionStatus}`}
          onClick={onRetryConnection}
          title={serverMessage || `Backend is ${connectionStatus} (Click to refresh)`}
          role="button"
          tabIndex={0}
        >
          <span className="status-indicator-dot"></span>
          <span className="status-text">
            {connectionStatus === 'connected' && 'Backend Connected'}
            {connectionStatus === 'disconnected' && 'Backend Disconnected'}
            {connectionStatus === 'checking' && 'Backend Checking...'}
          </span>
        </div>

        {/* Cloud Sync Icon */}
        <div className="header-icon-btn" title="Cloud sync status" aria-hidden="true">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        </div>

        {/* Divider */}
        <div className="header-divider" aria-hidden="true"></div>

        {/* User Avatar Circle 'A' */}
        <div className="header-user-avatar" title="AssemblyFlow User">
          <span>A</span>
        </div>
      </div>
    </header>
  );
};

