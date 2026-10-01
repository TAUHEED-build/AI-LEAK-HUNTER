import React, { useState } from 'react';
import {
  FileSearch,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { FindingStatus, RevenueLeakFinding, Severity } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RevenueLeaksViewProps {
  findings: RevenueLeakFinding[];
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onInspectFinding: (finding: RevenueLeakFinding) => void;
  onUpdateStatus: (id: string, status: FindingStatus) => void;
}

export const RevenueLeaksView: React.FC<RevenueLeaksViewProps> = ({
  findings,
  currency,
  onInspectFinding,
  onUpdateStatus,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'impact-desc' | 'impact-asc' | 'confidence-desc' | 'title'>('impact-desc');

  // Extract unique categories
  const categories = Array.from(new Set(findings.map((f) => f.categoryLabel)));

  // Filter findings
  const filtered = findings.filter((f) => {
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && f.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && f.categoryLabel !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchExpl = f.shortExplanation.toLowerCase().includes(q);
      const matchCat = f.categoryLabel.toLowerCase().includes(q);
      const matchRecords = f.affectedRecords.some((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
      if (!matchTitle && !matchExpl && !matchCat && !matchRecords) return false;
    }
    return true;
  });

  // Sort findings
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'impact-desc') return b.estimatedImpact - a.estimatedImpact;
    if (sortBy === 'impact-asc') return a.estimatedImpact - b.estimatedImpact;
    if (sortBy === 'confidence-desc') return b.confidence - a.confidence;
    return a.title.localeCompare(b.title);
  });

  const totalFilteredImpact = sorted
    .filter((f) => f.status === 'INVESTIGATING')
    .reduce((sum, f) => sum + f.estimatedImpact, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Revenue Leaks & Financial Anomalies
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Audit, triage, and remediate identified leakage vectors. Every finding is verifiable with underlying database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
              Filtered Active Exposure
            </span>
            <span className="text-lg font-black text-rose-200">
              {formatCurrency(totalFilteredImpact, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search findings, accounts, or anomaly reasons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="INVESTIGATING">Investigating Only</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="IGNORED">Ignored Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="impact-desc">Sort: Highest Impact</option>
            <option value="impact-asc">Sort: Lowest Impact</option>
            <option value="confidence-desc">Sort: Highest Confidence</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-200">{sorted.length}</strong> of{' '}
            <strong className="text-slate-200">{findings.length}</strong> findings
          </span>
          {(selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Findings Table List */}
      <div className="space-y-3">
        {sorted.map((finding) => {
          const isResolved = finding.status === 'RESOLVED';
          const isIgnored = finding.status === 'IGNORED';

          return (
            <div
              key={finding.id}
              className={`rounded-xl border bg-slate-900/80 p-5 shadow-sm transition-all hover:border-slate-700 ${
                finding.severity === 'CRITICAL'
                  ? 'border-rose-500/30'
                  : finding.severity === 'HIGH'
                  ? 'border-amber-500/30'
                  : finding.severity === 'MEDIUM'
                  ? 'border-yellow-500/30'
                  : 'border-sky-500/30'
              } ${isResolved || isIgnored ? 'opacity-50 bg-slate-950/60' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left content */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : finding.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : finding.severity === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                      {finding.categoryLabel}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Confidence: <strong className="text-emerald-400">{finding.confidence}%</strong>
                    </span>
                    <span className="text-xs text-slate-500">
                      • {finding.affectedRecordsCount} Records
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {finding.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                    {finding.shortExplanation}
                  </p>

                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5 max-w-4xl">
                    <p className="text-xs text-slate-300">
                      <span className="font-semibold text-rose-400">Action: </span>
                      {finding.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Right controls: Impact & Buttons */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                      Estimated Exposure
                    </span>
                    <span className="text-xl font-black text-white">
                      {formatCurrency(finding.estimatedImpact, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={finding.status}
                      onChange={(e) => onUpdateStatus(finding.id, e.target.value as FindingStatus)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="IGNORED">Ignored</option>
                    </select>

                    {/* Inspect Button */}
                    <button
                      onClick={() => onInspectFinding(finding)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-2 text-sm font-semibold text-white">
              No revenue leaks found matching your filters
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting the severity, status, or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
