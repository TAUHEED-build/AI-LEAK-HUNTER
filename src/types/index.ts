export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingStatus = 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';

export type LeakCategory =
  | 'OVERDUE_PAYMENTS'
  | 'UNPAID_INVOICES'
  | 'DUPLICATE_INVOICES'
  | 'ABNORMAL_DISCOUNTS'
  | 'DORMANT_HIGH_VALUE_LEADS'
  | 'HIGH_INTENT_LEADS_NO_FOLLOWUP'
  | 'DECLINING_PURCHASE_FREQUENCY'
  | 'CHURN_RISK'
  | 'REPEATED_REFUNDS'
  | 'CANCELLED_ORDERS'
  | 'FAILED_PAYMENTS'
  | 'REVENUE_CONCENTRATION_RISK'
  | 'LOST_SALES_PIPELINE'
  | 'DATA_INCONSISTENCY';

export interface AuditNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface RevenueLeakFinding {
  id: string;
  category: LeakCategory;
  categoryLabel: string;
  title: string;
  severity: Severity;
  status: FindingStatus;
  estimatedImpact: number;
  confidence: number; // 0 - 100%
  shortExplanation: string;
  detailedDescription: string;
  whyDetected: string;
  evidenceSummary: string;
  affectedRecordsCount: number;
  affectedRecordIds: string[];
  affectedRecords: Record<string, any>[];
  recommendedAction: string;
  humanApprovalRequired: boolean;
  detectionRuleId: string;
  assignedTo?: string;
  notes?: AuditNote[];
  aiAnalysis?: {
    summary: string;
    rootCause: string;
    riskMultiplier: string;
    actionPlaybook: string[];
    mitigationAdvice: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  paymentDate?: string;
  discountPercent?: number;
  notes?: string;
  originalData?: Record<string, any>;
}

export interface LeadRecord {
  id: string;
  leadName: string;
  company: string;
  contactEmail: string;
  dealValue: number;
  intentScore: number; // 1-10
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'DORMANT' | 'WON' | 'LOST';
  createdDate: string;
  lastContactDate: string;
  assignedRep?: string;
  source?: string;
  originalData?: Record<string, any>;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  segment?: string;
  totalLifetimeValue: number;
  orderCount: number;
  lastOrderDate: string;
  previousOrderDate?: string;
  churnRiskScore?: number; // 0 - 100
  status: 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'DORMANT';
  originalData?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  invoiceId?: string;
  customerId: string;
  customerName?: string;
  amount: number;
  date: string;
  method?: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PENDING';
  failureReason?: string;
  refundAmount?: number;
  isRefund?: boolean;
  originalData?: Record<string, any>;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PROCESSING';
  itemsCount?: number;
  discountAmount?: number;
  originalData?: Record<string, any>;
}

export type DetectedDataType = 'invoices' | 'leads' | 'customers' | 'payments' | 'orders' | 'mixed';

export interface ParsedDataset {
  id: string;
  name: string;
  detectedType: DetectedDataType;
  typeConfidence: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  invoices: InvoiceRecord[];
  leads: LeadRecord[];
  customers: CustomerRecord[];
  payments: PaymentRecord[];
  orders: OrderRecord[];
  rawRows: Record<string, any>[];
  uploadedAt: string;
  parsingWarnings: string[];
}

export interface AuditMetrics {
  totalRevenueAnalyzed: number;
  potentialRevenueAtRisk: number;
  activeRevenueLeaks: number;
  highPriorityFindings: number;
  overdueAmount: number;
  dormantOpportunityValue: number;
  resolvedRecoveredValue: number;
  severityCounts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  categoryBreakdown: {
    category: LeakCategory;
    label: string;
    count: number;
    impact: number;
  }[];
}

export interface DetectionSettings {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  currencySymbol: string;
  overdueDaysThreshold: number; // default 30
  dormantLeadsDaysThreshold: number; // default 30
  highIntentScoreThreshold: number; // default 7
  highDiscountPercentThreshold: number; // default 25%
  churnInactivityDaysThreshold: number; // default 60
  revenueConcentrationThreshold: number; // default 25%
  repeatedRefundCountThreshold: number; // default 2
}
