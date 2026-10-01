import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  FileText,
  Sparkles,
  RefreshCw,
  Search,
  Copy,
  Check,
  UserCheck,
  Lock,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { FindingStatus, RevenueLeakFinding } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AIInvestigationResponse, fetchAILeakInvestigation } from '../services/aiService';

interface InvestigationModalProps {
  finding: RevenueLeakFinding | null;
  isOpen: boolean;
  onClose: () => void;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onUpdateStatus: (id: string, status: FindingStatus) => void;
  onAddNote: (id: string, noteText: string) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  finding,
  isOpen,
  onClose,
  currency,
  onUpdateStatus,
  onAddNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiData, setAiData] = useState<AIInvestigationResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [copiedPlaybook, setCopiedPlaybook] = useState(false);

  useEffect(() => {
    if (finding && isOpen) {
      setSearchTerm('');
      setNewNote('');
      setIsLoadingAi(true);
      fetchAILeakInvestigation(finding)
        .then((res) => {
          setAiData(res);
          setIsLoadingAi(false);
        })
        .catch(() => {
          setIsLoadingAi(false);
        });
    }
  }, [finding?.id, isOpen]);

  if (!isOpen || !finding) return null;

  // Filter evidence records
  const evidenceRows = finding.affectedRecords || [];
  const filteredRows = evidenceRows.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const columns = evidenceRows.length > 0 ? Object.keys(evidenceRows[0]) : [];

  const handleCopyPlaybook = () => {
    if (!aiData) return;
    const text = `Playbook for: ${finding.title}\n` +
      `Estimated Financial Impact: ${formatCurrency(finding.estimatedImpact, currency)}\n\n` +
      `ROOT CAUSE:\n${aiData.rootCause}\n\n` +
      `ACTION PLAYBOOK:\n` +
      aiData.actionPlaybook.map((step, i) => `${i + 1}. ${step}`).join('\n') +
      `\n\nRECOMMENDED RULE:\n${aiData.mitigationAdvice}`;

    navigator.clipboard.writeText(text);
    setCopiedPlaybook(true);
    setTimeout(() => setCopiedPlaybook(false), 2000);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(finding.id, newNote.trim());
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 bg-slate-950/70 p-5">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
                {finding.categoryLabel}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                  finding.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : finding.severity === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : finding.severity === 'MEDIUM'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}
              >
                {finding.severity} SEVERITY
              </span>
              <span className="text-xs text-slate-500">• Rule: {finding.detectionRuleId}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight sm:text-xl">
              {finding.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metric Ribbons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Financial Impact */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Estimated Financial Impact
              </span>
              <p className="mt-1 text-2xl font-black text-rose-200">
                {formatCurrency(finding.estimatedImpact, currency)}
              </p>
              <p className="mt-0.5 text-[11px] text-rose-400/80">
                Potential direct capital recovery
              </p>
            </div>

            {/* Confidence Level */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detection Confidence
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {finding.confidence}%
                </span>
                <span className="text-xs text-slate-400">Deterministic Match</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Verified against business schema rules
              </p>
            </div>

            {/* Status & Human Action */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Investigation Status
              </span>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={finding.status}
                  onChange={(e) => onUpdateStatus(finding.id, e.target.value as FindingStatus)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="INVESTIGATING">🟡 Status: Inactive / Investigating</option>
                  <option value="RESOLVED">🟢 Status: Verified & Resolved</option>
                  <option value="IGNORED">⚪ Status: Ignored / False Alarm</option>
                </select>
              </div>
              <p className="mt-1.5 text-[10px] text-amber-400/90 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Human approval strictly required
              </p>
            </div>
          </div>

          {/* Section 1: WHY THIS WAS FLAGGED */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Why This Anomaly Was Flagged
            </h3>
            <p className="text-xs leading-relaxed text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {finding.whyDetected}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              {finding.detailedDescription}
            </p>
          </div>

          {/* Section 2: AI EXECUTIVE COPILOT & REMEDIATION PLAYBOOK */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  AI Root-Cause Analysis & Action Playbook
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPlaybook}
                  disabled={!aiData}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {copiedPlaybook ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPlaybook ? 'Copied' : 'Copy Playbook'}</span>
                </button>
              </div>
            </div>

            {isLoadingAi ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin text-rose-400" />
                <span>Synthesizing root cause and playbooks with Gemini 3.8 Flash...</span>
              </div>
            ) : aiData ? (
              <div className="space-y-4 text-xs">
                {/* Root Cause & Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
                    <span className="font-semibold text-rose-300 block mb-1">
                      Underlying Process Failure:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {aiData.rootCause}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
                    <span className="font-semibold text-amber-300 block mb-1">
                      Compound Risk Multiplier (30/60/90 Days):
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {aiData.riskMultiplier}
                    </p>
                  </div>
                </div>

                {/* Concrete Action Steps */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
                  <span className="font-semibold text-emerald-400 block mb-2">
                    Recommended Human Remediation Steps:
                  </span>
                  <div className="space-y-2">
                    {aiData.actionPlaybook.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section 3: EVIDENCE & UNDERLYING RECORDS */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  Culprit Records & Evidence ({finding.affectedRecordsCount} Records)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {finding.evidenceSummary}
                </p>
              </div>

              {/* In-table Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-full sm:w-48"
                />
              </div>
            </div>

            {/* Evidence Data Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-3.5 py-2.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-800/40 transition-colors font-mono"
                    >
                      {columns.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3.5 py-2.5 whitespace-nowrap text-slate-200"
                        >
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length || 1}
                        className="p-6 text-center text-slate-500"
                      >
                        No matching evidence records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: RECOMMENDED PRACTICAL BUSINESS ACTION */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Mandatory Human Governance Rule
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {finding.recommendedAction}
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              Safety Enforcement: AI Revenue Leak Hunter provides verifiable detection and decision playbooks. The system never executes automatic debiting, customer emails, or invoice voiding without direct human review.
            </p>
          </div>

          {/* Section 5: AUDIT LOG & INTERNAL NOTES */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Internal Audit Notes & Stakeholder Log
            </h3>

            {/* Existing Notes */}
            <div className="space-y-2">
              {finding.notes && finding.notes.length > 0 ? (
                finding.notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span className="font-semibold text-slate-300">{n.author}</span>
                      <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200">{n.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No notes recorded yet. Add investigative findings or assignee updates below.
                </p>
              )}
            </div>

            {/* Add note input */}
            <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log internal note (e.g. 'Spoke to VP Finance, PO expected by Friday')..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="text-xs text-slate-400">
            Detected: {new Date(finding.createdAt).toLocaleDateString()} • Rule ID: {finding.detectionRuleId}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onUpdateStatus(finding.id, finding.status === 'RESOLVED' ? 'INVESTIGATING' : 'RESOLVED');
                onClose();
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                finding.status === 'RESOLVED'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {finding.status === 'RESOLVED' ? 'Re-open Investigation' : 'Mark Finding as Resolved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
