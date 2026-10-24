import React from 'react';
import { Shield, Play, Pause, Flame } from 'lucide-react';

export type ActiveTab = 'search' | 'overview' | 'incidents' | 'simulator' | 'practice';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  incidentCount: number;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onQuickSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  incidentCount,
  isStreaming,
  onToggleStreaming,
  onQuickSimulate
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#090d18] sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <Shield className="h-5 w-5 text-emerald-400" />
        <span className="text-base font-bold tracking-tight text-slate-100">
          SIEM Enterprise SOC
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('search')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'search' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Search &amp; SPL
        </button>
        <button
          onClick={() => onTabChange('overview')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'overview' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Security Posture
        </button>
        <button
          onClick={() => onTabChange('incidents')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'incidents' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <span>Incident Queue</span>
          {incidentCount > 0 && (
            <span className="text-xs text-rose-400 font-mono font-bold">({incidentCount})</span>
          )}
        </button>
        <button
          onClick={() => onTabChange('simulator')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Attack Simulator
        </button>
        <button
          onClick={() => onTabChange('practice')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'practice' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          SOC Practice
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleStreaming}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
            isStreaming
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={isStreaming ? 'Pause live event ingestion' : 'Resume live event ingestion'}
        >
          {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isStreaming ? 'Live Ingesting' : 'Ingest Paused'}</span>
        </button>

        <button
          onClick={onQuickSimulate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Inject Attack</span>
        </button>
      </div>
    </header>
  );
};
