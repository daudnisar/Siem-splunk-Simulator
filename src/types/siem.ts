export type LogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type LogAction = 'allowed' | 'blocked' | 'success' | 'failure' | 'alert' | 'denied';
export type IncidentStatus = 'new' | 'investigating' | 'contained' | 'closed_true_positive' | 'closed_false_positive';

export interface LogEvent {
  id: string;
  _time: string; // ISO string
  _raw: string;
  index: 'security' | 'firewall' | 'web' | 'endpoint' | 'cloud' | 'main';
  sourcetype: 'access_combined' | 'WinEventLog:Security' | 'WinEventLog:Sysmon' | 'linux_secure' | 'pan:traffic' | 'suricata' | 'aws:cloudtrail' | 'cisco:asa' | 'okta:log';
  host: string;
  source: string;
  src_ip?: string;
  dest_ip?: string;
  src_port?: number;
  dest_port?: number;
  user?: string;
  action?: LogAction;
  status?: number; // HTTP status or result code
  event_id?: number | string; // Windows event ID
  signature?: string;
  signature_id?: string;
  process_name?: string;
  command_line?: string;
  parent_process?: string;
  file_name?: string;
  hash_sha256?: string;
  bytes_in?: number;
  bytes_out?: number;
  protocol?: string;
  uri_path?: string;
  uri_query?: string;
  user_agent?: string;
  mitre_tactic?: string;
  mitre_technique_id?: string;
  mitre_technique_name?: string;
  severity: LogSeverity;
  is_attack?: boolean;
  attack_scenario_id?: string;
}

export interface SplFieldDistribution {
  field: string;
  totalEvents: number;
  topValues: { value: string; count: number; percent: number }[];
}

export interface SplSearchResult {
  rawEvents: LogEvent[];
  isStatsView: boolean;
  statsHeaders?: string[];
  statsRows?: Record<string, string | number>[];
  executionTimeMs: number;
  eventCount: number;
  matchedCount: number;
  timeBuckets: { time: string; count: number; attackCount: number }[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: LogSeverity;
  riskScore: number; // 0 - 100
  status: IncidentStatus;
  detectedAt: string;
  ruleName: string;
  mitreTactic: string;
  mitreTechniqueId: string;
  mitreTechniqueName: string;
  affectedHost: string;
  affectedUser?: string;
  attackerIp?: string;
  eventIds: string[];
  notes: { timestamp: string; author: string; text: string }[];
  containmentActionsTaken: string[];
}

export interface AttackScenario {
  id: string;
  name: string;
  category: string;
  severity: LogSeverity;
  mitreTechniqueId: string;
  mitreTechniqueName: string;
  mitreTactic: string;
  description: string;
  attackerProfile: {
    ip: string;
    alias: string;
    country: string;
    tool: string;
  };
  targetProfile: {
    host: string;
    targetService: string;
    user?: string;
  };
  stages: {
    stageNumber: number;
    title: string;
    description: string;
    logCount: number;
  }[];
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: 'Tier 1 (Junior Analyst)' | 'Tier 2 (Senior Analyst)' | 'Tier 3 (Incident Responder)';
  category: string;
  description: string;
  backgroundBrief: string;
  hints: string[];
  recommendedSPL: string;
  questions: {
    id: string;
    questionText: string;
    placeholder: string;
    correctAnswers: string[]; // lowercase normalized match
    explanation: string;
    answeredCorrectly?: boolean;
  }[];
}
