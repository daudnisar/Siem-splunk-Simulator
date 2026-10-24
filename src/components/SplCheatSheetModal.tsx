import React from 'react';
import { X, Search, Terminal, ArrowRight } from 'lucide-react';

interface SplCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (query: string) => void;
}

export const SplCheatSheetModal: React.FC<SplCheatSheetModalProps> = ({
  isOpen,
  onClose,
  onApplyQuery
}) => {
  if (!isOpen) return null;

  const CHEAT_ITEMS = [
    {
      category: 'Basic Search & Filtering',
      items: [
        {
          syntax: 'index=web status>=400',
          desc: 'Filter all web logs with HTTP error codes (4xx and 5xx)',
          example: 'index=web status>=400'
        },
        {
          syntax: 'index=security sourcetype=linux_secure "Failed password"',
          desc: 'Search for failed SSH authentications in Linux secure log',
          example: 'index=security sourcetype=linux_secure "Failed password"'
        },
        {
          syntax: 'src_ip="185.220.*" OR src_ip="45.142.*"',
          desc: 'Wildcard match across multiple known threat actor subnets',
          example: 'src_ip="185.220.*" OR src_ip="45.142.*"'
        }
      ]
    },
    {
      category: 'Aggregation & Statistics (| stats)',
      items: [
        {
          syntax: '| stats count by src_ip, user, action',
          desc: 'Count events grouped by source IP, username, and outcome',
          example: 'index=security | stats count by src_ip, user, action | sort -count'
        },
        {
          syntax: '| stats count, dc(dest_ip) by src_ip',
          desc: 'Identify port scanning by finding source IPs contacting many destinations',
          example: '| stats count, dc(dest_ip) by src_ip | where count > 10'
        },
        {
          syntax: '| stats count by status | sort -count',
          desc: 'Distribution of HTTP status codes across public web servers',
          example: 'index=web | stats count by status | sort -count'
        }
      ]
    },
    {
      category: 'Threat Hunting & IOC Detection',
      items: [
        {
          syntax: 'index=web "UNION SELECT" OR "OR 1=1"',
          desc: 'Detect SQL injection probes targeting web application endpoints',
          example: 'index=web "UNION SELECT" OR "OR 1=1"'
        },
        {
          syntax: 'index=endpoint (event_id=1 OR event_id=7045) "PSEXESVC"',
          desc: 'Hunt for lateral movement using Sysmon and Service installation',
          example: 'index=endpoint (event_id=1 OR event_id=7045) "PSEXESVC"'
        },
        {
          syntax: 'index=endpoint process_name="vssadmin.exe" OR event_id=1102',
          desc: 'Pre-ransomware indicator: Shadow copy deletion or cleared Security logs',
          example: 'index=endpoint process_name="vssadmin.exe" OR event_id=1102'
        }
      ]
    },
    {
      category: 'Data Shaping & Formatting (| table, | top, | sort)',
      items: [
        {
          syntax: '| table _time, host, src_ip, user, signature, action',
          desc: 'Format output into a clean tabular report with selected fields',
          example: '| table _time, host, src_ip, user, signature, action'
        },
        {
          syntax: '| top limit=5 src_ip',
          desc: 'Calculate the top 5 most frequent source IP addresses with percentage',
          example: '| top limit=5 src_ip'
        },
        {
          syntax: '| dedup user | table _time, user, host, src_ip',
          desc: 'Remove duplicate occurrences of users to review unique logins',
          example: '| dedup user | table _time, user, host, src_ip'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-[#0d1424] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">Splunk SPL Quick Reference & Threat Hunting Guide</h2>
              <p className="text-xs text-slate-400">Master real enterprise search syntax, pipeline commands, and SOC detection queries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {CHEAT_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{section.category}</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#11192e] p-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-mono font-medium text-emerald-300">{item.syntax}</div>
                      <div className="text-slate-400">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        onApplyQuery(item.example);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 shrink-0 self-start md:self-center rounded-md bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <span>Run Query</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#090d18] px-6 py-3 text-xs text-slate-400">
          <span>Tip: Use pipes <code className="text-emerald-400">|</code> to chain data shaping commands sequentially like in real Splunk Enterprise</span>
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
