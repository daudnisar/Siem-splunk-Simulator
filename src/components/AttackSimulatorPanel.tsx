import React, { useState } from 'react';
import { Flame, Play, Pause, FastForward, RotateCcw, Download, Terminal, Plus, Shield, Check, Globe, Server } from 'lucide-react';
import { ATTACK_SCENARIOS } from '../data/scenarios';
import { LogEvent } from '../types/siem';

interface AttackSimulatorPanelProps {
  onInjectScenario: (scenarioId: string) => void;
  onInjectCustomLog: (event: Partial<LogEvent>) => void;
  onResetLogs: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  streamSpeed: number;
  onChangeSpeed: (speed: number) => void;
  logs: LogEvent[];
}

export const AttackSimulatorPanel: React.FC<AttackSimulatorPanelProps> = ({
  onInjectScenario,
  onInjectCustomLog,
  onResetLogs,
  isStreaming,
  onToggleStreaming,
  streamSpeed,
  onChangeSpeed,
  logs
}) => {
  const [activeScenarioTriggered, setActiveScenarioTriggered] = useState<string | null>(null);

  // Custom log form state
  const [customHost, setCustomHost] = useState('srv-web-prod01');
  const [customSourcetype, setCustomSourcetype] = useState('access_combined');
  const [customIndex, setCustomIndex] = useState<'security' | 'web' | 'endpoint' | 'firewall'>('web');
  const [customSrcIp, setCustomSrcIp] = useState('192.168.1.150');
  const [customUser, setCustomUser] = useState('test_user');
  const [customRaw, setCustomRaw] = useState('GET /login.php?user=admin HTTP/1.1 200 450');
  const [customSuccess, setCustomSuccess] = useState(false);

  const handleTrigger = (scenarioId: string) => {
    onInjectScenario(scenarioId);
    setActiveScenarioTriggered(scenarioId);
    setTimeout(() => setActiveScenarioTriggered(null), 3000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectCustomLog({
      host: customHost,
      sourcetype: customSourcetype as any,
      index: customIndex,
      src_ip: customSrcIp,
      user: customUser,
      _raw: customRaw,
      action: 'allowed',
      severity: 'informational'
    });
    setCustomSuccess(true);
    setTimeout(() => setCustomSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `siem_logs_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['_time', 'host', 'index', 'sourcetype', 'src_ip', 'dest_ip', 'user', 'action', 'status', 'signature', '_raw'];
    const rows = logs.map(l => [
      `"${l._time}"`,
      `"${l.host}"`,
      `"${l.index}"`,
      `"${l.sourcetype}"`,
      `"${l.src_ip || ''}"`,
      `"${l.dest_ip || ''}"`,
      `"${l.user || ''}"`,
      `"${l.action || ''}"`,
      `"${l.status || ''}"`,
      `"${(l.signature || '').replace(/"/g, '""')}"`,
      `"${l._raw.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `siem_logs_export_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0f19] p-6 space-y-8">
      {/* Top Controller Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d1424] p-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Threat Injection &amp; Attack Simulation Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic multi-stage enterprise attack chains against firewalls, endpoints, and identity providers.
          </p>
        </div>

        {/* Playback & Velocity Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-[#080d1a] p-1 text-xs">
            <button
              onClick={onToggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                isStreaming ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isStreaming ? 'Streaming' : 'Paused'}</span>
            </button>

            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1.5 rounded-md font-mono transition-colors ${
                  streamSpeed === spd ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onResetLogs}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Reset to factory baseline seed logs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Export ingested logs as JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Export ingested logs as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Attack Launchpad */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-slate-100">Simulate Real-World Attack Scenarios</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">6 Scenarios Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ATTACK_SCENARIOS.map(sc => {
            const isFired = activeScenarioTriggered === sc.id;
            return (
              <div
                key={sc.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0d1424] p-5 hover:border-slate-700 transition-colors space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-rose-400 uppercase">
                      {sc.mitreTechniqueId} · {sc.category}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      sc.severity === 'critical' ? 'text-rose-400 border-rose-900/60 bg-rose-950/20' : 'text-amber-400 border-amber-900/60 bg-amber-950/20'
                    }`}>
                      {sc.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 leading-snug">
                    {sc.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="rounded-lg border border-slate-800/80 bg-[#090e1c] p-2.5 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attacker:</span>
                      <span className="text-rose-400 font-semibold">{sc.attackerProfile.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-200">{sc.targetProfile.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tool:</span>
                      <span className="text-slate-400 truncate max-w-[140px]">{sc.attackerProfile.tool}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleTrigger(sc.id)}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all shadow-sm ${
                    isFired
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                >
                  {isFired ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Attack Injected &amp; Correlated!</span>
                    </>
                  ) : (
                    <>
                      <Flame className="h-4 w-4" />
                      <span>Launch Attack Burst</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Log Injector Tool */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Custom Log Ingestion Testbed</h3>
          </div>
          <span className="text-xs text-slate-500">Craft any custom log format for parser &amp; SPL validation</span>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Index</label>
              <select
                value={customIndex}
                onChange={e => setCustomIndex(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-slate-200 font-mono focus:outline-hidden"
              >
                <option value="web">web</option>
                <option value="security">security</option>
                <option value="endpoint">endpoint</option>
                <option value="firewall">firewall</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Sourcetype</label>
              <input
                type="text"
                value={customSourcetype}
                onChange={e => setCustomSourcetype(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-slate-200 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Host</label>
              <input
                type="text"
                value={customHost}
                onChange={e => setCustomHost(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-slate-200 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Source IP</label>
              <input
                type="text"
                value={customSrcIp}
                onChange={e => setCustomSrcIp(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-slate-200 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">User</label>
              <input
                type="text"
                value={customUser}
                onChange={e => setCustomUser(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-slate-200 font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-xs">Raw Event Message (_raw)</label>
            <textarea
              rows={2}
              value={customRaw}
              onChange={e => setCustomRaw(e.target.value)}
              placeholder="Paste raw log string e.g. Oct 23 18:30:00 srv sshd[102]: Accepted password for root from 1.2.3.4"
              className="w-full rounded-lg border border-slate-700 bg-[#080d1a] p-3 text-xs font-mono text-emerald-300 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              The event will be immediately indexed and searchable in the Search &amp; SPL tab.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              {customSuccess ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{customSuccess ? 'Injected Successfully!' : 'Ingest Custom Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
