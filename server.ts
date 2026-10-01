import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client if API key is provided
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

console.log(`[AI Revenue Leak Hunter] Gemini API Key configured: ${Boolean(apiKey)}`);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: AI Executive Summary
app.post('/api/ai/executive-summary', async (req, res) => {
  try {
    const { metrics, findingsSummary, companyName } = req.body;

    if (!ai) {
      // Deterministic fallback if API key is missing
      return res.json({
        success: true,
        isFallback: true,
        summary: `Revenue Leak Hunter identified ${metrics.activeRevenueLeaks} active leakage vectors placing ${metrics.potentialRevenueAtRisk ? metrics.currencySymbol + Number(metrics.potentialRevenueAtRisk).toLocaleString() : 'significant capital'} at immediate risk. Primary capital drains stem from overdue accounts receivable (${metrics.currencySymbol + Number(metrics.overdueAmount).toLocaleString()}) and neglected high-intent commercial leads (${metrics.currencySymbol + Number(metrics.dormantOpportunityValue).toLocaleString()}). Without immediate cross-functional intervention across collections and sales pipeline velocity, baseline margins will continue degrading.`,
        keyRiskObservations: [
          'High concentration of unsettled invoices exceeding 60-day aging thresholds poses working capital drag.',
          'Valuable pipeline leads with strong buyer intent are stalling due to unassigned or neglected follow-up cadences.',
          'Rogue price discounting and billing inconsistencies suggest a lack of centralized CPQ and automated dunning controls.',
        ],
        strategicPriorities: [
          'Direct finance leadership to execute structured dunning calls on the top 3 overdue debtor accounts today.',
          'Reassign high-intent dormant pipeline opportunities to senior account executives for immediate 3-touch outreach.',
          'Establish a strict 15% discount threshold requiring electronic VP approval before contract issuance.',
        ],
      });
    }

    const prompt = `You are Cairn, an elite Senior Systems Architect and Strategic Revenue Optimization Lead.
Analyze the following verified financial revenue leakage audit data for "${companyName || 'the Enterprise'}":

METRICS:
- Total Revenue Analyzed: ${metrics.currencySymbol}${metrics.totalRevenueAnalyzed}
- Potential Revenue at Risk: ${metrics.currencySymbol}${metrics.potentialRevenueAtRisk}
- Active Leaks: ${metrics.activeRevenueLeaks} (${metrics.highPriorityFindings} High/Critical Priority)
- Overdue Receivables: ${metrics.currencySymbol}${metrics.overdueAmount}
- Dormant Lead Opportunity Value: ${metrics.currencySymbol}${metrics.dormantOpportunityValue}

KEY DETECTED FINDINGS:
${findingsSummary || 'Multiple critical leaks in receivables, dormant leads, rogue discounts, and churn risk.'}

TASK:
Provide a concise, razor-sharp, C-suite executive briefing.
Output MUST be strict JSON in this exact structure:
{
  "summary": "2-3 sentences of direct, truth-driven executive summary highlighting the primary financial exposure and systemic operational causes.",
  "keyRiskObservations": [
    "Observation 1 (concrete, data-grounded)",
    "Observation 2",
    "Observation 3"
  ],
  "strategicPriorities": [
    "Priority 1 (immediate 24-48h action with designated owner)",
    "Priority 2",
    "Priority 3"
  ]
}

Do NOT use corporate fluff or vague platitudes. Keep it grounded strictly in the data provided. Respond ONLY with valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, isFallback: false, ...parsed });
  } catch (err: any) {
    console.error('[AI Executive Summary Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate AI executive summary',
    });
  }
});

// Endpoint: AI Deep Dive & Investigation Playbook
app.post('/api/ai/investigate-leak', async (req, res) => {
  try {
    const { finding, evidenceSample } = req.body;

    if (!finding) {
      return res.status(400).json({ error: 'Finding payload is required.' });
    }

    if (!ai) {
      // Deterministic high-quality analytical fallback
      return res.json({
        success: true,
        isFallback: true,
        rootCause: `Operational breakdown in process discipline. The ${finding.categoryLabel} anomaly was triggered because verification mechanisms failed to prevent ${finding.shortExplanation.toLowerCase()}.`,
        riskMultiplier: 'Moderate to High. If unaddressed within 30 days, secondary losses (bad debt write-offs, churn contagion, or quote expiration) compound exponentially.',
        actionPlaybook: [
          'Immediate Audit: Reconcile all affected records against source contracts and gateway transactions.',
          'Direct Stakeholder Engagement: Schedule human-to-human executive review with account owner.',
          'Policy Guardrail: Implement automated notification thresholds in ERP/CRM to flag recurrence instantly.',
        ],
        mitigationAdvice: finding.recommendedAction,
      });
    }

    const prompt = `You are Cairn, an elite Senior Software Architect and Strategic Financial Lead.
Examine this specific revenue leakage finding detected by our deterministic audit engine:

FINDING TITLE: ${finding.title}
CATEGORY: ${finding.categoryLabel} (${finding.category})
SEVERITY: ${finding.severity}
FINANCIAL IMPACT: ${finding.estimatedImpact}
CONFIDENCE: ${finding.confidence}%
EVIDENCE SUMMARY: ${finding.evidenceSummary}
EVIDENCE ROWS SAMPLE:
${JSON.stringify(evidenceSample, null, 2)}

TASK:
Deliver a deep, authoritative investigation breakdown for the business leadership.
Output MUST be strict JSON in this exact structure:
{
  "rootCause": "Detailed explanation of the underlying system/people/process failure that caused this revenue leak.",
  "riskMultiplier": "Clear assessment of how this leak escalates if left unresolved over 30/60/90 days.",
  "actionPlaybook": [
    "Step 1: Immediate containment action (within 24 hours)",
    "Step 2: Remediation action with account/customer",
    "Step 3: Permanent systemic fix (process, tooling, or approval rules)"
  ],
  "mitigationAdvice": "A punchy, actionable rule of thumb for company management."
}

Do NOT output conversational markdown. Output ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, isFallback: false, ...parsed });
  } catch (err: any) {
    console.error('[AI Investigation Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate leak investigation analysis',
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AI Revenue Leak Hunter] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
