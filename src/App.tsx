import React, { useState, useEffect, useRef } from 'react';
import { LogEvent, Incident, IncidentStatus } from './types/siem';
import { INITIAL_LOGS } from './data/seedLogs';
import { ATTACK_SCENARIOS } from './data/scenarios';
import { Header, ActiveTab } from './components/Header';
import { SplunkSearch } from './components/SplunkSearch';
import { SocDashboard } from './components/SocDashboard';
import { IncidentQueue } from './components/IncidentQueue';
import { AttackSimulatorPanel } from './components/AttackSimulatorPanel';
import { PracticeChallenges } from './components/PracticeChallenges';
import { EventDetailModal } from './components/EventDetailModal';
import { SplCheatSheetModal } from './components/SplCheatSheetModal';
import {
  generateRandomNormalEvent,
  generateAttackBurst,
  evaluateCorrelationRules
} from './services/simulationEngine';

export default function App() {
  const [logs, setLogs] = useState<LogEvent[]>(INITIAL_LOGS);
  const [incidents, setIncidents] = useState<Incident[]>(() => evaluateCorrelationRules(INITIAL_LOGS));
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [searchQuery, setSearchQuery] = useState<string>('*');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [selectedEventForModal, setSelectedEventForModal] = useState<LogEvent | null>(null);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);

  // Interval ref for real-time background log ingestion
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStreaming) {
      const intervalMs = Math.max(1200 / streamSpeed, 400);
      intervalRef.current = setInterval(() => {
        setLogs(prev => {
          const newEvent = generateRandomNormalEvent();
          // Keep up to 250 events in memory for fast reactivity
          const updated = [newEvent, ...prev.slice(0, 240)];
          return updated;
        });
      }, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming, streamSpeed]);

  // Re-evaluate correlation rules when attack logs change
  const triggerScenario = (scenarioId: string) => {
    const burstEvents = generateAttackBurst(scenarioId);
    setLogs(prev => {
      const updated = [...burstEvents, ...prev];
      // Update incidents
      const newIncidents = evaluateCorrelationRules(updated);
      setIncidents(prevIncidents => {
        // Merge without losing notes and containment status
        const merged = [...newIncidents];
        prevIncidents.forEach(oldInc => {
          const existingIdx = merged.findIndex(m => m.id === oldInc.id);
          if (existingIdx !== -1) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              status: oldInc.status,
              notes: oldInc.notes,
              containmentActionsTaken: oldInc.containmentActionsTaken
            };
          }
        });
        return merged;
      });
      return updated;
    });
  };

  const handleInjectCustomLog = (customData: Partial<LogEvent>) => {
    const customEvent: LogEvent = {
      id: `ev-custom-${Date.now()}`,
      _time: new Date().toISOString(),
      _raw: customData._raw || 'Custom log message',
      index: customData.index || 'web',
      sourcetype: customData.sourcetype || 'access_combined',
      host: customData.host || 'srv-custom-01',
      source: customData.source || 'manual_ingest',
      src_ip: customData.src_ip,
      dest_ip: customData.dest_ip,
      user: customData.user,
      action: customData.action || 'allowed',
      status: customData.status || 200,
      severity: customData.severity || 'informational'
    };
    setLogs(prev => [customEvent, ...prev]);
  };

  const handleResetLogs = () => {
    setLogs(INITIAL_LOGS);
    setIncidents(evaluateCorrelationRules(INITIAL_LOGS));
  };

  const handleUpdateIncidentStatus = (id: string, status: IncidentStatus) => {
    setIncidents(prev =>
      prev.map(inc => (inc.id === id ? { ...inc, status } : inc))
    );
  };

  const handleAddIncidentNote = (id: string, noteText: string) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === id) {
          return {
            ...inc,
            notes: [
              ...inc.notes,
              {
                timestamp: new Date().toISOString(),
                author: 'SOC Analyst (Daud)',
                text: noteText
              }
            ]
          };
        }
        return inc;
      })
    );
  };

  const handleTakeContainmentAction = (id: string, actionText: string) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === id) {
          const updatedActions = inc.containmentActionsTaken.includes(actionText)
            ? inc.containmentActionsTaken
            : [...inc.containmentActionsTaken, actionText];
          return {
            ...inc,
            status: 'contained',
            containmentActionsTaken: updatedActions,
            notes: [
              ...inc.notes,
              {
                timestamp: new Date().toISOString(),
                author: 'SOC Remediation Engine',
                text: `Containment action executed: ${actionText}`
              }
            ]
          };
        }
        return inc;
      })
    );
  };

  const handleHuntIncidentInSearch = (incident: Incident) => {
    const q = incident.attackerIp
      ? `src_ip="${incident.attackerIp}" OR host="${incident.affectedHost}"`
      : `host="${incident.affectedHost}"`;
    setSearchQuery(q);
    setActiveTab('search');
  };

  const handleNavigateToSearch = (q: string) => {
    setSearchQuery(q);
    setActiveTab('search');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        incidentCount={incidents.filter(i => i.status === 'new' || i.status === 'investigating').length}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        onQuickSimulate={() => triggerScenario('ssh_brute_force')}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'search' && (
          <SplunkSearch
            logs={logs}
            initialQuery={searchQuery}
            onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
            onSelectEvent={setSelectedEventForModal}
          />
        )}

        {activeTab === 'overview' && (
          <SocDashboard
            logs={logs}
            incidents={incidents}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToIncidents={() => setActiveTab('incidents')}
            onTriggerAttack={() => triggerScenario('web_sqli_dump')}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentQueue
            incidents={incidents}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onAddIncidentNote={handleAddIncidentNote}
            onTakeContainmentAction={handleTakeContainmentAction}
            onHuntIncidentInSearch={handleHuntIncidentInSearch}
          />
        )}

        {activeTab === 'simulator' && (
          <AttackSimulatorPanel
            onInjectScenario={triggerScenario}
            onInjectCustomLog={handleInjectCustomLog}
            onResetLogs={handleResetLogs}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
            streamSpeed={streamSpeed}
            onChangeSpeed={setStreamSpeed}
            logs={logs}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeChallenges
            onRunSPLInSearch={handleNavigateToSearch}
          />
        )}
      </div>

      {/* Event Details / CIM Inspector Modal */}
      <EventDetailModal
        event={selectedEventForModal}
        onClose={() => setSelectedEventForModal(null)}
        onPivotSearch={handleNavigateToSearch}
      />

      {/* Splunk SPL Reference & Cheat Sheet Modal */}
      <SplCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        onApplyQuery={handleNavigateToSearch}
      />
    </div>
  );
}
