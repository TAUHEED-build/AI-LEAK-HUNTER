import React from 'react';
import {
  Printer,
  Download,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AuditMetrics, RevenueLeakFinding } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';
import { AIExecutiveSummaryResponse } from '../services/aiService';

interface ReportsViewProps {
  metrics: AuditMetrics;
  findings: RevenueLeakFinding[];
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  activeDatasetName: string;
  aiBriefing: AIExecutiveSummaryResponse | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  findings,
  currency,
  activeDatasetName,
  aiBriefing,
}) => {
  const activeFindings = findings.filter((f) => f.status === 'INVESTIGATING');
  const resolvedFindings = findings.filter((f) => f.status === 'RESOLVED');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      reportTitle: 'AI Revenue Leak Hunter - Executive Audit Report',
      generatedAt: new Date().toISOString(),
      datasetName: activeDatasetName,
      metrics: {
        totalRevenueAnalyzed: metrics.totalRevenueAnalyzed,
        potentialRevenueAtRisk: metrics.potentialRevenueAtRisk,
        activeRevenueLeaks: metrics.activeRevenueLeaks,
        highPriorityFindings: metrics.highPriorityFindings,
        overdueAmount: metrics.overdueAmount,
        dormantOpportunityValue: metrics.dormantOpportunityValue,
        resolvedRecoveredValue: metrics.resolvedRecoveredValue,
      },
      aiExecutiveBriefing: aiBriefing,
      findings: findings.map((f) => ({
        id: f.id,
        category: f.category,
        categoryLabel: f.categoryLabel,
        title: f.title,
        severity: f.severity,
        status: f.status,
        estimatedImpact: f.estimatedImpact,
        confidence: f.confidence,
        shortExplanation: f.shortExplanation,
        whyDetected: f.whyDetected,
        evidenceSummary: f.evidenceSummary,
        recommendedAction: f.recommendedAction,
        affectedRecordsCount: f.affectedRecordsCount,
        culpritRecordsSample: f.affectedRecords.slice(0, 5),
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_leak_audit_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadCSV = () => {
    const headers = 'ID,Category,Severity,Status,Estimated_Impact,Confidence_Percent,Title,Why_Detected,Recommended_Action\n';
    const rows = findings
      .map((f) => {
        const clean = (str: string) => `"${str.replace(/"/g, '""')}"`;
        return [
          f.id,
          clean(f.categoryLabel),
          f.severity,
          f.status,
          f.estimatedImpact,
          f.confidence,
          clean(f.title),
          clean(f.whyDetected),
          clean(f.recommendedAction),
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_leaks_summary_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Report Actions Bar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Executive Revenue Leakage Audit Report
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Formal C-suite audit ready for print, PDF export, or internal board distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 sm:p-12 shadow-xl print:border-none print:bg-white print:text-black print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-800 pb-8 print:border-neutral-300">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md print:bg-neutral-900">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white print:text-neutral-950 sm:text-2xl">
                  AI Revenue Leak Hunter
                </h2>
                <p className="text-xs text-slate-400 print:text-neutral-600">
                  Autonomous Financial Leakage Audit & Receivables Diagnostic
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 print:text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Target Dataset: <strong className="text-slate-200 print:text-neutral-900">{activeDatasetName}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Audit Date: <strong className="text-slate-200 print:text-neutral-900">{new Date().toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-right print:border-neutral-300 print:bg-neutral-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 print:text-neutral-700 block">
              Total Capital Exposure Flagged
            </span>
            <span className="text-2xl font-black text-rose-200 print:text-neutral-950">
              {formatExactCurrency(metrics.potentialRevenueAtRisk, currency)}
            </span>
            <span className="text-[10px] text-slate-400 print:text-neutral-500 block mt-0.5">
              Verified deterministic calculation
            </span>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-400 print:text-neutral-700" />
            1. Executive Audit Summary
          </h3>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 print:border-neutral-300 print:bg-neutral-50">
            <p className="text-xs leading-relaxed text-slate-300 print:text-neutral-800">
              {aiBriefing?.summary ||
                `The automated audit of ${activeDatasetName} identified ${metrics.activeRevenueLeaks} active financial leakage vectors placing ${formatExactCurrency(metrics.potentialRevenueAtRisk, currency)} at immediate risk. Primary capital drains stem from overdue accounts receivable (${formatExactCurrency(metrics.overdueAmount, currency)}) and neglected high-intent commercial leads (${formatExactCurrency(metrics.dormantOpportunityValue, currency)}).`}
            </p>
          </div>
        </div>

        {/* Audit Metrics Summary Grid */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-neutral-900">
            2. High-Level Financial Exposure Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 print:border-neutral-300">
              <span className="text-[10px] font-semibold text-slate-400 uppercase print:text-neutral-600 block">
                Total Revenue Audited
              </span>
              <span className="text-lg font-bold text-white print:text-neutral-900">
                {formatExactCurrency(metrics.totalRevenueAnalyzed, currency)}
              </span>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 p-3.5 print:border-neutral-300">
              <span className="text-[10px] font-semibold text-rose-400 uppercase print:text-neutral-600 block">
                Revenue at Risk
              </span>
              <span className="text-lg font-bold text-rose-200 print:text-neutral-900">
                {formatExactCurrency(metrics.potentialRevenueAtRisk, currency)}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 print:border-neutral-300">
              <span className="text-[10px] font-semibold text-amber-400 uppercase print:text-neutral-600 block">
                Overdue Receivables
              </span>
              <span className="text-lg font-bold text-amber-200 print:text-neutral-900">
                {formatExactCurrency(metrics.overdueAmount, currency)}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 print:border-neutral-300">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase print:text-neutral-600 block">
                Cold Pipeline Value
              </span>
              <span className="text-lg font-bold text-cyan-200 print:text-neutral-900">
                {formatExactCurrency(metrics.dormantOpportunityValue, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Findings Table */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-neutral-900">
            3. Prioritized Financial Findings Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 print:border-neutral-300">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-[10px] uppercase font-bold text-slate-400 print:bg-neutral-100 print:text-neutral-700">
                <tr>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Finding Description</th>
                  <th className="p-3">Impact</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-neutral-200 text-slate-300 print:text-neutral-800">
                {findings.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="p-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : f.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : f.severity === 'MEDIUM'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white print:text-neutral-900">
                      {f.categoryLabel}
                    </td>
                    <td className="p-3 max-w-sm">
                      <p className="font-medium text-slate-200 print:text-neutral-900">{f.title}</p>
                      <p className="text-[11px] text-slate-400 print:text-neutral-600 mt-0.5">{f.shortExplanation}</p>
                    </td>
                    <td className="p-3 font-bold text-white print:text-neutral-950 whitespace-nowrap">
                      {formatCurrency(f.estimatedImpact, currency)}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 print:text-neutral-900">
                      {f.confidence}%
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700 print:border-neutral-400 print:bg-white print:text-neutral-800">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Action Agenda */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-neutral-900">
            4. Recommended Action Playbook (Human Approval Required)
          </h3>
          <div className="space-y-3">
            {activeFindings.slice(0, 5).map((f, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 print:border-neutral-300 print:bg-neutral-50"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-rose-300 print:text-neutral-950">
                    {idx + 1}. {f.categoryLabel}: {f.title}
                  </span>
                  <span className="font-semibold text-white print:text-neutral-900">
                    Impact: {formatCurrency(f.estimatedImpact, currency)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 print:text-neutral-800 mt-1 leading-relaxed">
                  <strong>Action Required: </strong>
                  {f.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Governance & Sign-off footer */}
        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500 print:border-neutral-300 print:text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>AI Revenue Leak Hunter • Confidential Financial Audit</span>
          </div>
          <div>
            <span>Audit Verified • Lead Architect: Cairn • Ash (Tauheed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
