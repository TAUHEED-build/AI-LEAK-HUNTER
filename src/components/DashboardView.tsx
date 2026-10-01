import React from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Flame,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Info,
  Layers,
} from 'lucide-react';
import { AuditMetrics, FindingStatus, RevenueLeakFinding, Severity } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AIExecutiveSummaryResponse } from '../services/aiService';

interface DashboardViewProps {
  metrics: AuditMetrics;
  findings: RevenueLeakFinding[];
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onInspectFinding: (finding: RevenueLeakFinding) => void;
  onUpdateStatus: (id: string, newStatus: FindingStatus) => void;
  aiBriefing: AIExecutiveSummaryResponse | null;
  isLoadingAi: boolean;
  onRegenerateAi: () => void;
  insufficientDataCategories: string[];
  onGoToUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  findings,
  currency,
  onInspectFinding,
  onUpdateStatus,
  aiBriefing,
  isLoadingAi,
  onRegenerateAi,
  insufficientDataCategories,
  onGoToUpload,
}) => {
  // Group findings by severity
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL');
  const highFindings = findings.filter((f) => f.severity === 'HIGH');
  const mediumFindings = findings.filter((f) => f.severity === 'MEDIUM');
  const lowFindings = findings.filter((f) => f.severity === 'LOW');

  const riskRatio =
    metrics.totalRevenueAnalyzed > 0
      ? ((metrics.potentialRevenueAtRisk / metrics.totalRevenueAnalyzed) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Welcome context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Revenue Leakage Diagnostic
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Automated deterministic audit of receivables, dormant sales pipeline, billing discrepancies, and customer churn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">Audit Status: Complete</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{findings.length} Anomalies Flagged</span>
          </div>
          <button
            onClick={onGoToUpload}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Upload New File
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Metric 1: Total Revenue Analyzed */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Revenue Analyzed</span>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.totalRevenueAnalyzed, currency)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Total ledger volume verified
          </p>
        </div>

        {/* Metric 2: Potential Revenue at Risk (Highlighted) */}
        <div className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium">
            <span>Potential Revenue at Risk</span>
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-200 tracking-tight">
            {formatCurrency(metrics.potentialRevenueAtRisk, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
            <span>{riskRatio}% of total revenue</span>
          </div>
        </div>

        {/* Metric 3: Active Revenue Leaks */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Leaks</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tracking-tight">
            {metrics.activeRevenueLeaks}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Requiring human review
          </p>
        </div>

        {/* Metric 4: High Priority Findings */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>High Priority</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">
            {metrics.highPriorityFindings}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Critical & High severity
          </p>
        </div>

        {/* Metric 5: Overdue Receivables */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overdue Amount</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-300 tracking-tight">
            {formatCurrency(metrics.overdueAmount, currency)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Past due receivables
          </p>
        </div>

        {/* Metric 6: Dormant Pipeline Value */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Dormant Pipeline</span>
            <Briefcase className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-300 tracking-tight">
            {formatCurrency(metrics.dormantOpportunityValue, currency)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Untouched high-intent deals
          </p>
        </div>
      </div>

      {/* AI Executive Briefing Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">
                  AI Executive Intelligence Briefing
                </h2>
                {aiBriefing?.isFallback ? (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    Deterministic Engine
                  </span>
                ) : (
                  <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                    Gemini 3.8 Flash Synthesis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Strategic root-cause analysis synthesized across all flagged financial records.
              </p>
            </div>
          </div>

          <button
            onClick={onRegenerateAi}
            disabled={isLoadingAi}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAi ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
            <span>{isLoadingAi ? 'Synthesizing...' : 'Regenerate Briefing'}</span>
          </button>
        </div>

        {/* AI Briefing Content */}
        {aiBriefing && (
          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm leading-relaxed text-slate-200">
                {aiBriefing.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Observations */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Key Vulnerabilities Identified
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {aiBriefing.keyRiskObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Priorities */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Immediate Executive Actions (Next 48 Hours)
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {aiBriefing.strategicPriorities.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-semibold">{idx + 1}.</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Severity Breakdown Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Leak Severity Distribution
          </span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Critical: {criticalFindings.length}
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              High: {highFindings.length}
            </span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              Medium: {mediumFindings.length}
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Low: {lowFindings.length}
            </span>
          </div>
        </div>

        {/* Proportional Bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          {findings.length > 0 ? (
            <>
              <div
                style={{ width: `${(criticalFindings.length / findings.length) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
              />
              <div
                style={{ width: `${(highFindings.length / findings.length) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
              />
              <div
                style={{ width: `${(mediumFindings.length / findings.length) * 100}%` }}
                className="bg-yellow-500 transition-all duration-500"
              />
              <div
                style={{ width: `${(lowFindings.length / findings.length) * 100}%` }}
                className="bg-sky-500 transition-all duration-500"
              />
            </>
          ) : (
            <div className="h-full w-full bg-slate-800" />
          )}
        </div>
      </div>

      {/* Insufficient Data Warning (if applicable) */}
      {insufficientDataCategories.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-slate-300">
                Data Sufficiency Notice
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                The current uploaded data lacks necessary attributes to evaluate the following checks (values are never fabricated):
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insufficientDataCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-700/60"
                  >
                    Insufficient data to determine: {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVENUE LEAK OVERVIEW GROUPED BY SEVERITY */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Revenue Leak Overview
          </h2>
          <span className="text-xs text-slate-400">
            Grouped by financial risk severity • Click card to inspect evidence
          </span>
        </div>

        {/* 1. CRITICAL SEVERITY SECTION */}
        {criticalFindings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-900/40 pb-2">
              <span className="flex h-5 items-center rounded bg-rose-500/10 px-2 text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">
                CRITICAL SEVERITY ({criticalFindings.length})
              </span>
              <span className="text-xs text-slate-400">Immediate top-priority financial drain</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  currency={currency}
                  onInspect={() => onInspectFinding(finding)}
                  onUpdateStatus={(st) => onUpdateStatus(finding.id, st)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. HIGH SEVERITY SECTION */}
        {highFindings.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 border-b border-amber-900/40 pb-2">
              <span className="flex h-5 items-center rounded bg-amber-500/10 px-2 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                HIGH SEVERITY ({highFindings.length})
              </span>
              <span className="text-xs text-slate-400">Substantial revenue erosion and workflow risk</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  currency={currency}
                  onInspect={() => onInspectFinding(finding)}
                  onUpdateStatus={(st) => onUpdateStatus(finding.id, st)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. MEDIUM SEVERITY SECTION */}
        {mediumFindings.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 border-b border-yellow-900/40 pb-2">
              <span className="flex h-5 items-center rounded bg-yellow-500/10 px-2 text-xs font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/20">
                MEDIUM SEVERITY ({mediumFindings.length})
              </span>
              <span className="text-xs text-slate-400">Operational friction and velocity slowdowns</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediumFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  currency={currency}
                  onInspect={() => onInspectFinding(finding)}
                  onUpdateStatus={(st) => onUpdateStatus(finding.id, st)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. LOW SEVERITY SECTION */}
        {lowFindings.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 border-b border-sky-900/40 pb-2">
              <span className="flex h-5 items-center rounded bg-sky-500/10 px-2 text-xs font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20">
                LOW SEVERITY ({lowFindings.length})
              </span>
              <span className="text-xs text-slate-400">Minor ledger variances and data hygiene items</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  currency={currency}
                  onInspect={() => onInspectFinding(finding)}
                  onUpdateStatus={(st) => onUpdateStatus(finding.id, st)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Finding Card Component
interface FindingCardProps {
  finding: RevenueLeakFinding;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onInspect: () => void;
  onUpdateStatus: (newStatus: FindingStatus) => void;
}

const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  currency,
  onInspect,
  onUpdateStatus,
}) => {
  const isResolved = finding.status === 'RESOLVED';
  const isIgnored = finding.status === 'IGNORED';

  const severityBorder =
    finding.severity === 'CRITICAL'
      ? 'border-rose-500/40 hover:border-rose-500'
      : finding.severity === 'HIGH'
      ? 'border-amber-500/40 hover:border-amber-500'
      : finding.severity === 'MEDIUM'
      ? 'border-yellow-500/40 hover:border-yellow-500'
      : 'border-sky-500/40 hover:border-sky-500';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-slate-900/80 p-5 shadow-sm transition-all duration-200 ${severityBorder} ${
        isResolved || isIgnored ? 'opacity-60 bg-slate-950/50' : ''
      }`}
    >
      <div>
        {/* Top line: Category and Impact */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700/60">
              {finding.categoryLabel}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                finding.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400'
                  : finding.severity === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400'
                  : finding.severity === 'MEDIUM'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              {finding.severity}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Estimated Impact
            </span>
            <span className="text-base font-extrabold text-white tracking-tight">
              {formatCurrency(finding.estimatedImpact, currency)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition-colors">
          {finding.title}
        </h3>

        {/* Short explanation */}
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {finding.shortExplanation}
        </p>

        {/* Confidence & Affected records */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Confidence:</span>
            <span className="font-semibold text-emerald-400">{finding.confidence}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Culprit Records:</span>
            <span className="font-semibold text-slate-200">{finding.affectedRecordsCount}</span>
          </div>
        </div>

        {/* Recommended Action snippet */}
        <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/70 p-2.5">
          <p className="text-[11px] text-slate-300">
            <span className="font-semibold text-rose-400">Recommended Action: </span>
            {finding.recommendedAction}
          </p>
        </div>
      </div>

      {/* Card Footer: Status control + Inspect button */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Status:</span>
          <select
            value={finding.status}
            onChange={(e) => onUpdateStatus(e.target.value as FindingStatus)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="IGNORED">Ignored</option>
          </select>
        </div>

        {/* Inspect Finding Button */}
        <button
          onClick={onInspect}
          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Inspect Evidence</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
