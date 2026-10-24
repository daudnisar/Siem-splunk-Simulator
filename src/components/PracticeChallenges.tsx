import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, ArrowRight, Lightbulb, Search, BookOpen, Check } from 'lucide-react';
import { SOC_CHALLENGES } from '../data/challenges';
import { Challenge } from '../types/siem';

interface PracticeChallengesProps {
  onRunSPLInSearch: (query: string) => void;
}

export const PracticeChallenges: React.FC<PracticeChallengesProps> = ({
  onRunSPLInSearch
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(SOC_CHALLENGES[0].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, boolean | null>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const selectedChallenge = SOC_CHALLENGES.find(c => c.id === selectedChallengeId) || SOC_CHALLENGES[0];

  const handleInputChange = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
    // Reset evaluation for that question so user can retry
    setEvaluations(prev => ({ ...prev, [questionId]: null }));
  };

  const handleValidateQuestion = (questionId: string, correctAnswers: string[]) => {
    const userVal = (answers[questionId] || '').trim().toLowerCase();
    const isCorrect = correctAnswers.some(ans => userVal === ans.trim().toLowerCase());
    setEvaluations(prev => ({ ...prev, [questionId]: isCorrect }));
  };

  // Calculate total solved
  const totalQuestions = SOC_CHALLENGES.reduce((acc, c) => acc + c.questions.length, 0);
  const solvedCount = Object.values(evaluations).filter(v => v === true).length;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0b0f19]">
      {/* Left Sidebar: Challenges List */}
      <div className="w-80 border-r border-slate-800 bg-[#090e1c] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">SOC Analyst Labs</h2>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold tabular-nums">
              {solvedCount} / {totalQuestions} Solved
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.round((solvedCount / totalQuestions) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {SOC_CHALLENGES.map(ch => {
            const isSelected = ch.id === selectedChallengeId;
            const chSolved = ch.questions.filter(q => evaluations[q.id] === true).length;
            const isComplete = chSolved === ch.questions.length;
            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChallengeId(ch.id)}
                className={`p-4 cursor-pointer transition-colors space-y-1.5 ${
                  isSelected ? 'bg-[#121a30] border-l-2 border-emerald-400' : 'hover:bg-[#0d1424]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 uppercase">{ch.difficulty.split(' ')[0]}</span>
                  {isComplete ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="h-3 w-3" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 tabular-nums">{chSolved}/{ch.questions.length}</span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-slate-200">
                  {ch.title}
                </h3>

                <div className="text-[11px] text-slate-400">
                  Category: <span className="text-slate-300">{ch.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Challenge Mission & Questions */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0b0f19]">
        <div className="max-w-3xl space-y-6">
          {/* Mission Brief Header */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-emerald-400 font-medium">
                {selectedChallenge.difficulty} · {selectedChallenge.category}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {selectedChallenge.id}</span>
            </div>

            <h1 className="text-xl font-bold text-slate-100">
              {selectedChallenge.title}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedChallenge.description}
            </p>

            <div className="rounded-lg border border-slate-800 bg-[#090e1c] p-3 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Scenario Briefing &amp; Context
              </div>
              <p className="text-slate-300">{selectedChallenge.backgroundBrief}</p>
            </div>

            {/* Quick Pivot to SPL search with recommended query */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono truncate max-w-md">
                SPL: <span className="text-emerald-400">{selectedChallenge.recommendedSPL}</span>
              </div>
              <button
                onClick={() => onRunSPLInSearch(selectedChallenge.recommendedSPL)}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Launch Query in Search</span>
              </button>
            </div>
          </div>

          {/* Investigation Questions */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Investigation Objectives ({selectedChallenge.questions.length})
            </h2>

            {selectedChallenge.questions.map((q, idx) => {
              const evalResult = evaluations[q.id];
              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-5 space-y-3 transition-colors ${
                    evalResult === true
                      ? 'border-emerald-900/60 bg-emerald-950/10'
                      : evalResult === false
                      ? 'border-rose-900/60 bg-rose-950/10'
                      : 'border-slate-800 bg-[#0d1424]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                        Q{idx + 1}.
                      </span>
                      <h3 className="text-xs font-semibold text-slate-200 leading-snug">
                        {q.questionText}
                      </h3>
                    </div>

                    {evalResult === true && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Solved</span>
                      </span>
                    )}
                    {evalResult === false && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 shrink-0">
                        <XCircle className="h-4 w-4" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={e => handleInputChange(q.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleValidateQuestion(q.id, q.correctAnswers);
                      }}
                      placeholder={q.placeholder}
                      className="flex-1 rounded-lg border border-slate-700 bg-[#080d1a] px-3.5 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleValidateQuestion(q.id, q.correctAnswers)}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Verify Answer
                    </button>
                  </div>

                  {/* Feedback Explanation */}
                  {evalResult === true && (
                    <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                      <span className="font-semibold block mb-0.5">Analysis Verified:</span>
                      {q.explanation}
                    </div>
                  )}

                  {evalResult === false && (
                    <div className="rounded-lg border border-rose-900/40 bg-rose-950/30 p-3 text-xs text-rose-300">
                      <span className="font-semibold block mb-0.5">Not quite right:</span>
                      Review the raw events and search for the specific IOC or event ID. Check the hints below if stuck.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hints Accordion */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-3">
            <button
              onClick={() => setOpenHints(prev => ({ ...prev, [selectedChallenge.id]: !prev[selectedChallenge.id] }))}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Investigative Hints &amp; SPL Guidance ({selectedChallenge.hints.length})</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {openHints[selectedChallenge.id] ? 'Hide' : 'Show'}
              </span>
            </button>

            {openHints[selectedChallenge.id] && (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                {selectedChallenge.hints.map((hint, hi) => (
                  <div key={hi} className="flex items-start gap-2 text-slate-300">
                    <span className="text-amber-400 font-bold font-mono">·</span>
                    <span className="font-mono text-slate-300">{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
