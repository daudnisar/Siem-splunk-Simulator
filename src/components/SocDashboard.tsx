import React from 'react';
import { ShieldAlert, Server, Activity, ArrowUpRight, Flame, Globe, Lock, AlertTriangle } from 'lucide-react';
import { LogEvent, Incident } from '../types/siem';

interface SocDashboardProps {
  logs: LogEvent[];
  incidents: Incident[];
  onNavigateToSearch: (query: string) => void;
  onNavigateToIncidents: () => void;
  onTriggerAttack: () => void;
}

export const SocDashboard: React.FC<SocDashboardProps> = ({
  logs,
  incidents,
  onNavigateToSearch,
  onNavigateToIncidents,
  onTriggerAttack
}) => {
  const attackLogs = logs.filter(l => l.is_attack);
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const highIncidents = incidents.filter(i => i.severity === 'high');

  // MITRE Matrix Tactics
  const MITRE_MATRIX = [
    {
      tactic: 'Initial Access',
      techniques: [
        { id: 'T1190', name: 'Exploit Public App', count: logs.filter(l => l.mitre_technique_id === 'T1190').length },
        { id: 'T1078.002', name: 'Domain Accounts', count: logs.filter(l => l.mitre_technique_id === 'T1078.002').length }
      ]
    },
    {
      tactic: 'Execution',
      techniques: [
        { id: 'T1059.001', name: 'PowerShell', count: logs.filter(l => l.mitre_technique_id === 'T1059.001').length },
        { id: 'T1059.003', name: 'Windows Cmd', count: logs.filter(l => l.command_line?.includes('cmd.exe')).length }
      ]
    },
    {
      tactic: 'Defense Evasion',
      techniques: [
        { id: 'T1490', name: 'Inhibit Recovery', count: logs.filter(l => l.mitre_technique_id === 'T1490').length },
        { id: 'T1070.001', name: 'Clear Event Logs', count: logs.filter(l => l.mitre_technique_id === 'T1070.001' || l.event_id === 1102).length }
      ]
    },
    {
      tactic: 'Credential Access',
      techniques: [
        { id: 'T1110.001', name: 'Password Guessing', count: logs.filter(l => l.mitre_technique_id === 'T1110.001').length },
        { id: 'T1558.003', name: 'Kerberoasting', count: logs.filter(l => l.mitre_technique_id === 'T1558.003').length }
      ]
    },
    {
      tactic: 'Lateral Movement',
      techniques: [
        { id: 'T1021.002', name: 'SMB / Admin Shares', count: logs.filter(l => l.mitre_technique_id === 'T1021.002').length }
      ]
    },
    {
      tactic: 'Command & Control',
      techniques: [
        { id: 'T1071.001', name: 'Web Protocols (C2)', count: logs.filter(l => l.mitre_technique_id === 'T1071.001').length }
      ]
    }
  ];

  // Top Attacking Source IPs
  const attackerIps: { ip: string; count: number; geo: string; threat: string }[] = [
    { ip: '45.142.122.84', count: logs.filter(l => l.src_ip === '45.142.122.84').length, geo: 'Russia (RU)', threat: 'STORM-0491 BruteBot' },
    { ip: '185.220.101.5', count: logs.filter(l => l.src_ip === '185.220.101.5').length, geo: 'Netherlands (NL / Tor)', threat: 'sqlmap Exploiter' },
    { ip: '198.51.100.42', count: logs.filter(l => l.dest_ip === '198.51.100.42').length, geo: 'Romania (RO)', threat: 'Cobalt Strike C2 Node' },
    { ip: '10.240.12.18', count: logs.filter(l => l.src_ip === '10.240.12.18' && l.is_attack).length, geo: 'Internal Pivot (WS-FIN-04)', threat: 'Compromised Workstation' }
  ].filter(a => a.count > 0);

  // Top Targeted Assets
  const targetHosts: { host: string; count: number; status: string }[] = [
    { host: 'srv-web-prod01', count: logs.filter(l => l.host === 'srv-web-prod01' && l.is_attack).length, status: 'Under SQLi Attack' },
    { host: 'vpn-gw-01', count: logs.filter(l => l.host === 'vpn-gw-01' && l.is_attack).length, status: 'Credential Spray Target' },
    { host: 'dc01.corp.internal', count: logs.filter(l => l.host === 'dc01.corp.internal' && l.is_attack).length, status: 'Lateral Movement Destination' },
    { host: 'filesrv-01', count: logs.filter(l => l.host === 'filesrv-01' && l.is_attack).length, status: 'Shadow Copy Tampered' }
  ].filter(t => t.count > 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0f19] p-6 space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d1424] p-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            SOC Enterprise Security Operations Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-stage attack detection, telemetry correlation, and MITRE ATT&amp;CK threat posture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToIncidents}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Review Active Incidents ({incidents.length})
          </button>
          <button
            onClick={onTriggerAttack}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-sm"
          >
            <Flame className="h-4 w-4" />
            <span>Simulate Multi-Stage Attack</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Logs Ingested</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1.5 tabular-nums">
            {logs.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 6 enterprise indices</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Incidents</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1.5 tabular-nums">
            {incidents.length}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1 font-mono">
            {criticalIncidents.length} Critical · {highIncidents.length} High
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attack Events Detected</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5 tabular-nums">
            {attackLogs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Correlated by detection rules</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Targeted Assets</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1.5 tabular-nums">
            {targetHosts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Endpoints &amp; DMZ Servers</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ingestion Velocity</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            ~12 eps
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Events per second</div>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Navigator */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">MITRE ATT&amp;CK® Enterprise Matrix Coverage</h2>
            <p className="text-xs text-slate-400">Click any technique to execute targeted Splunk SPL hunt query</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Taxonomy: v14.1</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {MITRE_MATRIX.map((col, idx) => (
            <div key={idx} className="rounded-lg border border-slate-800/80 bg-[#090e1c] p-3 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase text-slate-300 border-b border-slate-800 pb-1.5">
                {col.tactic}
              </div>
              <div className="space-y-2">
                {col.techniques.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => onNavigateToSearch(`mitre_technique_id="${tech.id}"`)}
                    className={`w-full text-left rounded-md p-2 transition-colors border ${
                      tech.count > 0
                        ? 'border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className={tech.count > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>{tech.id}</span>
                      <span className={`tabular-nums ${tech.count > 0 ? 'text-rose-300 font-bold' : 'text-slate-600'}`}>
                        {tech.count}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate mt-0.5" title={tech.name}>
                      {tech.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Top Threat Actors & Targeted Critical Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacking Threat Actors */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-100">Top Attacking Threat Actors</h3>
            </div>
            <span className="text-xs text-slate-400">External &amp; Pivot IOCs</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {attackerIps.map(actor => (
              <div key={actor.ip} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-rose-400">{actor.ip}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{actor.geo}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{actor.threat}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400 tabular-nums">{actor.count} events</span>
                  <button
                    onClick={() => onNavigateToSearch(`src_ip="${actor.ip}"`)}
                    className="rounded bg-slate-800 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                    title={`Hunt IP: src_ip="${actor.ip}"`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Targeted Critical Assets */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">Compromised &amp; Targeted Assets</h3>
            </div>
            <span className="text-xs text-slate-400">Host Risk Triage</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {targetHosts.map(hostItem => (
              <div key={hostItem.host} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-mono text-xs font-semibold text-slate-200">{hostItem.host}</div>
                  <div className="text-xs text-amber-400 font-medium">{hostItem.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400 tabular-nums">{hostItem.count} attack logs</span>
                  <button
                    onClick={() => onNavigateToSearch(`host="${hostItem.host}"`)}
                    className="rounded bg-slate-800 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                    title={`Hunt Host: host="${hostItem.host}"`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
