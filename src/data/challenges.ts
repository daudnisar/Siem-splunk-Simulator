import { Challenge } from '../types/siem';

export const SOC_CHALLENGES: Challenge[] = [
  {
    id: 'chal-01-brute-force',
    title: 'Incident 101: Investigating VPN Credential Spraying',
    difficulty: 'Tier 1 (Junior Analyst)',
    category: 'Credential Access',
    description: 'A surge of failed authentication warnings occurred on the edge VPN gateway. Determine the external threat actor IP, identify which user account was breached, and locate the timestamp of successful entry.',
    backgroundBrief: 'At 17:52 UTC, an external address started brute forcing multiple credentials against vpn-gw-01. As a SOC analyst, search the "security" index or "linux_secure" sourcetype to uncover the attacker details.',
    hints: [
      'Try searching: index=security sourcetype=linux_secure "Failed password"',
      'Use stats: index=security sourcetype=linux_secure | stats count by src_ip, user, action',
      'Look for the accepted authentication following failures: index=security "Accepted password"'
    ],
    recommendedSPL: 'index=security sourcetype=linux_secure | stats count by src_ip, user, action | sort -count',
    questions: [
      {
        id: 'q1',
        questionText: 'What is the external source IP address conducting the brute force attack?',
        placeholder: 'e.g. 192.168.1.1',
        correctAnswers: ['45.142.122.84'],
        explanation: 'The IP 45.142.122.84 initiated consecutive failed password attempts on SSH/VPN port 22.'
      },
      {
        id: 'q2',
        questionText: 'Which legitimate user account did the attacker successfully compromise?',
        placeholder: 'e.g. admin, user',
        correctAnswers: ['jsmith'],
        explanation: 'After guessing admin and root, the attacker hit the correct password for user "jsmith".'
      },
      {
        id: 'q3',
        questionText: 'What is the MITRE ATT&CK Technique ID for this initial password guessing technique?',
        placeholder: 'e.g. T1110 or T1110.001',
        correctAnswers: ['t1110', 't1110.001'],
        explanation: 'T1110.001 is Brute Force: Password Guessing under the Credential Access tactic.'
      }
    ]
  },
  {
    id: 'chal-02-sqli-api',
    title: 'Incident 102: Web Application SQL Injection & Data Dump',
    difficulty: 'Tier 1 (Junior Analyst)',
    category: 'Web Security',
    description: 'An alert from the DMZ Suricata IDS reported a high severity SQL injection probe targeting the customer portal. Analyze the web access logs to identify the attacker tool, the target endpoint, and the extracted table name.',
    backgroundBrief: 'The web application srv-web-prod01 was targeted with database injection queries. Search the web index and identify the exact user agent string and injected payload.',
    hints: [
      'Search the web index: index=web sourcetype=access_combined status>=400 OR "UNION"',
      'Identify user-agent: index=web | stats count by user_agent, src_ip',
      'Inspect the raw URI query: index=web host=srv-web-prod01 | table _time, src_ip, uri_path, uri_query'
    ],
    recommendedSPL: 'index=web "UNION SELECT" | table _time, src_ip, uri_path, uri_query, user_agent, status',
    questions: [
      {
        id: 'q1',
        questionText: 'What is the IP address of the attacker executing SQL injection?',
        placeholder: 'e.g. 10.0.0.1',
        correctAnswers: ['185.220.101.5'],
        explanation: '185.220.101.5 (a known Tor Exit node) sent automated payloads to /api/v1/catalog.'
      },
      {
        id: 'q2',
        questionText: 'What automated security scanner / exploit tool was identified in the User-Agent header?',
        placeholder: 'e.g. nmap, nikto, sqlmap',
        correctAnswers: ['sqlmap', 'sqlmap/1.7#stable'],
        explanation: 'The User-Agent string explicitly revealed sqlmap/1.7#stable.'
      },
      {
        id: 'q3',
        questionText: 'Which sensitive database table was the attacker attempting to dump via UNION SELECT?',
        placeholder: 'e.g. accounts, users, customers',
        correctAnswers: ['users', 'users--', 'user'],
        explanation: 'The payload query was: id=1 UNION SELECT username, password_hash FROM users--'
      }
    ]
  },
  {
    id: 'chal-03-kerberoast-lateral',
    title: 'Incident 201: Active Directory Kerberoasting & PsExec Pivot',
    difficulty: 'Tier 2 (Senior Analyst)',
    category: 'Lateral Movement',
    description: 'Suspicious PowerShell execution on workstation ws-fin-04 was followed by privileged Kerberos ticket requests and service installations on Domain Controller DC01. Trace the lateral movement path.',
    backgroundBrief: 'A compromised internal user account was leveraged to extract Kerberos TGS tickets and deploy lateral movement services. Correlate Windows Security Event IDs 4769 and 7045.',
    hints: [
      'Search for Kerberos requests: index=security event_id=4769',
      'Search for service creation: index=endpoint (event_id=7045 OR "PSEXESVC")',
      'Find the compromised service account: index=security event_id=4769 | stats count by user, host'
    ],
    recommendedSPL: 'index=endpoint (event_id=1 OR event_id=7045) | table _time, host, process_name, command_line, user',
    questions: [
      {
        id: 'q1',
        questionText: 'What is the internal IP address of the originating compromised workstation?',
        placeholder: 'e.g. 10.240.x.x',
        correctAnswers: ['10.240.12.18'],
        explanation: 'Workstation ws-fin-04 with IP 10.240.12.18 issued the malicious Kerberos and SMB requests.'
      },
      {
        id: 'q2',
        questionText: 'Which Windows Service executable was installed on DC01 to achieve remote execution?',
        placeholder: 'e.g. service.exe',
        correctAnswers: ['psexesvc.exe', 'psexesvc'],
        explanation: 'PSEXESVC.exe was installed via Windows Event ID 7045 to execute commands remotely.'
      },
      {
        id: 'q3',
        questionText: 'Which service account SPN was targeted during the Kerberoasting request?',
        placeholder: 'e.g. svc_account',
        correctAnswers: ['svc_mssql_admin', 'svc_mssql_admin@corp.internal'],
        explanation: 'Event 4769 shows ticket requested for svc_mssql_admin with weak RC4 encryption (0x17).'
      }
    ]
  },
  {
    id: 'chal-04-ransomware-vssadmin',
    title: 'Incident 202: Ransomware Inhibit System Recovery (vssadmin)',
    difficulty: 'Tier 2 (Senior Analyst)',
    category: 'Defense Evasion',
    description: 'An endpoint security alert fired on filesrv-01 indicating shadow copy destruction. Investigate the process command line and verify if any audit logs were tampered with.',
    backgroundBrief: 'Threat actors commonly execute commands to eliminate recovery options prior to detonating ransomware. Check Sysmon Event 1 and Windows Event 1102.',
    hints: [
      'Search Sysmon process commands: index=endpoint sourcetype="WinEventLog:Sysmon" vssadmin',
      'Search for cleared event logs: index=security event_id=1102',
      'Look up the command line arguments used with vssadmin'
    ],
    recommendedSPL: 'index=endpoint OR index=security host=filesrv-01 | table _time, event_id, process_name, command_line, signature',
    questions: [
      {
        id: 'q1',
        questionText: 'What exact command-line was executed to delete the Windows volume shadow copies?',
        placeholder: 'e.g. vssadmin delete ...',
        correctAnswers: ['vssadmin.exe delete shadows /all /quiet', 'vssadmin delete shadows /all /quiet'],
        explanation: 'vssadmin.exe delete shadows /all /quiet was executed to silently destroy all restore points.'
      },
      {
        id: 'q2',
        questionText: 'Which Windows Event ID indicates that the Security Audit Log was cleared?',
        placeholder: 'e.g. 4624, 1102',
        correctAnswers: ['1102'],
        explanation: 'Event ID 1102 ("The audit log was cleared") is a high-confidence indicator of forensic evidence destruction.'
      }
    ]
  }
];
