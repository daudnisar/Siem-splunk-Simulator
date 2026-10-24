import { AttackScenario } from '../types/siem';

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'ssh_brute_force',
    name: 'Distributed SSH & VPN Credential Spraying',
    category: 'Credential Access',
    severity: 'high',
    mitreTechniqueId: 'T1110.001',
    mitreTechniqueName: 'Brute Force: Password Guessing',
    mitreTactic: 'Credential Access',
    description: 'Threat actor launches high-frequency dictionary attack against edge VPN gateway and bastion host, testing thousands of credentials until hitting a successful authentication for user "jsmith".',
    attackerProfile: {
      ip: '45.142.122.84',
      alias: 'STORM-0491 (BruteBot)',
      country: 'RU',
      tool: 'Hydra v9.5 / Medusa'
    },
    targetProfile: {
      host: 'vpn-gw-01.corp.internal',
      targetService: 'OpenVPN / PAM SSH (Port 22 & 443)',
      user: 'jsmith'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Initial Port Scan & Service Probing',
        description: 'SYN scan targeting port 22 and 443 on public gateway',
        logCount: 6
      },
      {
        stageNumber: 2,
        title: 'Rapid High-Volume Failed Authentication',
        description: 'Hundreds of invalid password attempts for common users (admin, root, test, guest, jsmith)',
        logCount: 15
      },
      {
        stageNumber: 3,
        title: 'Successful Authentication & Session Spawning',
        description: 'Accepted password for jsmith from abnormal geo-location, followed by sudo su attempt',
        logCount: 4
      }
    ]
  },
  {
    id: 'web_sqli_dump',
    name: 'Web Application SQL Injection & Database Exfiltration',
    category: 'Initial Access',
    severity: 'critical',
    mitreTechniqueId: 'T1190',
    mitreTechniqueName: 'Exploit Public-Facing Application',
    mitreTactic: 'Initial Access',
    description: 'Attacker probes e-commerce checkout API endpoint with Boolean and UNION-based SQL injection payloads, dumps administrative credentials and payment hashes, then accesses customer database.',
    attackerProfile: {
      ip: '185.220.101.5',
      alias: 'DarkHydra (Tor Exit Node)',
      country: 'NL',
      tool: 'sqlmap/1.7#stable'
    },
    targetProfile: {
      host: 'srv-web-prod01',
      targetService: 'Nginx 1.24.0 / Node.js API (Port 443)',
      user: 'www-data'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Automated Vulnerability Fuzzing',
        description: 'Automated tool probing /api/v1/orders with quote escapes and sleep() timing tests',
        logCount: 8
      },
      {
        stageNumber: 2,
        title: 'UNION-Based Schema Extraction',
        description: 'UNION SELECT queries sent to /api/v1/catalog?id= exploiting backend PostgreSQL service',
        logCount: 12
      },
      {
        stageNumber: 3,
        title: 'Mass Data Extraction via HTTP Response',
        description: 'High-payload outbound responses dumping confidential user tables and hash dumps',
        logCount: 5
      }
    ]
  },
  {
    id: 'ad_kerberoast_lateral',
    name: 'Active Directory Kerberoasting & PsExec Lateral Movement',
    category: 'Lateral Movement',
    severity: 'critical',
    mitreTechniqueId: 'T1003.001',
    mitreTechniqueName: 'OS Credential Dumping: LSASS Memory',
    mitreTactic: 'Lateral Movement',
    description: 'Attacker leverages phishing foothold on accounting workstation WS-FIN-04 to request Kerberos Service Principal Names (SPNs) for offline cracking, then uses dumped Domain Admin credentials with PsExec to jump to Domain Controller DC01.',
    attackerProfile: {
      ip: '10.240.12.18',
      alias: 'APT29 Foothold (Cobalt Agent)',
      country: 'Internal Pivot (WS-FIN-04)',
      tool: 'Rubeus / Invoke-Kerberoast / PsExec'
    },
    targetProfile: {
      host: 'dc01.corp.internal',
      targetService: 'Active Directory Kerberos (Port 88) & SMB (Port 445)',
      user: 'svc_mssql_admin'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'TGS Ticket Request for High-Privilege SPNs',
        description: 'Event 4769: Kerberos ticket request with weak RC4 encryption (Ticket Encryption Type: 0x17)',
        logCount: 6
      },
      {
        stageNumber: 2,
        title: 'LSASS Memory Dumping via Mimikatz',
        description: 'Sysmon Event 10: Process access to lsass.exe by powershell.exe with granted access 0x1010',
        logCount: 5
      },
      {
        stageNumber: 3,
        title: 'Lateral Movement over SMB via PsExec Service Creation',
        description: 'Event 7045 & 4624: New service PSEXESVC installed on DC01 with elevated logon type 3',
        logCount: 8
      }
    ]
  },
  {
    id: 'c2_beaconing',
    name: 'Cobalt Strike C2 Beaconing & DNS Tunneling',
    category: 'Command and Control',
    severity: 'high',
    mitreTechniqueId: 'T1071.001',
    mitreTechniqueName: 'Application Layer Protocol: Web Protocols',
    mitreTactic: 'Command and Control',
    description: 'Compromised developer endpoint ws-eng-09 is establishing regular beaconing communication with a fast-flux C2 server disguised as Microsoft Azure telemetry, with DNS TXT staging.',
    attackerProfile: {
      ip: '198.51.100.42',
      alias: 'FIN7 / Carbanak C2',
      country: 'RO',
      tool: 'Cobalt Strike Malleable C2 v4.9'
    },
    targetProfile: {
      host: 'ws-eng-09.corp.internal',
      targetService: 'Outbound HTTPS (Port 443) & DNS (Port 53)',
      user: 'rpatel'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Periodic Heartbeat HTTP GET Requests',
        description: 'Synchronized requests every 30s (+-10% jitter) to static URI pattern /api/telemetry/sync',
        logCount: 14
      },
      {
        stageNumber: 2,
        title: 'High-Entropy DNS TXT Query Tunneling',
        description: 'Unusual long subdomains queried to autoritative nameserver ns1.azure-telemetry-live.com',
        logCount: 8
      }
    ]
  },
  {
    id: 'ransomware_precursor',
    name: 'Ransomware Precursor: Volume Shadow Deletion & Log Wipe',
    category: 'Defense Evasion',
    severity: 'critical',
    mitreTechniqueId: 'T1490',
    mitreTechniqueName: 'Inhibit System Recovery',
    mitreTactic: 'Defense Evasion',
    description: 'Attacker executes Living-off-the-Land commands (vssadmin, bcdedit, wevtutil) to destroy shadow copies, disable Windows recovery mode, and wipe the Security Event Log before commencing encryption.',
    attackerProfile: {
      ip: '10.240.15.99',
      alias: 'BlackCat / ALPHV Ransomware Affiliate',
      country: 'Internal Host (FILESRV-01)',
      tool: 'vssadmin.exe, wevtutil.exe, cmd.exe'
    },
    targetProfile: {
      host: 'filesrv-01.corp.internal',
      targetService: 'Volume Shadow Copy Service & Event Log Service',
      user: 'SYSTEM (NT AUTHORITY)'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Shadow Copy Deletion & Recovery Inhibition',
        description: 'Execution of vssadmin.exe delete shadows /all /quiet and bcdedit /set recoveryenabled no',
        logCount: 6
      },
      {
        stageNumber: 2,
        title: 'Security Event Log Cleared (EventID 1102)',
        description: 'Audit log wiped via wevtutil cl Security to hinder post-incident forensics',
        logCount: 2
      },
      {
        stageNumber: 3,
        title: 'Mass File Extension Renames (.locked)',
        description: 'Rapid file modification bursts across shared SMB storage directories',
        logCount: 10
      }
    ]
  },
  {
    id: 'insider_exfil',
    name: 'Privileged Insider Threat: Data Exfiltration via S3 / Mega',
    category: 'Exfiltration',
    severity: 'medium',
    mitreTechniqueId: 'T1567.002',
    mitreTechniqueName: 'Exfiltration Over Web Service: Cloud Storage',
    mitreTactic: 'Exfiltration',
    description: 'A departing employee in engineering accesses proprietary source code repositories during off-hours and stages a multi-gigabyte upload to a personal cloud storage endpoint via proxy bypass.',
    attackerProfile: {
      ip: '10.240.10.45',
      alias: 'Insider (Departing Dev)',
      country: 'Internal (ws-dev-12)',
      tool: 'rclone / curl CLI'
    },
    targetProfile: {
      host: 'gitlab.corp.internal & mega.io',
      targetService: 'Internal Git Server & Outbound HTTPS',
      user: 'mkowalski'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Abnormal Off-Hours Batch Git Clone',
        description: 'Over 40 repositories cloned consecutively within 12 minutes on Sunday 23:45',
        logCount: 7
      },
      {
        stageNumber: 2,
        title: 'High-Volume Outbound File Upload',
        description: 'Palo Alto firewall reports 18.4 GB egress traffic to 31.216.144.5 (mega.nz IP range)',
        logCount: 6
      }
    ]
  }
];
