import React from 'react';
import {
  Settings,
  Sliders,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Check,
  Info,
} from 'lucide-react';
import { DetectionSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/detectionEngine';

interface SettingsViewProps {
  settings: DetectionSettings;
  onUpdateSettings: (newSettings: DetectionSettings) => void;
  onResetSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const handleChange = (key: keyof DetectionSettings, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Audit Parameters & Detection Thresholds
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tune the mathematical boundaries that trigger revenue leakage flags across receivables, CRM leads, and churn risk.
          </p>
        </div>

        <button
          onClick={onResetSettings}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* Receivables & Overdue Invoices */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Receivables & Collections Aging
          </h3>
          <p className="text-xs text-slate-400">
            Determine when unpaid invoices transition into actionable working-capital risk alerts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Overdue Aging Threshold: <span className="text-rose-400">{settings.overdueDaysThreshold} Days</span>
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={settings.overdueDaysThreshold}
                onChange={(e) => handleChange('overdueDaysThreshold', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10 Days (Aggressive)</span>
                <span>30 Days (Standard)</span>
                <span>90 Days (Permissive)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Rogue Discount Anomaly Alert: <span className="text-amber-400">&gt; {settings.highDiscountPercentThreshold}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={settings.highDiscountPercentThreshold}
                onChange={(e) => handleChange('highDiscountPercentThreshold', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10% Discount</span>
                <span>25% Standard CPQ</span>
                <span>60% Deep Concession</span>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Leads & Pipeline Cadence */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            CRM Lead Follow-Up & Pipeline Velocity
          </h3>
          <p className="text-xs text-slate-400">
            Control when qualified, high-intent prospects are classified as cold or neglected pipeline.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Lead Dormancy Inactivity Threshold: <span className="text-cyan-400">{settings.dormantLeadsDaysThreshold} Days</span>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={settings.dormantLeadsDaysThreshold}
                onChange={(e) => handleChange('dormantLeadsDaysThreshold', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10 Days (High Velocity)</span>
                <span>30 Days (Standard)</span>
                <span>60 Days</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                High-Intent Score Minimum: <span className="text-emerald-400">{settings.highIntentScoreThreshold} / 10</span>
              </label>
              <input
                type="range"
                min="5"
                max="10"
                step="1"
                value={settings.highIntentScoreThreshold}
                onChange={(e) => handleChange('highIntentScoreThreshold', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Score 5 (Moderate)</span>
                <span>Score 8 (Strong Intent)</span>
                <span>Score 10 (Urgent Request)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Retention & Concentration Exposure */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Customer Retention & Concentration Safety
          </h3>
          <p className="text-xs text-slate-400">
            Define systemic risk limits for customer churn and revenue concentration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Revenue Concentration Safety Alert: <span className="text-purple-400">{settings.revenueConcentrationThreshold}% of Revenue</span>
              </label>
              <input
                type="range"
                min="15"
                max="50"
                step="5"
                value={settings.revenueConcentrationThreshold}
                onChange={(e) => handleChange('revenueConcentrationThreshold', Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>15% (Strict Diversification)</span>
                <span>25% (Standard)</span>
                <span>50% (Permissive)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Clustered Refund Alert Count: <span className="text-yellow-400">{settings.repeatedRefundCountThreshold} Transactions</span>
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={settings.repeatedRefundCountThreshold}
                onChange={(e) => handleChange('repeatedRefundCountThreshold', Number(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>2 Refunds (Early Alert)</span>
                <span>5 Refunds</span>
                <span>10 Refunds</span>
              </div>
            </div>
          </div>
        </div>

        {/* System & Currency Profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Display & Currency Formatting
          </h3>
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-slate-300">
              Primary Currency:
            </label>
            <div className="flex gap-2">
              {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleChange('currency', curr)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    settings.currency === curr
                      ? 'bg-rose-600 text-white shadow'
                      : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {curr === 'INR' ? '₹ INR (Lakhs/Crores)' : curr === 'USD' ? '$ USD' : curr === 'EUR' ? '€ EUR' : '£ GBP'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
