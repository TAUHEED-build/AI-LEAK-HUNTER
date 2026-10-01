import React from 'react';
import {
  ShieldAlert,
  BarChart3,
  UploadCloud,
  FileSearch,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Printer,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'upload' | 'leaks' | 'reports' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'upload' | 'leaks' | 'reports' | 'settings') => void;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  setCurrency: (c: 'INR' | 'USD' | 'EUR' | 'GBP') => void;
  activeDatasetName: string;
  isDemoActive: boolean;
  onResetDemo: () => void;
  onOpenReport: () => void;
  activeLeaksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currency,
  setCurrency,
  activeDatasetName,
  isDemoActive,
  onResetDemo,
  onOpenReport,
  activeLeaksCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-950/40">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-100 text-lg">
                AI Revenue Leak Hunter
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-400 border border-rose-500/20">
                AUDIT MVP
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-400">
              Find where your business is losing money — before the leak gets bigger.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('upload')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentTab === 'upload'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span className="hidden sm:inline">Data Ingestion</span>
          </button>

          <button
            onClick={() => setCurrentTab('leaks')}
            className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentTab === 'leaks'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue Leaks</span>
            {activeLeaksCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {activeLeaksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentTab === 'reports'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Report</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentTab === 'settings'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Thresholds</span>
          </button>
        </nav>

        {/* Global Controls & Dataset Info */}
        <div className="flex items-center gap-2">
          {/* Currency Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setCurrency('INR')}
              className={`rounded px-2 py-1 font-semibold transition-colors ${
                currency === 'INR' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`rounded px-2 py-1 font-semibold transition-colors ${
                currency === 'USD' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Demo Reset / Active Tag */}
          {isDemoActive ? (
            <button
              onClick={onResetDemo}
              title="Reset to full Demo Dataset"
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              <RotateCcw className="h-3 w-3 text-amber-400" />
              <span>Demo Active</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[130px]">{activeDatasetName}</span>
            </div>
          )}

          {/* Quick PDF/Report Trigger */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
