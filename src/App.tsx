import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AuditMetrics,
  CustomerRecord,
  DetectionSettings,
  FindingStatus,
  InvoiceRecord,
  LeadRecord,
  OrderRecord,
  ParsedDataset,
  PaymentRecord,
  RevenueLeakFinding,
} from './types';
import {
  ANCHOR_DATE,
  getDemoCustomers,
  getDemoInvoices,
  getDemoLeads,
  getDemoOrders,
  getDemoPayments,
} from './services/demoData';
import {
  DEFAULT_SETTINGS,
  runRevenueLeakAudit,
} from './services/detectionEngine';
import {
  AIExecutiveSummaryResponse,
  fetchAIExecutiveSummary,
} from './services/aiService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { RevenueLeaksView } from './components/RevenueLeaksView';
import { InvestigationModal } from './components/InvestigationModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'upload' | 'leaks' | 'reports' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(true);
  const [activeDatasetName, setActiveDatasetName] = useState<string>('B2B Tech Enterprise Demo Dataset');

  // Working data collections
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(getDemoInvoices());
  const [leads, setLeads] = useState<LeadRecord[]>(getDemoLeads());
  const [customers, setCustomers] = useState<CustomerRecord[]>(getDemoCustomers());
  const [payments, setPayments] = useState<PaymentRecord[]>(getDemoPayments());
  const [orders, setOrders] = useState<OrderRecord[]>(getDemoOrders());
  const [activeParsedDataset, setActiveParsedDataset] = useState<ParsedDataset | null>(null);

  // Findings state
  const [findings, setFindings] = useState<RevenueLeakFinding[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalRevenueAnalyzed: 0,
    potentialRevenueAtRisk: 0,
    activeRevenueLeaks: 0,
    highPriorityFindings: 0,
    overdueAmount: 0,
    dormantOpportunityValue: 0,
    resolvedRecoveredValue: 0,
    severityCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    categoryBreakdown: [],
  });
  const [insufficientDataCategories, setInsufficientDataCategories] = useState<string[]>([]);

  // Selected finding for modal inspection
  const [selectedFinding, setSelectedFinding] = useState<RevenueLeakFinding | null>(null);
  const [isInvestigationOpen, setIsInvestigationOpen] = useState(false);

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState<AIExecutiveSummaryResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Run deterministic audit whenever raw data or settings change
  const executeAudit = useCallback(() => {
    const result = runRevenueLeakAudit({
      invoices,
      leads,
      customers,
      payments,
      orders,
      settings,
      referenceDate: ANCHOR_DATE,
    });

    // Retain any modified statuses and notes from previous state
    setFindings((prevFindings) => {
      const statusMap = new Map(prevFindings.map((f) => [f.id, { status: f.status, notes: f.notes }]));
      return result.findings.map((f) => {
        const prev = statusMap.get(f.id);
        if (prev) {
          return {
            ...f,
            status: prev.status,
            notes: prev.notes || f.notes,
          };
        }
        return f;
      });
    });

    setMetrics(result.metrics);
    setInsufficientDataCategories(result.insufficientDataCategories);
  }, [invoices, leads, customers, payments, orders, settings]);

  // Initial audit run
  useEffect(() => {
    executeAudit();
  }, [executeAudit]);

  // Trigger initial AI briefing once findings are calculated
  useEffect(() => {
    if (findings.length > 0 && !aiBriefing) {
      setIsLoadingAi(true);
      fetchAIExecutiveSummary(metrics, findings, activeDatasetName)
        .then((res) => {
          setAiBriefing(res);
          setIsLoadingAi(false);
        })
        .catch(() => {
          setIsLoadingAi(false);
        });
    }
  }, [findings.length, activeDatasetName]);

  // Handle recalculation of metrics when status of findings changes
  const handleUpdateStatus = (id: string, newStatus: FindingStatus) => {
    setFindings((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f));

      // Recalculate metrics based on updated statuses
      const active = updated.filter((f) => f.status === 'INVESTIGATING');
      const resolved = updated.filter((f) => f.status === 'RESOLVED');

      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        potentialRevenueAtRisk: active.reduce((sum, f) => sum + f.estimatedImpact, 0),
        activeRevenueLeaks: active.length,
        highPriorityFindings: active.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length,
        resolvedRecoveredValue: resolved.reduce((sum, f) => sum + f.estimatedImpact, 0),
      }));

      // Update selected finding if currently inspected
      if (selectedFinding && selectedFinding.id === id) {
        setSelectedFinding((cur) => (cur ? { ...cur, status: newStatus } : null));
      }

      return updated;
    });
  };

  // Add internal audit note
  const handleAddNote = (id: string, noteText: string) => {
    const newNoteObj = {
      id: `note-${Date.now()}`,
      author: 'Audit Lead',
      text: noteText,
      timestamp: new Date().toISOString(),
    };

    setFindings((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updatedNotes = [...(f.notes || []), newNoteObj];
          if (selectedFinding && selectedFinding.id === id) {
            setSelectedFinding({ ...f, notes: updatedNotes });
          }
          return { ...f, notes: updatedNotes };
        }
        return f;
      })
    );
  };

  // Handle uploaded dataset
  const handleDatasetLoaded = (dataset: ParsedDataset) => {
    setActiveParsedDataset(dataset);
    setActiveDatasetName(dataset.name);
    setIsDemoActive(false);

    // Populate data based on what was detected
    if (dataset.invoices.length > 0) setInvoices(dataset.invoices);
    if (dataset.leads.length > 0) setLeads(dataset.leads);
    if (dataset.customers.length > 0) setCustomers(dataset.customers);
    if (dataset.payments.length > 0) setPayments(dataset.payments);
    if (dataset.orders.length > 0) setOrders(dataset.orders);

    // If only one entity was uploaded (e.g. only invoices), clear the other collections so no false leaks appear
    if (dataset.detectedType === 'invoices') {
      setLeads([]);
      setCustomers([]);
      setPayments([]);
      setOrders([]);
    } else if (dataset.detectedType === 'leads') {
      setInvoices([]);
      setCustomers([]);
      setPayments([]);
      setOrders([]);
    } else if (dataset.detectedType === 'customers') {
      setInvoices([]);
      setLeads([]);
      setPayments([]);
      setOrders([]);
    } else if (dataset.detectedType === 'payments') {
      setInvoices([]);
      setLeads([]);
      setCustomers([]);
      setOrders([]);
    }

    // Reset AI briefing to trigger fresh analysis
    setAiBriefing(null);
    setCurrentTab('dashboard');
  };

  // Switch between presets
  const handleLoadPreset = (presetKey: 'b2b-saas' | 'ecommerce' | 'agency') => {
    if (presetKey === 'b2b-saas') {
      handleResetDemo();
    } else if (presetKey === 'ecommerce') {
      setIsDemoActive(false);
      setActiveDatasetName('E-Commerce & D2C Store Logs');
      setInvoices(getDemoInvoices().slice(10));
      setLeads([]);
      setCustomers(getDemoCustomers().slice(2));
      setPayments(getDemoPayments());
      setOrders(getDemoOrders());
      setAiBriefing(null);
      setCurrentTab('dashboard');
    } else {
      setIsDemoActive(false);
      setActiveDatasetName('Global Agency Retainers');
      // High concentration preset
      setInvoices([
        ...getDemoInvoices().slice(0, 5),
        {
          id: 'inv-agency-99',
          invoiceNumber: 'INV-AGENCY-01',
          customerId: 'cust-huge',
          customerName: 'MegaCorp International',
          date: '2026-08-01',
          dueDate: '2026-08-31',
          amount: 2800000,
          status: 'PAID',
          discountPercent: 0,
        },
      ]);
      setLeads(getDemoLeads().slice(0, 4));
      setCustomers(getDemoCustomers().slice(0, 4));
      setPayments([]);
      setOrders([]);
      setAiBriefing(null);
      setCurrentTab('dashboard');
    }
  };

  // Reset demo data
  const handleResetDemo = () => {
    setIsDemoActive(true);
    setActiveDatasetName('B2B Tech Enterprise Demo Dataset');
    setActiveParsedDataset(null);
    setInvoices(getDemoInvoices());
    setLeads(getDemoLeads());
    setCustomers(getDemoCustomers());
    setPayments(getDemoPayments());
    setOrders(getDemoOrders());
    setAiBriefing(null);
    setCurrentTab('dashboard');
  };

  // Regenerate AI briefing manually
  const handleRegenerateAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetchAIExecutiveSummary(metrics, findings, activeDatasetName);
      setAiBriefing(res);
    } catch {
      // Handled in service fallback
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleInspectFinding = (finding: RevenueLeakFinding) => {
    setSelectedFinding(finding);
    setIsInvestigationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-200">
      {/* Top Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currency={settings.currency}
        setCurrency={(c) => setSettings((s) => ({ ...s, currency: c }))}
        activeDatasetName={activeDatasetName}
        isDemoActive={isDemoActive}
        onResetDemo={handleResetDemo}
        onOpenReport={() => setCurrentTab('reports')}
        activeLeaksCount={metrics.activeRevenueLeaks}
      />

      {/* Main App Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            findings={findings}
            currency={settings.currency}
            onInspectFinding={handleInspectFinding}
            onUpdateStatus={handleUpdateStatus}
            aiBriefing={aiBriefing}
            isLoadingAi={isLoadingAi}
            onRegenerateAi={handleRegenerateAi}
            insufficientDataCategories={insufficientDataCategories}
            onGoToUpload={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'upload' && (
          <UploadView
            onDatasetLoaded={handleDatasetLoaded}
            activeDataset={activeParsedDataset}
            onLoadPreset={handleLoadPreset}
            isDemoActive={isDemoActive}
          />
        )}

        {currentTab === 'leaks' && (
          <RevenueLeaksView
            findings={findings}
            currency={settings.currency}
            onInspectFinding={handleInspectFinding}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            metrics={metrics}
            findings={findings}
            currency={settings.currency}
            activeDatasetName={activeDatasetName}
            aiBriefing={aiBriefing}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
          />
        )}
      </main>

      {/* Investigation Deep Dive Modal */}
      <InvestigationModal
        finding={selectedFinding}
        isOpen={isInvestigationOpen}
        onClose={() => setIsInvestigationOpen(false)}
        currency={settings.currency}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
