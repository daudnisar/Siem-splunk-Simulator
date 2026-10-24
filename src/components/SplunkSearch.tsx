import React, { useState, useMemo } from 'react';
import { Search, Clock, HelpCircle, ChevronRight, ChevronDown, Eye, Filter, ArrowUpDown, BarChart3, ListFilter, RotateCcw } from 'lucide-react';
import { LogEvent, SplSearchResult, SplFieldDistribution } from '../types/siem';
import { executeSPL, calculateFieldDistributions, getFieldValue } from '../services/splEngine';

interface SplunkSearchProps {
  logs: LogEvent[];
  initialQuery?: string;
  onOpenCheatSheet: () => void;
  onSelectEvent: (event: LogEvent) => void;
}

export const SplunkSearch: React.FC<SplunkSearchProps> = ({
  logs,
  initialQuery = '*',
  onOpenCheatSheet,
  onSelectEvent
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [timeRange, setTimeRange] = useState<'all' | '15m' | '1h' | '24h'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'statistics' | 'visualization'>('events');
  const [selectedFieldPopover, setSelectedFieldPopover] = useState<string | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  // Sync if initialQuery changes from outside
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setActiveQuery(initialQuery);
    }
  }, [initialQuery]);

  // Execute SPL search
  const searchResult: SplSearchResult = useMemo(() => {
    return executeSPL(activeQuery, logs, timeRange);
  }, [activeQuery, logs, timeRange]);

  // If search produces stats (e.g. | stats or | table), automatically switch to statistics tab if on events
  React.useEffect(() => {
    if (searchResult.isStatsView && activeSubTab === 'events') {
      setActiveSubTab('statistics');
    }
  }, [searchResult.isStatsView]);

  // Field distributions for the Splunk sidebar
  const fieldDistributions: SplFieldDistribution[] = useMemo(() => {
    return calculateFieldDistributions(searchResult.rawEvents);
  }, [searchResult.rawEvents]);

  const handleRunSearch = () => {
    setActiveQuery(query.trim() || '*');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunSearch();
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddFieldToSearch = (field: string, value: string, isNot = false) => {
    const formattedVal = isNaN(Number(value)) ? `"${value}"` : value;
    const term = isNot ? `NOT ${field}=${formattedVal}` : `${field}=${formattedVal}`;
    const newQ = activeQuery === '*' ? term : `${activeQuery} ${term}`;
    setQuery(newQ);
    setActiveQuery(newQ);
    setSelectedFieldPopover(null);
  };

  const PRESET_QUERIES = [
    { label: 'All Raw Events', spl: '*' },
    { label: 'Failed SSH Logins', spl: 'index=security sourcetype=linux_secure "Failed password"' },
    { label: 'SQL Injection Probes', spl: 'index=web "UNION SELECT" OR "OR 1=1"' },
    { label: 'High Severity Alerts', spl: 'severity=critical OR severity=high' },
    { label: 'Top 5 Attacker IPs', spl: '| stats count by src_ip | sort -count | head 5' },
    { label: 'Logons by User', spl: 'index=endpoint event_id=4624 | stats count by user, host' },
    { label: 'Sysmon Process Execution', spl: 'index=endpoint sourcetype="WinEventLog:Sysmon" | table _time, host, process_name, command_line' },
    { label: 'Ransomware Deletion Hunt', spl: 'process_name="vssadmin.exe" OR event_id=1102' }
  ];

  const maxBucketCount = Math.max(...searchResult.timeBuckets.map(b => b.count), 1);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-200">
      {/* Top Search Controls Bar */}
      <div className="border-b border-slate-800 bg-[#0d1424] px-6 py-4 space-y-3">
        <div className="flex items-center gap-2">
          {/* SPL Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search e.g. index=security sourcetype=linux_secure status>=400 | stats count by user, host"
              className="w-full rounded-lg border border-slate-700 bg-[#080d1a] py-2.5 pl-9 pr-24 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {query !== '*' && (
              <button
                onClick={() => {
                  setQuery('*');
                  setActiveQuery('*');
                }}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear Search"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleRunSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Time Picker */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as any)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#0d1424] text-slate-200">All Time (Live)</option>
              <option value="15m" className="bg-[#0d1424] text-slate-200">Last 15 minutes</option>
              <option value="1h" className="bg-[#0d1424] text-slate-200">Last 1 hour</option>
              <option value="24h" className="bg-[#0d1424] text-slate-200">Last 24 hours</option>
            </select>
          </div>

          {/* Presets Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              onChange={e => {
                if (e.target.value) {
                  setQuery(e.target.value);
                  setActiveQuery(e.target.value);
                }
              }}
              defaultValue=""
              className="bg-transparent focus:outline-hidden cursor-pointer max-w-[140px] truncate"
            >
              <option value="" disabled className="bg-[#0d1424] text-slate-400">SOC Query Presets</option>
              {PRESET_QUERIES.map((p, idx) => (
                <option key={idx} value={p.spl} className="bg-[#0d1424] text-slate-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* SPL Cheat Sheet Help Button */}
          <button
            onClick={onOpenCheatSheet}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Splunk SPL Syntax Guide"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SPL Guide</span>
          </button>
        </div>

        {/* Execution Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4 pt-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-200">
              <span className="text-emerald-400 font-semibold">{searchResult.matchedCount.toLocaleString()}</span> matched events
            </span>
            <span className="text-slate-600">·</span>
            <span>Scan of <span className="font-mono text-slate-300">{searchResult.eventCount}</span> total events</span>
            <span className="text-slate-600">·</span>
            <span>Execution: <span className="font-mono text-slate-300">{searchResult.executionTimeMs} ms</span></span>
          </div>

          <div className="flex items-center gap-1 bg-[#080d1a] p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeSubTab === 'events' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Events ({searchResult.rawEvents.length})
            </button>
            <button
              onClick={() => setActiveSubTab('statistics')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeSubTab === 'statistics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statistics {searchResult.isStatsView ? `(${searchResult.matchedCount})` : ''}
            </button>
            <button
              onClick={() => setActiveSubTab('visualization')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeSubTab === 'visualization' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visualizations
            </button>
          </div>
        </div>
      </div>

      {/* Event Timeline Histogram */}
      {searchResult.timeBuckets.length > 0 && (
        <div className="border-b border-slate-800 bg-[#0a0f1d] px-6 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Event Activity Distribution Over Time</span>
            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block"></span>
                <span>Normal Traffic</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block"></span>
                <span>Attack Activity</span>
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-12 w-full pt-1">
            {searchResult.timeBuckets.map((bucket, i) => {
              const normalCount = bucket.count - bucket.attackCount;
              const heightPercent = (bucket.count / maxBucketCount) * 100;
              const attackPercent = bucket.count > 0 ? (bucket.attackCount / bucket.count) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer"
                  title={`${bucket.time}: ${bucket.count} events (${bucket.attackCount} attacks)`}
                >
                  <div
                    className="w-full rounded-xs overflow-hidden flex flex-col justify-end bg-slate-800/60"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  >
                    {bucket.attackCount > 0 && (
                      <div className="w-full bg-rose-500" style={{ height: `${attackPercent}%` }} />
                    )}
                    <div className="w-full bg-emerald-500" style={{ height: `${100 - attackPercent}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-500 text-center mt-1 font-mono truncate">
                    {bucket.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Workspace: Left Fields Sidebar + Right Results Table */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Splunk Fields Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#090e1c] flex flex-col overflow-y-auto shrink-0 p-3 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span>Fields ({fieldDistributions.length})</span>
            </div>
          </div>

          {/* Interesting Fields List */}
          <div className="space-y-1">
            {fieldDistributions.map(item => (
              <div key={item.field} className="relative">
                <button
                  onClick={() => setSelectedFieldPopover(selectedFieldPopover === item.field ? null : item.field)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-left transition-colors ${
                    selectedFieldPopover === item.field
                      ? 'bg-slate-800 text-emerald-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono truncate">{item.field}</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {item.topValues.length}
                  </span>
                </button>

                {/* Field Values Popover */}
                {selectedFieldPopover === item.field && (
                  <div className="mt-1 rounded-lg border border-slate-700 bg-[#10172b] p-2.5 shadow-xl space-y-2 z-20">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 text-xs font-medium text-slate-200">
                      <span>Top values for <code className="text-emerald-400">{item.field}</code></span>
                      <button
                        onClick={() => setSelectedFieldPopover(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {item.topValues.length === 0 ? (
                        <div className="text-[11px] text-slate-500">No values in result set</div>
                      ) : (
                        item.topValues.map((val, vi) => (
                          <div
                            key={vi}
                            className="flex items-center justify-between text-xs py-0.5 group"
                          >
                            <span className="font-mono text-slate-300 truncate max-w-[120px]" title={val.value}>
                              {val.value}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-mono tabular-nums">{val.percent}%</span>
                              <button
                                onClick={() => handleAddFieldToSearch(item.field, val.value, false)}
                                className="rounded bg-slate-800 px-1 text-[10px] text-emerald-400 hover:bg-emerald-600 hover:text-white"
                                title="Add to search (+)"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleAddFieldToSearch(item.field, val.value, true)}
                                className="rounded bg-slate-800 px-1 text-[10px] text-rose-400 hover:bg-rose-600 hover:text-white"
                                title="Exclude from search (NOT)"
                              >
                                -
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Results Area */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* SubTab 1: Raw Events List */}
          {activeSubTab === 'events' && (
            <div className="space-y-2">
              {searchResult.rawEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-800 bg-[#0d1424]">
                  <Search className="h-8 w-8 text-slate-600 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-200">No events matched your search query</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Try broadening your search term, removing restrictive filters, or resetting to <code className="text-emerald-400 font-mono">*</code>
                  </p>
                  <button
                    onClick={() => {
                      setQuery('*');
                      setActiveQuery('*');
                    }}
                    className="mt-4 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    Reset Query to *
                  </button>
                </div>
              ) : (
                searchResult.rawEvents.map((event) => {
                  const isExpanded = !!expandedRowIds[event.id];
                  return (
                    <div
                      key={event.id}
                      className={`rounded-lg border transition-colors ${
                        event.is_attack
                          ? 'border-rose-900/50 bg-[#16101c] hover:bg-[#1c1324]'
                          : 'border-slate-800/80 bg-[#0e1424] hover:bg-[#11192e]'
                      }`}
                    >
                      {/* Main Event Row */}
                      <div className="flex items-start gap-3 p-3 text-xs">
                        <button
                          onClick={() => toggleRowExpand(event.id)}
                          className="mt-0.5 text-slate-500 hover:text-slate-300"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          {/* Metadata Header Line (Unboxed, clean typographic separators per Universal Design Skill) */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span className="text-slate-200 tabular-nums">{event._time}</span>
                            <span aria-hidden="true">·</span>
                            <span>host: <span className="text-emerald-400">{event.host}</span></span>
                            <span aria-hidden="true">·</span>
                            <span>sourcetype: <span className="text-slate-300">{event.sourcetype}</span></span>
                            {event.action && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className={
                                  event.action === 'failure' || event.action === 'blocked' || event.action === 'alert'
                                    ? 'text-rose-400 font-semibold'
                                    : 'text-emerald-400'
                                }>
                                  action: {event.action}
                                </span>
                              </>
                            )}
                            {event.status && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>status: <span className="text-slate-200">{event.status}</span></span>
                              </>
                            )}
                            {event.is_attack && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-rose-400 font-bold uppercase tracking-wider">
                                  Attack Activity: {event.mitre_technique_id}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Raw Log Preview */}
                          <div className="font-mono text-xs text-slate-300 break-all leading-relaxed bg-[#070b15]/60 p-2 rounded-md border border-slate-800/60">
                            {event._raw}
                          </div>
                        </div>

                        {/* Quick View Button */}
                        <button
                          onClick={() => onSelectEvent(event)}
                          className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Inspect raw event & CIM fields"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Expanded In-line Field Inspector */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-[#090d18] p-3 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-[11px]">
                            {['src_ip', 'dest_ip', 'user', 'event_id', 'process_name', 'signature', 'uri_path', 'mitre_technique_id'].map(f => {
                              const val = getFieldValue(event, f);
                              if (!val || val === '-') return null;
                              return (
                                <div key={f} className="rounded border border-slate-800 bg-[#0c1222] p-1.5">
                                  <div className="text-slate-500 uppercase text-[9px]">{f}</div>
                                  <div className="text-slate-200 truncate" title={String(val)}>{String(val)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SubTab 2: Tabular / Statistics View (| stats, | table, etc.) */}
          {activeSubTab === 'statistics' && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
              {searchResult.isStatsView && searchResult.statsHeaders && searchResult.statsRows ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#090e1b] text-slate-400">
                        <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                        {searchResult.statsHeaders.map((head, idx) => (
                          <th key={idx} className="py-2.5 px-4 font-semibold font-mono">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {searchResult.statsRows.length === 0 ? (
                        <tr>
                          <td colSpan={searchResult.statsHeaders.length + 1} className="py-8 text-center text-slate-500">
                            No records in statistics result
                          </td>
                        </tr>
                      ) : (
                        searchResult.statsRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4 text-center text-slate-500 font-mono">{rIdx + 1}</td>
                            {searchResult.statsHeaders!.map((head, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-4 text-slate-200">
                                {String(row[head] !== undefined ? row[head] : '-')}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <BarChart3 className="h-8 w-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-200">No transformational command executed</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To see statistics, append a pipeline command like <code className="text-emerald-400 font-mono">| stats count by src_ip, user</code> or <code className="text-emerald-400 font-mono">| table _time, host, action</code>.
                  </p>
                  <button
                    onClick={() => {
                      const q = `${activeQuery} | stats count by host, action | sort -count`;
                      setQuery(q);
                      setActiveQuery(q);
                    }}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Run Sample | stats count by host, action
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SubTab 3: Visualizations */}
          {activeSubTab === 'visualization' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
                  Events by Host Distribution
                </h4>
                <div className="space-y-2.5">
                  {(() => {
                    const hostCounts: Record<string, number> = {};
                    searchResult.rawEvents.forEach(e => {
                      hostCounts[e.host] = (hostCounts[e.host] || 0) + 1;
                    });
                    const total = searchResult.rawEvents.length || 1;
                    return Object.entries(hostCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([host, count]) => {
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={host} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-300">{host}</span>
                              <span className="text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
                  Severity Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {(['critical', 'high', 'medium', 'informational'] as const).map(sev => {
                    const count = searchResult.rawEvents.filter(e => e.severity === sev).length;
                    return (
                      <div key={sev} className="rounded-lg border border-slate-800 bg-[#090e1c] p-3">
                        <div className="text-[11px] font-semibold uppercase text-slate-400">{sev}</div>
                        <div className="text-xl font-bold font-mono text-slate-100 mt-1 tabular-nums">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
