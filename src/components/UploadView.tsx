import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  Download,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ParsedDataset } from '../types';
import { parseUploadedFile } from '../services/dataDetector';

interface UploadViewProps {
  onDatasetLoaded: (dataset: ParsedDataset) => void;
  activeDataset: ParsedDataset | null;
  onLoadPreset: (presetKey: 'b2b-saas' | 'ecommerce' | 'agency') => void;
  isDemoActive: boolean;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onDatasetLoaded,
  activeDataset,
  onLoadPreset,
  isDemoActive,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        throw new Error('Unsupported format. Please upload a .CSV or Excel (.XLSX, .XLS) file.');
      }

      const dataset = await parseUploadedFile(file);
      onDatasetLoaded(dataset);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || 'Failed to process file. Ensure headers are clean and data is not empty.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Helper to generate a downloadable sample CSV template
  const downloadSampleTemplate = (type: 'invoices' | 'leads' | 'customers' | 'payments') => {
    let headers = '';
    let rows = '';

    if (type === 'invoices') {
      headers = 'invoice_number,customer_name,date,due_date,amount,status,discount_percent,notes\n';
      rows =
        'INV-2026-101,Acme Corp,2026-06-15,2026-07-15,145000,OVERDUE,5,Platform license\n' +
        'INV-2026-102,Zenith Retail,2026-08-10,2026-09-10,180000,UNPAID,10,Integration batch\n' +
        'INV-2026-103,Zenith Retail,2026-08-11,2026-09-10,180000,UNPAID,10,Duplicate reissue\n' +
        'INV-2026-104,Orbit Media,2026-09-10,2026-10-10,120000,PAID,55,Unapproved discount voucher\n';
    } else if (type === 'leads') {
      headers = 'lead_name,company,email,deal_value,intent_score,status,last_contact_date,assigned_rep\n';
      rows =
        'Vikramaditya Roy,Titan Conglomerate,v.roy@titan.in,650000,9,QUALIFIED,2026-08-14,Rohan Sharma\n' +
        'Ananya Deshmukh,Paramount Fintech,ananya@paramount.com,580000,10,PROPOSAL_SENT,2026-08-18,Sneha Patel\n' +
        'Divya Kashyap,HyperScale Labs,divya@hyper.com,420000,8,PROPOSAL_SENT,2026-09-29,Sneha Patel\n';
    } else if (type === 'customers') {
      headers = 'customer_name,email,segment,lifetime_value,order_count,last_order_date,previous_order_date,churn_risk_score\n';
      rows =
        'Optima Health Tech,billing@optima.in,Enterprise,840000,14,2026-04-12,2026-03-10,92\n' +
        'Falcon EdTech,admin@falcon.in,Growth,380000,12,2026-08-28,2026-06-15,68\n' +
        'Starlight E-com,ops@starlight.in,Growth,340000,7,2026-09-01,2026-08-05,15\n';
    } else {
      headers = 'transaction_id,customer_name,amount,date,status,failure_reason,method\n';
      rows =
        'TXN-90211,Trident Media,45000,2026-09-01,FAILED,INSUFFICIENT_FUNDS,AUTO_DEBIT\n' +
        'TXN-90245,Trident Media,45000,2026-09-08,FAILED,EXPIRED_CARD,AUTO_DEBIT\n' +
        'TXN-REF-101,AeroDrone Dyn,38000,2026-08-10,REFUNDED,MODULE_INCOMPATIBILITY,CARD\n';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Data Ingestion & Schema Recognition
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload real sales records, overdue invoices, CRM leads, or payment logs. The engine automatically classifies schemas and triggers deterministic financial leak detection.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-rose-500 bg-rose-950/20 scale-[0.99]'
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-white">
          {isProcessing ? 'Parsing data records...' : 'Drop your CSV or Excel business data here'}
        </h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md">
          Supports comma-separated (.csv) and Excel (.xlsx, .xls). Automatic header recognition for Invoices, CRM Leads, Customer LTV, and Payments.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700">
            Browse File
          </span>
          <span className="text-xs text-slate-500">Max file size: 50MB</span>
        </div>
      </div>

      {/* Error notification if upload fails */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">Data Parsing Warning</p>
            <p className="mt-0.5 text-rose-300/90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Active Dataset Inspection Card */}
      {activeDataset && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {activeDataset.name}
                  </h3>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    Active in Audit Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Detected Schema Type:{' '}
                  <span className="font-semibold text-slate-200 uppercase">
                    {activeDataset.detectedType}
                  </span>{' '}
                  ({activeDataset.typeConfidence}% pattern match)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-slate-500 block">Rows Ingested</span>
                <span className="font-bold text-white text-sm">{activeDataset.rowCount}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Recognized Columns</span>
                <span className="font-bold text-white text-sm">{activeDataset.columnCount}</span>
              </div>
            </div>
          </div>

          {/* Recognized Columns Pills */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Recognized Schema Fields:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeDataset.headers.map((h, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-700/60"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Rows Preview */}
          {activeDataset.rawRows && activeDataset.rawRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Raw Data Sample Preview:
              </span>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 max-h-48">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                    <tr>
                      {activeDataset.headers.slice(0, 8).map((h, idx) => (
                        <th key={idx} className="p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {activeDataset.rawRows.slice(0, 4).map((r, rIdx) => (
                      <tr key={rIdx}>
                        {activeDataset.headers.slice(0, 8).map((h, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap text-slate-300">
                            {String(r[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pre-Loaded Enterprise Demo Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-rose-400" />
            Instant Demo Datasets (Pre-Engineered Leaks)
          </h2>
          <span className="text-xs text-slate-400">
            One-click audit of realistic business scenarios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preset 1: B2B SaaS */}
          <div
            onClick={() => onLoadPreset('b2b-saas')}
            className={`rounded-xl border p-5 cursor-pointer transition-all ${
              isDemoActive
                ? 'border-rose-500/50 bg-rose-950/15 shadow-sm'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wide border border-rose-500/20">
                Recommended Demo
              </span>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">
              B2B SaaS & Tech Enterprise
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Complete enterprise scenario with 14 embedded leaks: ₹3.42L in overdue invoices, ₹27.5L in cold high-intent pipeline, duplicate invoices, and rogue discounts.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-rose-400 gap-1">
              <span>{isDemoActive ? 'Active in Audit Engine' : 'Load Dataset'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Preset 2: E-commerce */}
          <div
            onClick={() => onLoadPreset('ecommerce')}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 cursor-pointer hover:border-slate-700 transition-all"
          >
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Commerce
            </span>
            <h3 className="mt-3 text-sm font-bold text-white">
              D2C Merchant & Retailer
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Clustered refund leaks on defective SKUs, failed subscription dunning cycles, and post-checkout cart cancellations.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-slate-300 gap-1">
              <span>Load Dataset</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Preset 3: Consulting Agency */}
          <div
            onClick={() => onLoadPreset('agency')}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 cursor-pointer hover:border-slate-700 transition-all"
          >
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Professional Services
            </span>
            <h3 className="mt-3 text-sm font-bold text-white">
              Consulting & Agency Retainers
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Severe revenue concentration risk (top client &gt; 35%), declining order velocity, and uncollected milestone retainers.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-slate-300 gap-1">
              <span>Load Dataset</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Download Sample CSV Templates */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-cyan-400" />
            Download Sample CSV Templates
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Use these pre-structured CSV templates to format your own accounting or CRM exports:
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadSampleTemplate('invoices')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
            <span>Invoices Template.csv</span>
          </button>
          <button
            onClick={() => downloadSampleTemplate('leads')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
            <span>CRM Leads Template.csv</span>
          </button>
          <button
            onClick={() => downloadSampleTemplate('customers')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Customer LTV Template.csv</span>
          </button>
          <button
            onClick={() => downloadSampleTemplate('payments')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-rose-400" />
            <span>Transactions & Payments Template.csv</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-200 block mb-0.5">
            Privacy & Zero-Retention Security Guarantee
          </span>
          Your financial data is processed in browser memory. Uploaded spreadsheets are never persisted, stored in a database, or shared. LLM synthesis only receives structured numerical summaries of flagged records — never raw personal data.
        </div>
      </div>
    </div>
  );
};
