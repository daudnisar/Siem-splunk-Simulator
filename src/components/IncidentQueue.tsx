import React, { useState } from 'react';
import { AlertCircle, Shield, CheckCircle, Clock, User, Server, Search, ArrowRight, ShieldCheck, Ban, Lock, RefreshCw, Plus } from 'lucide-react';
import { Incident, IncidentStatus, LogSeverity } from '../types/siem';

interface IncidentQueueProps {
  incidents: Incident[];
  onUpdateIncidentStatus: (id: string, status: IncidentStatus) => void;
  onAddIncidentNote: (id: string, noteText: string) => void;
  onTakeContainmentAction: (id: string, actionText: string) => void;
  onHuntIncidentInSearch: (incident: Incident) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  incidents,
  onUpdateIncidentStatus,
  onAddIncidentNote,
  onTakeContainmentAction,
  onHuntIncidentInSearch
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents.length > 0 ? incidents[0].id : null
  );
  const [newNote, setNewNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'investigating' | 'contained' | 'closed'>('all');

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const filteredIncidents = incidents.filter(i => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'closed') return i.status.startsWith('closed');
    return i.status === statusFilter;
  });

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedIncidentId) return;
    onAddIncidentNote(selectedIncidentId, newNote.trim());
    setNewNote('');
  };

  const getSeverityStyle = (sev: LogSeverity) => {
    switch (sev) {
      case 'critical':
        return 'text-rose-400 border-rose-900/60 bg-rose-950/20';
      case 'high':
        return 'text-amber-400 border-amber-900/60 bg-amber-950/20';
      case 'medium':
        return 'text-sky-400 border-sky-900/60 bg-sky-950/20';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/20';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case 'new': return 'New';
      case 'investigating': return 'Under Investigation';
      case 'contained': return 'Contained';
      case 'closed_true_positive': return 'Closed (True Positive)';
      case 'closed_false_positive': return 'Closed (False Positive)';
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0b0f19]">
      {/* Left List: Incident Queue */}
      <div className="w-96 border-r border-slate-800 bg-[#090e1c] flex flex-col shrink-0">
        {/* Queue Header & Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Notable Incidents Queue</h2>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {filteredIncidents.length} of {incidents.length}
            </span>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-slate-800 text-[11px]">
            {(['all', 'new', 'investigating', 'contained', 'closed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2 py-1 rounded font-medium capitalize transition-colors ${
                  statusFilter === tab
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Incident Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No incidents matching filter
            </div>
          ) : (
            filteredIncidents.map(inc => {
              const isSelected = inc.id === selectedIncidentId;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-4 cursor-pointer transition-colors space-y-2 ${
                    isSelected ? 'bg-[#121a30] border-l-2 border-emerald-400' : 'hover:bg-[#0d1424]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-400">{inc.id}</span>
                    <span className={`text-[11px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getSeverityStyle(inc.severity)}`}>
                      {inc.severity} · {inc.riskScore}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-200 line-clamp-2">
                    {inc.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[140px] text-slate-300">{inc.affectedHost}</span>
                    <span className="capitalize text-emerald-400 font-medium">
                      {getStatusLabel(inc.status)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Incident Investigation Workbench */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0b0f19]">
        {selectedIncident ? (
          <div className="max-w-4xl space-y-6">
            {/* Header / Triage Card */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">{selectedIncident.id}</span>
                    <span className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityStyle(selectedIncident.severity)}`}>
                      Severity: {selectedIncident.severity}
                    </span>
                    <span className="text-xs font-mono text-rose-400 font-semibold">
                      Risk Score: {selectedIncident.riskScore}/100
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-100 mt-2">
                    {selectedIncident.title}
                  </h1>
                </div>

                {/* Status Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Incident Status:</span>
                  <select
                    value={selectedIncident.status}
                    onChange={e => onUpdateIncidentStatus(selectedIncident.id, e.target.value as IncidentStatus)}
                    className="rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-1.5 font-mono text-xs text-emerald-400 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="new">New (Unassigned)</option>
                    <option value="investigating">Under Investigation</option>
                    <option value="contained">Contained</option>
                    <option value="closed_true_positive">Closed (True Positive)</option>
                    <option value="closed_false_positive">Closed (False Positive)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedIncident.description}
              </p>

              {/* Entity Context Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="rounded-lg border border-slate-800 bg-[#090e1c] p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase block">Affected Host</span>
                  <span className="text-slate-200 font-semibold">{selectedIncident.affectedHost}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#090e1c] p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase block">Attacker / Source IP</span>
                  <span className="text-rose-400 font-semibold">{selectedIncident.attackerIp || 'Internal'}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#090e1c] p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase block">User Context</span>
                  <span className="text-slate-200 font-semibold">{selectedIncident.affectedUser || 'N/A'}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#090e1c] p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase block">MITRE Technique</span>
                  <span className="text-emerald-400 font-semibold">{selectedIncident.mitreTechniqueId}</span>
                </div>
              </div>

              {/* Action Pivot */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Triggered by Detection Rule: <code className="text-emerald-400 font-mono">{selectedIncident.ruleName}</code>
                </span>
                <button
                  onClick={() => onHuntIncidentInSearch(selectedIncident)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Pivot to Splunk SPL Search ({selectedIncident.eventIds.length} Events)</span>
                </button>
              </div>
            </div>

            {/* Containment Playbook Actions */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Incident Response &amp; Containment Playbook
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Live Remediation Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <button
                  onClick={() => onTakeContainmentAction(selectedIncident.id, `Isolated Host ${selectedIncident.affectedHost} via EDR Endpoint Quarantine`)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-xs font-medium text-slate-200 hover:border-rose-500 hover:text-rose-300 transition-colors text-left"
                >
                  <Ban className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Isolate Host from Network</span>
                </button>

                <button
                  onClick={() => onTakeContainmentAction(selectedIncident.id, `Blocked Source IP ${selectedIncident.attackerIp || 'Attacker'} on Palo Alto Edge Firewall`)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-xs font-medium text-slate-200 hover:border-amber-500 hover:text-amber-300 transition-colors text-left"
                >
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Block Attacker IP at Firewall</span>
                </button>

                <button
                  onClick={() => onTakeContainmentAction(selectedIncident.id, `Forced Active Directory Password Reset for ${selectedIncident.affectedUser || 'Account'}`)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-xs font-medium text-slate-200 hover:border-sky-500 hover:text-sky-300 transition-colors text-left"
                >
                  <RefreshCw className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Force AD Password Reset</span>
                </button>

                <button
                  onClick={() => onTakeContainmentAction(selectedIncident.id, `Revoked all active Kerberos TGT and VPN sessions for ${selectedIncident.affectedUser || 'User'}`)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-xs font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors text-left"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Revoke VPN / Kerberos Tickets</span>
                </button>
              </div>

              {/* Actions Taken Audit Trail */}
              {selectedIncident.containmentActionsTaken.length > 0 && (
                <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Remediation Actions Executed ({selectedIncident.containmentActionsTaken.length})
                  </div>
                  {selectedIncident.containmentActionsTaken.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analyst Investigation Notebook & Notes */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Analyst Case Timeline &amp; Investigation Notes
              </h3>

              {/* Note input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
                  placeholder="Record SOC analyst findings e.g. 'Confirmed IOC in VirusTotal, matches APT29 infrastructure...'"
                  className="flex-1 rounded-lg border border-slate-700 bg-[#080d1a] px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  onClick={handleAddNote}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-2.5">
                {selectedIncident.notes.map((note, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-[#090e1c] p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="text-emerald-400 font-semibold">{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <AlertCircle className="h-10 w-10 mb-2 text-slate-600" />
            <p className="text-sm">Select an incident from the queue to start investigation</p>
          </div>
        )}
      </div>
    </div>
  );
};
