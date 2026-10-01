import { AuditMetrics, RevenueLeakFinding } from '../types';

export interface AIExecutiveSummaryResponse {
  summary: string;
  keyRiskObservations: string[];
  strategicPriorities: string[];
  isFallback?: boolean;
}

export interface AIInvestigationResponse {
  rootCause: string;
  riskMultiplier: string;
  actionPlaybook: string[];
  mitigationAdvice: string;
  isFallback?: boolean;
}

export async function fetchAIExecutiveSummary(
  metrics: AuditMetrics,
  topFindings: RevenueLeakFinding[],
  companyName: string = 'Enterprise Business'
): Promise<AIExecutiveSummaryResponse> {
  const findingsSummary = topFindings
    .slice(0, 5)
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (Est. Impact: ₹${f.estimatedImpact.toLocaleString()}, Confidence: ${f.confidence}%)`)
    .join('\n');

  try {
    const res = await fetch('/api/ai/executive-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: {
          totalRevenueAnalyzed: metrics.totalRevenueAnalyzed,
          potentialRevenueAtRisk: metrics.potentialRevenueAtRisk,
          activeRevenueLeaks: metrics.activeRevenueLeaks,
          highPriorityFindings: metrics.highPriorityFindings,
          overdueAmount: metrics.overdueAmount,
          dormantOpportunityValue: metrics.dormantOpportunityValue,
          currencySymbol: '₹',
        },
        findingsSummary,
        companyName,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      summary: data.summary,
      keyRiskObservations: data.keyRiskObservations || [],
      strategicPriorities: data.strategicPriorities || [],
      isFallback: data.isFallback,
    };
  } catch (err) {
    console.warn('[AI Service] Falling back to deterministic client summary:', err);
    return {
      isFallback: true,
      summary: `Automated audit identified ${metrics.activeRevenueLeaks} active revenue leak points putting ₹${metrics.potentialRevenueAtRisk.toLocaleString()} at risk. Key vulnerabilities include overdue receivables (₹${metrics.overdueAmount.toLocaleString()}) and dormant high-intent leads (₹${metrics.dormantOpportunityValue.toLocaleString()}). Immediate triage is recommended.`,
      keyRiskObservations: [
        'Aging unpaid invoices indicate accounts receivable follow-up bottlenecks.',
        'High-value sales leads lack sustained multi-channel outreach cadences.',
        'Discretionary discounting is eroding baseline product margins.',
      ],
      strategicPriorities: [
        'Dispatch formal statements of account to all debtors over 45 days past due.',
        'Assign cold high-intent deals to senior reps for 48-hour re-engagement.',
        'Establish automated billing retries and credit card expiry notifications.',
      ],
    };
  }
}

export async function fetchAILeakInvestigation(
  finding: RevenueLeakFinding
): Promise<AIInvestigationResponse> {
  const evidenceSample = finding.affectedRecords.slice(0, 4);

  try {
    const res = await fetch('/api/ai/investigate-leak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finding: {
          id: finding.id,
          title: finding.title,
          category: finding.category,
          categoryLabel: finding.categoryLabel,
          severity: finding.severity,
          estimatedImpact: finding.estimatedImpact,
          confidence: finding.confidence,
          shortExplanation: finding.shortExplanation,
          evidenceSummary: finding.evidenceSummary,
          recommendedAction: finding.recommendedAction,
        },
        evidenceSample,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      rootCause: data.rootCause,
      riskMultiplier: data.riskMultiplier,
      actionPlaybook: data.actionPlaybook || [],
      mitigationAdvice: data.mitigationAdvice,
      isFallback: data.isFallback,
    };
  } catch (err) {
    console.warn('[AI Service] Falling back to deterministic client investigation:', err);
    return {
      isFallback: true,
      rootCause: `Operational drift and missing preventive gates caused this ${finding.categoryLabel} condition. Specifically, ${finding.shortExplanation.toLowerCase()}`,
      riskMultiplier: 'Elevated. Capital left uncollected or sales pipeline left cold degrades at an estimated 2-4% weekly write-off probability.',
      actionPlaybook: [
        'Verify records: Conduct direct ledger/CRM verification for the flagged accounts.',
        'Deploy targeted intervention: Execute the recommended business action with designated account owner.',
        'Establish guardrail: Update operating policy to avoid repeat leak occurrence.',
      ],
      mitigationAdvice: finding.recommendedAction,
    };
  }
}
