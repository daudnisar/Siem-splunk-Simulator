# SIEM & Splunk SOC Attack Simulator

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

An enterprise-grade Security Information and Event Management (SIEM) and Security Operations Center (SOC) attack simulator. Designed for security engineers, SOC analysts, and cybersecurity students to practice real-world log monitoring, threat hunting, Splunk Search Processing Language (SPL) queries, and incident triage locally.

---

## Key Features

- **Splunk SPL Query Engine**:
  - Full search syntax: boolean operators (`AND`, `OR`, `NOT`), wildcards (`src_ip="185.220.*"`), status filtering (`status>=400`).
  - Native pipeline commands: `| stats`, `| table`, `| where`, `| top`, `| rare`, `| sort`, `| head`, `| dedup`.
  - Splunk fields sidebar with real-time value distributions, percentages, and `[+]` / `[-]` filter injection.
  - Interactive event timeline histogram with benign vs. attack activity breakdown.
  - Raw event inspector with normalized Common Information Model (CIM) key-value extraction.

- **Real-Time Multi-Stage Attack Simulator**:
  - **SSH / VPN Credential Spraying** (`T1110.001` - Brute Force).
  - **Web Application SQL Injection & Data Dump** (`T1190` - Exploit Public-Facing Application).
  - **Active Directory Kerberoasting & Lateral Movement** (`T1003.001`, `T1021.002` - LSASS Memory / SMB PsExec).
  - **Command & Control Beaconing** (`T1071.001` - Web Protocols).
  - **Ransomware Precursor & Recovery Inhibition** (`T1490`, `T1070.001` - Volume Shadow Deletion & Event Log Clearing).
  - Custom log injector & raw dataset export (CSV and JSON).

- **SOC Notable Incidents Queue**:
  - Automated correlation rules engine mapping raw log telemetry to prioritized security incidents.
  - Incident response lifecycle workflow (`New` &rarr; `Under Investigation` &rarr; `Contained` &rarr; `Closed`).
  - Active containment playbooks: host network isolation, firewall IP block rules, Active Directory password resets, and session revocations.
  - Case timeline notebook for analyst notes.

- **SOC Practice Labs (Tier 1 & Tier 2 Challenges)**:
  - Hands-on guided investigation missions based on actual enterprise scenarios.
  - Progressive hints, recommended SPL queries, and instant objective answer validation.

---

## Quick Start (Run Locally on Your Machine)

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `bun` / `pnpm` / `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/siem-soc-simulator.git
   cd siem-soc-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port displayed in your terminal).

---

## Production Build

To build the static application for production deployment:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Splunk SPL Query Examples

Try running these real queries inside the simulator's **Search & SPL** bar:

```spl
# 1. Detect failed SSH logins on edge gateways
index=security sourcetype=linux_secure "Failed password" | stats count by src_ip, user | sort -count

# 2. Hunt for SQL injection attempts against web services
index=web "UNION SELECT" OR "OR 1=1" | table _time, src_ip, uri_path, uri_query, status

# 3. Aggregate top 5 external talkers
| stats count by src_ip | sort -count | head 5

# 4. Spot Living-off-the-Land (LOLBin) process executions
index=endpoint sourcetype="WinEventLog:Sysmon" process_name="vssadmin.exe" OR process_name="powershell.exe"

# 5. Hunt for Kerberos TGS ticket requests with weak RC4 encryption
index=security event_id=4769 | stats count by user, host
```

---

## Project Structure

```text
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # SOC navigation & stream controls
│   │   ├── SplunkSearch.tsx           # Search interface, fields sidebar & histogram
│   │   ├── SocDashboard.tsx           # Telemetry metrics & MITRE matrix
│   │   ├── IncidentQueue.tsx          # Notable events triage & containment playbook
│   │   ├── AttackSimulatorPanel.tsx   # Attack scenario injector & custom log testbed
│   │   ├── PracticeChallenges.tsx     # Tier 1 & Tier 2 SOC analyst training labs
│   │   ├── EventDetailModal.tsx       # Raw log and CIM field inspector
│   │   └── SplCheatSheetModal.tsx     # Splunk SPL reference guide
│   ├── data/
│   │   ├── challenges.ts              # Training challenges and questions
│   │   ├── scenarios.ts               # Multi-stage attack profiles & MITRE techniques
│   │   └── seedLogs.ts                # Initial enterprise baseline logs
│   ├── services/
│   │   ├── simulationEngine.ts        # Real-time background stream & correlation engine
│   │   └── splEngine.ts               # SPL query parser, pipe executor, and aggregations
│   ├── types/
│   │   └── siem.ts                    # TypeScript types and data models
│   ├── App.tsx                        # Root application state & router
│   ├── index.css                      # Tailwind styles and dark theme overrides
│   └── main.tsx                       # React DOM entry point
├── package.json                       # Dependencies and project scripts
├── tsconfig.json                      # TypeScript configuration
└── vite.config.ts                     # Vite build configuration
```

---

## License

This project is licensed under the Apache-2.0 License.
