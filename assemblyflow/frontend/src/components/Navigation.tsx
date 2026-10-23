import React from 'react';
import type { NavSection } from '../types';

interface NavigationProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'flat',
      label: 'FLAT',
      subtitle: 'Validation & DFA',
      icon: (
        <div className="nav-icon-badge nav-badge-flat">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
      ),
    },
    {
      id: 'daa',
      label: 'DAA',
      subtitle: 'Dependency Analysis',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      ),
    },
    {
      id: 'coa',
      label: 'COA',
      subtitle: 'Pipeline Simulation',
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      <nav className="sidebar-nav-container">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li key={item.id} className="sidebar-nav-item">
                <button
                  id={`nav-${item.id}`}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-btn-icon">{item.icon}</span>
                  <div className="sidebar-btn-content">
                    <span className="sidebar-btn-label">{item.label}</span>
                    {item.subtitle && (
                      <span className="sidebar-btn-subtitle">{item.subtitle}</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Bottom Landscape Illustration & Branding Tagline */}
      <div className="sidebar-footer-artwork">
        <svg
          className="sidebar-mountains-svg"
          viewBox="0 0 240 180"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle mist gradient background */}
          <linearGradient id="mistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dce8e0" stopOpacity="0" />
            <stop offset="60%" stopColor="#d2e3d8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c5dbcd" stopOpacity="0.8" />
          </linearGradient>
          <rect width="240" height="180" fill="url(#mistGrad)" />

          {/* Far distant mountain range */}
          <path
            d="M-20 115 Q40 85 90 102 T180 90 T260 110 L260 180 L-20 180 Z"
            fill="#bed8c8"
            opacity="0.55"
          />

          {/* Mid-distance mountain ridge */}
          <path
            d="M-20 130 Q30 108 80 120 T170 110 T260 125 L260 180 L-20 180 Z"
            fill="#a8cbb4"
            opacity="0.65"
          />

          {/* Foreground mountain ridge */}
          <path
            d="M-20 145 Q50 128 110 138 T200 132 T260 148 L260 180 L-20 180 Z"
            fill="#8ebda0"
            opacity="0.75"
          />

          {/* Pine trees row on foreground hills */}
          <g fill="#6d9e80" opacity="0.6">
            <polygon points="15,160 18,148 21,160" />
            <polygon points="26,162 30,147 34,162" />
            <polygon points="38,160 42,149 46,160" />
            <polygon points="58,164 62,148 66,164" />
            <polygon points="72,165 76,151 80,165" />
            <polygon points="105,163 110,146 115,163" />
            <polygon points="120,165 124,152 128,165" />
            <polygon points="145,163 150,147 155,163" />
            <polygon points="165,166 170,150 175,166" />
            <polygon points="190,165 195,149 200,165" />
            <polygon points="215,168 220,153 225,168" />
          </g>
        </svg>

        <div className="sidebar-tagline">
          <span>Better</span>
          <span>Assembly Code,</span>
          <span>Better Insights</span>
        </div>
      </div>
    </aside>
  );
};

