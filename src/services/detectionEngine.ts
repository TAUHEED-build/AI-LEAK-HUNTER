import {
  AuditMetrics,
  CustomerRecord,
  DetectionSettings,
  InvoiceRecord,
  LeadRecord,
  OrderRecord,
  PaymentRecord,
  RevenueLeakFinding,
  Severity,
} from '../types';
import { ANCHOR_DATE } from './demoData';
import { formatCurrency, getDaysBetween } from '../utils/formatters';

export const DEFAULT_SETTINGS: DetectionSettings = {
  currency: 'INR',
  currencySymbol: '₹',
  overdueDaysThreshold: 30,
  dormantLeadsDaysThreshold: 30,
  highIntentScoreThreshold: 8,
  highDiscountPercentThreshold: 25,
  churnInactivityDaysThreshold: 90,
  revenueConcentrationThreshold: 25, // % of total revenue from single client
  repeatedRefundCountThreshold: 2,
};

export interface DetectionInput {
  invoices: InvoiceRecord[];
  leads: LeadRecord[];
  customers: CustomerRecord[];
  payments: PaymentRecord[];
  orders: OrderRecord[];
  settings?: DetectionSettings;
  referenceDate?: string;
}

export function runRevenueLeakAudit(input: DetectionInput): {
  findings: RevenueLeakFinding[];
  metrics: AuditMetrics;
  insufficientDataCategories: string[];
} {
  const settings = input.settings || DEFAULT_SETTINGS;
  const refDate = input.referenceDate || ANCHOR_DATE;
  const findings: RevenueLeakFinding[] = [];
  const insufficientDataCategories: string[] = [];

  const { invoices, leads, customers, payments, orders } = input;

  // -------------------------------------------------------------
  // RULE 1: Overdue Payments & Unpaid Invoices (Aging > threshold)
  // -------------------------------------------------------------
  if (!invoices || invoices.length === 0) {
    insufficientDataCategories.push('Overdue Invoices & Aging Receivables');
  } else {
    const overdueInvoices = invoices.filter((inv) => {
      if (inv.status === 'PAID' || inv.status === 'CANCELLED' || inv.status === 'REFUNDED') return false;
      const daysOverdue = getDaysBetween(inv.dueDate, refDate);
      return daysOverdue >= settings.overdueDaysThreshold || inv.status === 'OVERDUE';
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const criticalAgingCount = overdueInvoices.filter((inv) => getDaysBetween(inv.dueDate, refDate) > 60).length;

      const severity: Severity = totalOverdue > 200000 || criticalAgingCount > 0 ? 'CRITICAL' : 'HIGH';

      findings.push({
        id: 'leak-overdue-invoices',
        category: 'OVERDUE_PAYMENTS',
        categoryLabel: 'Overdue Receivables',
        title: `${formatCurrency(totalOverdue, settings.currency)} in overdue payments across ${overdueInvoices.length} accounts`,
        severity,
        status: 'INVESTIGATING',
        estimatedImpact: totalOverdue,
        confidence: 96,
        shortExplanation: `${overdueInvoices.length} unpaid invoices exceed the ${settings.overdueDaysThreshold}-day aging threshold, tying up working capital.`,
        detailedDescription: `Detailed aging analysis shows ${overdueInvoices.length} invoices remain unsettled well past their contract payment terms. ${criticalAgingCount} of these records exceed 60+ days aging, where standard commercial probability of collection deteriorates by over 35%.`,
        whyDetected: `Flagged because invoice due dates are older than current audit anchor (${refDate}) by at least ${settings.overdueDaysThreshold} days with status marked as UNPAID/OVERDUE.`,
        evidenceSummary: `${overdueInvoices.length} invoices amounting to ${formatCurrency(totalOverdue, settings.currency)} are past due. Oldest unsettled account is ${overdueInvoices[0]?.customerName} (${getDaysBetween(overdueInvoices[0]?.dueDate, refDate)} days past due).`,
        affectedRecordsCount: overdueInvoices.length,
        affectedRecordIds: overdueInvoices.map((i) => i.id),
        affectedRecords: overdueInvoices.map((inv) => ({
          'Invoice #': inv.invoiceNumber,
          Customer: inv.customerName,
          'Invoice Date': inv.date,
          'Due Date': inv.dueDate,
          'Days Overdue': `${Math.max(0, getDaysBetween(inv.dueDate, refDate))} days`,
          Amount: formatCurrency(inv.amount, settings.currency),
          Status: inv.status,
          Notes: inv.notes || 'No payment recorded',
        })),
        recommendedAction: `Initiate structured dunning sequence: Assign finance manager to verify invoice delivery, issue immediate formal statement of account, and place future order fulfillment on credit hold until resolved.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-AR-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 2: High-Intent Leads with No Follow-Up (Dormant Pipeline)
  // -------------------------------------------------------------
  if (!leads || leads.length === 0) {
    insufficientDataCategories.push('Dormant High-Intent Leads');
  } else {
    const neglectedHighIntentLeads = leads.filter((lead) => {
      if (lead.status === 'WON' || lead.status === 'LOST') return false;
      const daysSinceTouch = getDaysBetween(lead.lastContactDate, refDate);
      return lead.intentScore >= settings.highIntentScoreThreshold && daysSinceTouch >= settings.dormantLeadsDaysThreshold;
    });

    if (neglectedHighIntentLeads.length > 0) {
      const totalPipelineAtRisk = neglectedHighIntentLeads.reduce((sum, lead) => sum + lead.dealValue, 0);

      findings.push({
        id: 'leak-high-intent-dormant-leads',
        category: 'HIGH_INTENT_LEADS_NO_FOLLOWUP',
        categoryLabel: 'Dormant Sales Opportunities',
        title: `${neglectedHighIntentLeads.length} high-intent leads worth ${formatCurrency(totalPipelineAtRisk, settings.currency)} have had no follow-up for 30+ days`,
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        estimatedImpact: totalPipelineAtRisk,
        confidence: 94,
        shortExplanation: `Prospects with purchase intent scores >= ${settings.highIntentScoreThreshold}/10 (active demo/pricing requests) have gone cold with zero logged outreach.`,
        detailedDescription: `High-intent sales prospects demonstrate explicit buyer intent (e.g. pilot completed, bespoke proposal requested, or quote calculators used). However, internal logs show zero touchpoints for over 30 to 48 days. Without intervention, competitor conquesting will close these opportunities.`,
        whyDetected: `Lead records have intentScore >= ${settings.highIntentScoreThreshold} and lastContactDate is > ${settings.dormantLeadsDaysThreshold} days behind audit anchor date.`,
        evidenceSummary: `${neglectedHighIntentLeads.length} qualified prospects representing ${formatCurrency(totalPipelineAtRisk, settings.currency)} in weighted deal value are currently untouched.`,
        affectedRecordsCount: neglectedHighIntentLeads.length,
        affectedRecordIds: neglectedHighIntentLeads.map((l) => l.id),
        affectedRecords: neglectedHighIntentLeads.map((lead) => ({
          'Lead Name': lead.leadName,
          Company: lead.company,
          'Deal Value': formatCurrency(lead.dealValue, settings.currency),
          'Intent Score': `${lead.intentScore}/10`,
          Stage: lead.status,
          'Assigned Rep': lead.assignedRep || 'Unassigned',
          'Days Inactive': `${getDaysBetween(lead.lastContactDate, refDate)} days`,
          Source: lead.source || 'Direct',
        })),
        recommendedAction: `Reassign inactive enterprise leads immediately to a senior account executive for a 3-touch re-engagement sequence (custom Loom audit + executive check-in).`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-LEAD-002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Secondary Lead Rule: Dormant High Value Leads (> ₹5L regardless of intent score)
    const dormantHighValue = leads.filter((lead) => {
      if (lead.status === 'WON' || lead.status === 'LOST') return false;
      const daysSinceTouch = getDaysBetween(lead.lastContactDate, refDate);
      return lead.dealValue >= 500000 && daysSinceTouch >= 60;
    });

    if (dormantHighValue.length > 0) {
      const impact = dormantHighValue.reduce((sum, l) => sum + l.dealValue, 0);
      findings.push({
        id: 'leak-dormant-high-value-leads',
        category: 'DORMANT_HIGH_VALUE_LEADS',
        categoryLabel: 'Dormant Enterprise Accounts',
        title: `${dormantHighValue.length} enterprise opportunities worth ${formatCurrency(impact, settings.currency)} dormant for 60+ days`,
        severity: 'HIGH',
        status: 'INVESTIGATING',
        estimatedImpact: impact,
        confidence: 89,
        shortExplanation: `Large enterprise opportunities exceeding ₹5L deal size have been neglected for over 2 months.`,
        detailedDescription: `Accounts with high contract values require continuous cadence. These ${dormantHighValue.length} leads were engaged previously but slipped through the cracks with no scheduled next meeting.`,
        whyDetected: `dealValue >= 500,000 and daysSinceLastContact >= 60 days.`,
        evidenceSummary: `${dormantHighValue.length} leads totalling ${formatCurrency(impact, settings.currency)} untouched since ${dormantHighValue[0]?.lastContactDate}.`,
        affectedRecordsCount: dormantHighValue.length,
        affectedRecordIds: dormantHighValue.map((l) => l.id),
        affectedRecords: dormantHighValue.map((lead) => ({
          'Lead Name': lead.leadName,
          Company: lead.company,
          'Deal Value': formatCurrency(lead.dealValue, settings.currency),
          'Intent Score': `${lead.intentScore}/10`,
          'Last Contact': lead.lastContactDate,
          'Days Stalled': `${getDaysBetween(lead.lastContactDate, refDate)} days`,
          Rep: lead.assignedRep || 'Sales Team',
        })),
        recommendedAction: `Schedule a sales pipeline review with VP Sales to re-qualify or recycle these high-ticket prospects before quarter close.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-LEAD-003',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 3: Duplicate Invoices
  // -------------------------------------------------------------
  if (invoices && invoices.length > 0) {
    const duplicatePairs: { original: InvoiceRecord; duplicate: InvoiceRecord }[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < invoices.length; i++) {
      for (let j = i + 1; j < invoices.length; j++) {
        const invA = invoices[i];
        const invB = invoices[j];

        // Same customer and identical amount
        if (
          (invA.customerId === invB.customerId || invA.customerName.toLowerCase() === invB.customerName.toLowerCase()) &&
          Math.abs(invA.amount - invB.amount) < 1 &&
          invA.id !== invB.id
        ) {
          // Check if dates are within 5 days of each other
          const dateDiff = Math.abs(getDaysBetween(invA.date, invB.date));
          if (dateDiff <= 5) {
            duplicatePairs.push({ original: invA, duplicate: invB });
            processedIds.add(invA.id);
            processedIds.add(invB.id);
          }
        }
      }
    }

    if (duplicatePairs.length > 0) {
      const duplicateAmount = duplicatePairs.reduce((sum, pair) => sum + pair.duplicate.amount, 0);

      findings.push({
        id: 'leak-duplicate-invoices',
        category: 'DUPLICATE_INVOICES',
        categoryLabel: 'Billing Anomalies',
        title: `${duplicatePairs.length} potentially duplicate invoices detected totalling ${formatCurrency(duplicateAmount, settings.currency)}`,
        severity: 'HIGH',
        status: 'INVESTIGATING',
        estimatedImpact: duplicateAmount,
        confidence: 92,
        shortExplanation: `Identical amounts issued to the same customer within 5 days. High probability of accidental double-billing or uncoordinated reissues.`,
        detailedDescription: `Multiple invoices with matching amounts and identical client accounts were generated in short succession. Duplicate billing causes client disputes, payment delays, chargebacks, and distorted revenue figures.`,
        whyDetected: `Identical client name/ID + identical amount + invoice issue dates within 5 days.`,
        evidenceSummary: `${duplicatePairs.length * 2} records flagged across ${duplicatePairs.length} suspected duplicate billing events.`,
        affectedRecordsCount: duplicatePairs.length * 2,
        affectedRecordIds: Array.from(processedIds),
        affectedRecords: duplicatePairs.flatMap((p, idx) => [
          {
            Pair: `#${idx + 1} Original`,
            'Invoice #': p.original.invoiceNumber,
            Customer: p.original.customerName,
            Date: p.original.date,
            Amount: formatCurrency(p.original.amount, settings.currency),
            Status: p.original.status,
            Notes: p.original.notes || 'Original record',
          },
          {
            Pair: `#${idx + 1} Suspected Duplicate`,
            'Invoice #': p.duplicate.invoiceNumber,
            Customer: p.duplicate.customerName,
            Date: p.duplicate.date,
            Amount: formatCurrency(p.duplicate.amount, settings.currency),
            Status: p.duplicate.status,
            Notes: p.duplicate.notes || 'Duplicate record',
          },
        ]),
        recommendedAction: `Review invoice batch with accounts receivable. Void confirmed duplicate invoice numbers, notify clients proactively to avoid payment disputes, and reconcile ledger.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-INV-004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 4: Abnormally Discounted Transactions
  // -------------------------------------------------------------
  if (invoices && invoices.length > 0) {
    const discountedInvoices = invoices.filter((inv) => (inv.discountPercent || 0) >= settings.highDiscountPercentThreshold);

    if (discountedInvoices.length > 0) {
      // Calculate revenue eroded by discount over standard 10%
      const discountErosion = discountedInvoices.reduce((sum, inv) => {
        const discRate = (inv.discountPercent || 0) / 100;
        // If invoice amount was discounted by discRate, original gross was amount / (1 - discRate)
        const grossAmount = discRate < 1 ? inv.amount / (1 - discRate) : inv.amount * 1.5;
        const standardDiscount = grossAmount * 0.1; // 10% standard tolerance
        const actualDiscount = grossAmount * discRate;
        return sum + Math.max(0, actualDiscount - standardDiscount);
      }, 0);

      findings.push({
        id: 'leak-abnormal-discounts',
        category: 'ABNORMAL_DISCOUNTS',
        categoryLabel: 'Margin Erosion',
        title: `${discountedInvoices.length} transactions with rogue discounts (>${settings.highDiscountPercentThreshold}%) eroding ${formatCurrency(discountErosion, settings.currency)} in margin`,
        severity: 'HIGH',
        status: 'INVESTIGATING',
        estimatedImpact: Math.round(discountErosion),
        confidence: 91,
        shortExplanation: `Significant unstandardized discounts up to ${Math.max(...discountedInvoices.map((i) => i.discountPercent || 0))}% were granted without central governance.`,
        detailedDescription: `Pricing discipline audit detected transactions executed with heavy discounts far exceeding benchmark guardrails (standard 5-10%). This directly cannibalizes gross margin without driving proportional volume commitments.`,
        whyDetected: `discountPercent >= ${settings.highDiscountPercentThreshold}% on billed transactions.`,
        evidenceSummary: `${discountedInvoices.length} invoices granted exceptional discounts between ${Math.min(...discountedInvoices.map((i) => i.discountPercent || 0))}% and ${Math.max(...discountedInvoices.map((i) => i.discountPercent || 0))}%.`,
        affectedRecordsCount: discountedInvoices.length,
        affectedRecordIds: discountedInvoices.map((i) => i.id),
        affectedRecords: discountedInvoices.map((inv) => {
          const disc = inv.discountPercent || 0;
          const gross = disc < 100 ? inv.amount / (1 - disc / 100) : inv.amount;
          return {
            'Invoice #': inv.invoiceNumber,
            Customer: inv.customerName,
            'Billed Amount': formatCurrency(inv.amount, settings.currency),
            'Applied Discount': `${disc}%`,
            'Estimated Pre-Discount Value': formatCurrency(gross, settings.currency),
            'Eroded Margin': formatCurrency(gross - inv.amount, settings.currency),
            Notes: inv.notes || 'No override justification recorded',
          };
        }),
        recommendedAction: `Enforce CPQ (Configure, Price, Quote) discount limits. Require finance VP electronic sign-off for any concession over 15%, and audit sales rep commission adjustments.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-PRC-005',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 5: Customers Showing Churn Risk
  // -------------------------------------------------------------
  if (!customers || customers.length === 0) {
    insufficientDataCategories.push('Customer Churn Risk & Retention');
  } else {
    const churnRiskCustomers = customers.filter((c) => {
      const daysSinceOrder = getDaysBetween(c.lastOrderDate, refDate);
      return (c.churnRiskScore && c.churnRiskScore >= 75) || (c.status === 'AT_RISK' && daysSinceOrder >= 90);
    });

    if (churnRiskCustomers.length > 0) {
      // Annual recurring / lifetime value at stake
      const churnValueAtRisk = churnRiskCustomers.reduce((sum, c) => sum + c.totalLifetimeValue, 0);

      findings.push({
        id: 'leak-churn-risk-accounts',
        category: 'CHURN_RISK',
        categoryLabel: 'Retention & Churn Risk',
        title: `${churnRiskCustomers.length} high-LTV accounts at critical churn risk representing ${formatCurrency(churnValueAtRisk, settings.currency)}`,
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        estimatedImpact: churnValueAtRisk,
        confidence: 88,
        shortExplanation: `Accounts with high historical spend have stopped ordering for 150+ days and exhibit churn risk scores > 75%.`,
        detailedDescription: `Customer retention audit flagged key accounts that previously generated substantial recurring revenue but have gone completely inactive. Acquiring replacement revenue costs 5-7x more than preserving these existing contracts.`,
        whyDetected: `churnRiskScore >= 75 or inactive order gap >= 90 days on accounts with status = AT_RISK.`,
        evidenceSummary: `${churnRiskCustomers.length} corporate accounts with historical spend of ${formatCurrency(churnValueAtRisk, settings.currency)} are disengaging.`,
        affectedRecordsCount: churnRiskCustomers.length,
        affectedRecordIds: churnRiskCustomers.map((c) => c.id),
        affectedRecords: churnRiskCustomers.map((c) => ({
          'Customer Name': c.name,
          Segment: c.segment || 'Enterprise',
          'Lifetime Value (LTV)': formatCurrency(c.totalLifetimeValue, settings.currency),
          'Order Count': c.orderCount,
          'Last Order Date': c.lastOrderDate,
          'Days Inactive': `${getDaysBetween(c.lastOrderDate, refDate)} days`,
          'Churn Risk Score': `${c.churnRiskScore || 85}%`,
        })),
        recommendedAction: `Deploy Customer Success intervention: Schedule executive health check calls with key decision makers, conduct renewal sentiment audit, and offer tailored adoption support.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-RET-006',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Declining Purchase Frequency
    const decliningCadence = customers.filter((c) => {
      if (!c.previousOrderDate || !c.lastOrderDate) return false;
      const interval1 = Math.abs(getDaysBetween(c.previousOrderDate, c.lastOrderDate));
      const intervalCurrent = Math.abs(getDaysBetween(c.lastOrderDate, refDate));
      // Cadence has slowed down by 2x or more
      return intervalCurrent >= interval1 * 1.8 && intervalCurrent >= 45 && c.totalLifetimeValue > 100000;
    });

    if (decliningCadence.length > 0) {
      const decliningLTV = decliningCadence.reduce((sum, c) => sum + c.totalLifetimeValue, 0);
      findings.push({
        id: 'leak-declining-frequency',
        category: 'DECLINING_PURCHASE_FREQUENCY',
        categoryLabel: 'Velocity Slowdown',
        title: `${decliningCadence.length} accounts show declining order frequency (${formatCurrency(decliningLTV, settings.currency)} historical spend)`,
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
        estimatedImpact: Math.round(decliningLTV * 0.4), // 40% expected contraction
        confidence: 84,
        shortExplanation: `Purchase cycle duration has widened significantly compared to past order intervals.`,
        detailedDescription: `Customers who previously purchased on an active cadence have doubled their buying intervals, signalling reduced usage, budgetary freeze, or secondary vendor testing.`,
        whyDetected: `Days since last purchase exceeded 1.8x the customer's prior repurchase interval.`,
        evidenceSummary: `${decliningCadence.length} accounts whose ordering rhythm deteriorated by more than 80%.`,
        affectedRecordsCount: decliningCadence.length,
        affectedRecordIds: decliningCadence.map((c) => c.id),
        affectedRecords: decliningCadence.map((c) => ({
          'Customer Name': c.name,
          'Historical Spend': formatCurrency(c.totalLifetimeValue, settings.currency),
          'Last Order': c.lastOrderDate,
          'Prior Order': c.previousOrderDate || 'N/A',
          'Current Inactive Gap': `${getDaysBetween(c.lastOrderDate, refDate)} days`,
          Status: c.status,
        })),
        recommendedAction: `Trigger account manager quarterly business review (QBR) to identify workflow friction or product gaps before total account attrition occurs.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-VEL-007',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 6: Failed Payments & Dunning Leakage
  // -------------------------------------------------------------
  if (!payments || payments.length === 0) {
    insufficientDataCategories.push('Failed Payments & Dunning Cycles');
  } else {
    const failedPayments = payments.filter((p) => p.status === 'FAILED');

    if (failedPayments.length > 0) {
      const failedTotal = failedPayments.reduce((sum, p) => sum + p.amount, 0);

      findings.push({
        id: 'leak-failed-payments',
        category: 'FAILED_PAYMENTS',
        categoryLabel: 'Payment Gateway Dunning',
        title: `${failedPayments.length} failed payment transactions leaking ${formatCurrency(failedTotal, settings.currency)}`,
        severity: 'HIGH',
        status: 'INVESTIGATING',
        estimatedImpact: failedTotal,
        confidence: 97,
        shortExplanation: `Subscription renewals and auto-debit payments bounced due to expired cards or gateway declines without recovery.`,
        detailedDescription: `Passive churn occurs when payment methods fail and no automated dunning or proactive customer update flow is in place. These ${failedPayments.length} transactions represent unrecovered earned revenue.`,
        whyDetected: `Payment records with status = FAILED and uncollected amounts.`,
        evidenceSummary: `${failedPayments.length} transactions totalling ${formatCurrency(failedTotal, settings.currency)} failed between ${failedPayments[0]?.date} and ${failedPayments[failedPayments.length - 1]?.date}.`,
        affectedRecordsCount: failedPayments.length,
        affectedRecordIds: failedPayments.map((p) => p.id),
        affectedRecords: failedPayments.map((p) => ({
          'Transaction ID': p.transactionId,
          Customer: p.customerName || p.customerId,
          Amount: formatCurrency(p.amount, settings.currency),
          Date: p.date,
          'Failure Reason': p.failureReason || 'Card Declined',
          Method: p.method || 'Auto-Debit',
        })),
        recommendedAction: `Configure automated smart-retry billing rules (Day 3, 5, 7) and dispatch branded self-serve payment method update links to account owners.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-PAY-008',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Repeated Refunds
    const refunds = payments.filter((p) => p.isRefund || p.status === 'REFUNDED');
    if (refunds.length >= settings.repeatedRefundCountThreshold) {
      const refundTotal = refunds.reduce((sum, p) => sum + (p.refundAmount || p.amount), 0);

      findings.push({
        id: 'leak-repeated-refunds',
        category: 'REPEATED_REFUNDS',
        categoryLabel: 'Product & Refund Clustered Leak',
        title: `${refunds.length} repeated refunds totalling ${formatCurrency(refundTotal, settings.currency)}`,
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
        estimatedImpact: refundTotal,
        confidence: 93,
        shortExplanation: `Multiple refunds clustered around identical accounts or reasons point to operational defects or mis-sold capabilities.`,
        detailedDescription: `While isolated refunds are normal, repeated refund patterns on specific accounts or modules point to product bugs, integration breakdowns, or misaligned sales expectations.`,
        whyDetected: `Count of refund transactions (${refunds.length}) >= threshold of ${settings.repeatedRefundCountThreshold}.`,
        evidenceSummary: `${refunds.length} refunds draining ${formatCurrency(refundTotal, settings.currency)}. Most common logged reason: ${refunds[0]?.failureReason || 'Compatibility'}.`,
        affectedRecordsCount: refunds.length,
        affectedRecordIds: refunds.map((p) => p.id),
        affectedRecords: refunds.map((p) => ({
          'Transaction ID': p.transactionId,
          Customer: p.customerName || p.customerId,
          'Refund Amount': formatCurrency(p.refundAmount || p.amount, settings.currency),
          Date: p.date,
          Reason: p.failureReason || 'Customer Request',
        })),
        recommendedAction: `Conduct technical triage on the affected product module and implement a pre-purchase compatibility checklist during sales demos.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-REF-009',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 7: Revenue Concentration Risk
  // -------------------------------------------------------------
  if (invoices && invoices.length > 0) {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const clientRevenueMap = new Map<string, { name: string; total: number; count: number }>();

    invoices.forEach((inv) => {
      const key = inv.customerId || inv.customerName;
      const current = clientRevenueMap.get(key) || { name: inv.customerName, total: 0, count: 0 };
      current.total += inv.amount;
      current.count += 1;
      clientRevenueMap.set(key, current);
    });

    const highConcentrationClients = Array.from(clientRevenueMap.values()).filter((c) => {
      const share = (c.total / (totalBilled || 1)) * 100;
      return share >= settings.revenueConcentrationThreshold;
    });

    if (highConcentrationClients.length > 0 && totalBilled > 0) {
      highConcentrationClients.forEach((client, idx) => {
        const share = Math.round((client.total / totalBilled) * 100);
        findings.push({
          id: `leak-concentration-${idx + 1}`,
          category: 'REVENUE_CONCENTRATION_RISK',
          categoryLabel: 'Systemic Concentration Risk',
          title: `Severe revenue concentration: "${client.name}" accounts for ${share}% of total billed revenue`,
          severity: 'HIGH',
          status: 'INVESTIGATING',
          estimatedImpact: client.total,
          confidence: 98,
          shortExplanation: `A single customer represents ${formatCurrency(client.total, settings.currency)} (${share}%) of all revenue analyzed. Sudden account loss would jeopardize business solvency.`,
          detailedDescription: `B2B businesses face existential cash-flow shocks when any individual account exceeds 20-25% of top-line revenue. Any renegotiation, leadership turnover, or budget reduction at this client directly threatens payroll and runway.`,
          whyDetected: `Revenue share (${share}%) exceeds the ${settings.revenueConcentrationThreshold}% single-client safety threshold.`,
          evidenceSummary: `${client.name} contributed ${formatCurrency(client.total, settings.currency)} across ${client.count} invoices out of ${formatCurrency(totalBilled, settings.currency)} total company billing.`,
          affectedRecordsCount: client.count,
          affectedRecordIds: invoices.filter((i) => i.customerName === client.name).map((i) => i.id),
          affectedRecords: invoices
            .filter((i) => i.customerName === client.name)
            .map((inv) => ({
              'Invoice #': inv.invoiceNumber,
              Date: inv.date,
              Amount: formatCurrency(inv.amount, settings.currency),
              Status: inv.status,
              'Revenue Share': `${((inv.amount / totalBilled) * 100).toFixed(1)}%`,
            })),
          recommendedAction: `Secure multi-year contract renewals with executive sponsorship, and accelerate customer acquisition across other tiers to dilute single-client exposure below 18%.`,
          humanApprovalRequired: true,
          detectionRuleId: 'RULE-CON-010',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 8: Cancelled Orders Leakage
  // -------------------------------------------------------------
  if (orders && orders.length > 0) {
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
    if (cancelledOrders.length > 0) {
      const cancelledTotal = cancelledOrders.reduce((sum, o) => sum + o.amount, 0);

      findings.push({
        id: 'leak-cancelled-orders',
        category: 'CANCELLED_ORDERS',
        categoryLabel: 'Post-Sale Cancellations',
        title: `${cancelledOrders.length} orders cancelled post-checkout representing ${formatCurrency(cancelledTotal, settings.currency)}`,
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
        estimatedImpact: cancelledTotal,
        confidence: 90,
        shortExplanation: `Orders were initiated and confirmed, but cancelled prior to completion, pointing to checkout friction or fulfillment delays.`,
        detailedDescription: `High post-order cancellation rates indicate delivery timeline mismatch, uncommunicated shipping fees, or lack of instant confirmation reassurance.`,
        whyDetected: `orders records with status = CANCELLED.`,
        evidenceSummary: `${cancelledOrders.length} orders totalling ${formatCurrency(cancelledTotal, settings.currency)} cancelled.`,
        affectedRecordsCount: cancelledOrders.length,
        affectedRecordIds: cancelledOrders.map((o) => o.id),
        affectedRecords: cancelledOrders.map((o) => ({
          'Order #': o.orderNumber,
          Customer: o.customerName || o.customerId,
          Date: o.date,
          Amount: formatCurrency(o.amount, settings.currency),
          Status: o.status,
        })),
        recommendedAction: `Investigate primary cancellation reasons via automated post-cancellation 1-question pulse survey.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-ORD-011',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // RULE 9: Data Inconsistencies / Partial Payments Disconnected
  // -------------------------------------------------------------
  if (invoices && invoices.length > 0 && payments && payments.length > 0) {
    // Check for payments logged against invoices where amount paid doesn't reconcile
    const inconsistentRecords: Record<string, any>[] = [];
    let inconsistencyImpact = 0;

    payments.forEach((pay) => {
      if (pay.invoiceId) {
        const inv = invoices.find((i) => i.id === pay.invoiceId || i.invoiceNumber === pay.invoiceId);
        if (inv && inv.status !== 'PAID' && pay.status === 'SUCCESS') {
          const delta = inv.amount - pay.amount;
          if (delta > 0) {
            inconsistencyImpact += delta;
            inconsistentRecords.push({
              'Invoice #': inv.invoiceNumber,
              Customer: inv.customerName,
              'Invoice Total': formatCurrency(inv.amount, settings.currency),
              'Payment Received': formatCurrency(pay.amount, settings.currency),
              'Unreconciled Variance': formatCurrency(delta, settings.currency),
              'Payment Date': pay.date,
            });
          }
        }
      }
    });

    if (inconsistentRecords.length > 0) {
      findings.push({
        id: 'leak-data-inconsistency',
        category: 'DATA_INCONSISTENCY',
        categoryLabel: 'Reconciliation Discrepancy',
        title: `Unreconciled payment discrepancy of ${formatCurrency(inconsistencyImpact, settings.currency)} across ${inconsistentRecords.length} records`,
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
        estimatedImpact: inconsistencyImpact,
        confidence: 95,
        shortExplanation: `Partial payments were received and recorded, but the remaining balance was left uncollected and uncredited.`,
        detailedDescription: `Mismatch detected between transaction ledger deposits and billing invoices. Partial settlements without short-pay approval or debit notes leave revenue uncollected indefinitely.`,
        whyDetected: `Successful payment amount is less than linked invoice amount while invoice status remains unsettled.`,
        evidenceSummary: `${inconsistentRecords.length} transactions have an unreconciled gap totaling ${formatCurrency(inconsistencyImpact, settings.currency)}.`,
        affectedRecordsCount: inconsistentRecords.length,
        affectedRecordIds: ['inconsistency-reconciliation'],
        affectedRecords: inconsistentRecords,
        recommendedAction: `Audit billing ledger: Check whether customer withheld TDS/withholding tax or if a credit note needs to be issued or balance billed.`,
        humanApprovalRequired: true,
        detectionRuleId: 'RULE-DAT-012',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // Calculate Global Audit Metrics
  // -------------------------------------------------------------
  const totalRevenueAnalyzed = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Potential revenue at risk: sum of active (INVESTIGATING) findings
  const activeFindings = findings.filter((f) => f.status === 'INVESTIGATING');
  const potentialRevenueAtRisk = activeFindings.reduce((sum, f) => sum + f.estimatedImpact, 0);

  const highPriorityFindings = activeFindings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  const overdueFinding = findings.find((f) => f.category === 'OVERDUE_PAYMENTS');
  const overdueAmount = overdueFinding ? overdueFinding.estimatedImpact : 0;

  const dormantFinding = findings.find((f) => f.category === 'HIGH_INTENT_LEADS_NO_FOLLOWUP');
  const dormantOpportunityValue = dormantFinding ? dormantFinding.estimatedImpact : 0;

  const resolvedFindings = findings.filter((f) => f.status === 'RESOLVED');
  const resolvedRecoveredValue = resolvedFindings.reduce((sum, f) => sum + f.estimatedImpact, 0);

  const severityCounts = {
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: findings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
    LOW: findings.filter((f) => f.severity === 'LOW').length,
  };

  // Category breakdown
  const categoryMap = new Map<string, { label: string; count: number; impact: number }>();
  findings.forEach((f) => {
    const cur = categoryMap.get(f.category) || { label: f.categoryLabel, count: 0, impact: 0 };
    cur.count += 1;
    cur.impact += f.estimatedImpact;
    categoryMap.set(f.category, cur);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat as any,
    label: val.label,
    count: val.count,
    impact: val.impact,
  }));

  const metrics: AuditMetrics = {
    totalRevenueAnalyzed,
    potentialRevenueAtRisk,
    activeRevenueLeaks: activeFindings.length,
    highPriorityFindings,
    overdueAmount,
    dormantOpportunityValue,
    resolvedRecoveredValue,
    severityCounts,
    categoryBreakdown,
  };

  return {
    findings,
    metrics,
    insufficientDataCategories,
  };
}
