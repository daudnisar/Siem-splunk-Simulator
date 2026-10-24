import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, Terminal, Database, Server } from 'lucide-react';
import { LogEvent } from '../types/siem';

interface EventDetailModalProps {
  event: LogEvent | null;
  onClose: () => void;
  onPivotSearch: (term: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onPivotSearch
}) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(event._raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cimFields: { label: string; value: string | number | undefined; pivotTerm?: string }[] = [
    { label: '_time', value: event._time },
    { label: 'host', value: event.host, pivotTerm: `host="${event.host}"` },
    { label: 'sourcetype', value: event.sourcetype, pivotTerm: `sourcetype="${event.sourcetype}"` },
    { label: 'source', value: event.source, pivotTerm: `source="${event.source}"` },
    { label: 'index', value: event.index, pivotTerm: `index="${event.index}"` },
    { label: 'src_ip', value: event.src_ip, pivotTerm: event.src_ip ? `src_ip="${event.src_ip}"` : undefined },
    { label: 'dest_ip', value: event.dest_ip, pivotTerm: event.dest_ip ? `dest_ip="${event.dest_ip}"` : undefined },
    { label: 'src_port', value: event.src_port },
    { label: 'dest_port', value: event.dest_port, pivotTerm: event.dest_port ? `dest_port=${event.dest_port}` : undefined },
    { label: 'user', value: event.user, pivotTerm: event.user ? `user="${event.user}"` : undefined },
    { label: 'action', value: event.action, pivotTerm: event.action ? `action="${event.action}"` : undefined },
    { label: 'status', value: event.status, pivotTerm: event.status ? `status=${event.status}` : undefined },
    { label: 'event_id', value: event.event_id, pivotTerm: event.event_id ? `event_id=${event.event_id}` : undefined },
    { label: 'process_name', value: event.process_name, pivotTerm: event.process_name ? `process_name="${event.process_name}"` : undefined },
    { label: 'command_line', value: event.command_line },
    { label: 'parent_process', value: event.parent_process },
    { label: 'uri_path', value: event.uri_path },
    { label: 'uri_query', value: event.uri_query },
    { label: 'user_agent', value: event.user_agent },
    { label: 'signature', value: event.signature },
    { label: 'mitre_technique_id', value: event.mitre_technique_id, pivotTerm: event.mitre_technique_id ? `mitre_technique_id="${event.mitre_technique_id}"` : undefined },
    { label: 'mitre_tactic', value: event.mitre_tactic }
  ].filter(f => f.value !== undefined && f.value !== '-' && f.value !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-[#0d1424] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">Event Inspector</h2>
                {event.is_attack && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Attack Activity Flagged</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Host: <span className="text-slate-200">{event.host}</span> · Sourcetype: <span className="text-slate-200">{event.sourcetype}</span> · Index: <span className="text-slate-200">{event.index}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Raw Log Event */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Raw Event Log (_raw)</span>
              <button
                onClick={handleCopyRaw}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Raw'}</span>
              </button>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#080d1a] p-4">
              <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all leading-relaxed select-all">
                {event._raw}
              </pre>
            </div>
          </div>

          {/* Extracted CIM Fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Extracted CIM Fields ({cimFields.length})
              </h3>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#11192e] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#090e1b] text-slate-400">
                    <th className="py-2.5 px-4 font-semibold w-40">Field Name</th>
                    <th className="py-2.5 px-4 font-semibold">Value</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Pivot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cimFields.map((field, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-4 text-slate-400 font-medium">{field.label}</td>
                      <td className="py-2 px-4 text-slate-200 break-all">{String(field.value)}</td>
                      <td className="py-2 px-4 text-right">
                        {field.pivotTerm && (
                          <button
                            onClick={() => {
                              onPivotSearch(field.pivotTerm!);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title={`Search: ${field.pivotTerm}`}
                          >
                            <Terminal className="h-3 w-3" />
                            <span>Search</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#090d18] px-6 py-3 text-xs text-slate-400">
          <span>Event ID: <span className="font-mono text-slate-300">{event.id}</span></span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
