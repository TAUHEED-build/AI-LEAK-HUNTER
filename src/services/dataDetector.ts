import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CustomerRecord, DetectedDataType, InvoiceRecord, LeadRecord, OrderRecord, ParsedDataset, PaymentRecord } from '../types';

// Helper to normalize column header strings
function normalizeHeader(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Helper to safely parse numeric values (supports ₹, $, commas, shorthand like 5L, 50k)
export function parseFinancialAmount(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim().toUpperCase();
  // Strip currency symbols and whitespace
  str = str.replace(/[₹$€£,]/g, '').trim();

  // Handle shorthand like "3.5L" (3.5 Lakh = 350,000) or "2.5CR"
  if (str.endsWith('CR') || str.endsWith('CRORE')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 10000000;
  }
  if (str.endsWith('L') || str.endsWith('LAKH')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 100000;
  }
  if (str.endsWith('K')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 1000;
  }
  if (str.endsWith('M')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 1000000;
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Helper to parse dates into ISO YYYY-MM-DD
export function parseDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // If Excel numeric serial date (e.g. 45200)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
    const parts = str.split(/[/-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return str;
}

// Detect data type based on headers and sample values
export function detectTableType(headers: string[]): { type: DetectedDataType; confidence: number } {
  const normHeaders = headers.map(normalizeHeader);

  let invoiceScore = 0;
  let leadScore = 0;
  let customerScore = 0;
  let paymentScore = 0;
  let orderScore = 0;

  normHeaders.forEach((h) => {
    // Invoice indicators
    if (h.includes('invoice') || h.includes('invno') || h.includes('billno') || h.includes('duedate')) invoiceScore += 3;
    if (h.includes('amount') || h.includes('total') || h.includes('subtotal')) invoiceScore += 1;
    if (h.includes('paymentterms') || h.includes('discount')) invoiceScore += 1;

    // Lead indicators
    if (h.includes('lead') || h.includes('prospect') || h.includes('pipeline') || h.includes('deal')) leadScore += 3;
    if (h.includes('intent') || h.includes('stage') || h.includes('lastcontact') || h.includes('rep')) leadScore += 2;
    if (h.includes('opportunity') || h.includes('dealsize') || h.includes('dealvalue')) leadScore += 2;

    // Customer indicators
    if (h.includes('churn') || h.includes('ltv') || h.includes('lifetime') || h.includes('segment')) customerScore += 3;
    if (h.includes('customer') || h.includes('client') || h.includes('companyname')) customerScore += 1;
    if (h.includes('ordercount') || h.includes('purchasefrequency')) customerScore += 2;

    // Payment indicators
    if (h.includes('txn') || h.includes('transaction') || h.includes('refund') || h.includes('failurereason')) paymentScore += 3;
    if (h.includes('gateway') || h.includes('paymentmethod') || h.includes('charge')) paymentScore += 2;

    // Order indicators
    if (h.includes('orderno') || h.includes('orderid') || h.includes('orderdate') || h.includes('sku')) orderScore += 3;
  });

  const scores = [
    { type: 'invoices' as DetectedDataType, score: invoiceScore },
    { type: 'leads' as DetectedDataType, score: leadScore },
    { type: 'customers' as DetectedDataType, score: customerScore },
    { type: 'payments' as DetectedDataType, score: paymentScore },
    { type: 'orders' as DetectedDataType, score: orderScore },
  ];

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score >= 3) {
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    const confidence = Math.min(98, Math.round((scores[0].score / (total || 1)) * 100));
    return { type: scores[0].type, confidence };
  }

  return { type: 'mixed', confidence: 50 };
}

// Map generic object rows to Invoices
function mapToInvoices(rows: Record<string, any>[]): InvoiceRecord[] {
  return rows.map((r, i) => {
    // Find matching keys
    const keys = Object.keys(r);
    const findVal = (keywords: string[]) => {
      const match = keys.find((k) => keywords.some((kw) => normalizeHeader(k).includes(kw)));
      return match ? r[match] : undefined;
    };

    const invNum = String(findVal(['inv', 'bill', 'number', 'id']) || `INV-${1000 + i}`);
    const custId = String(findVal(['custid', 'clientid']) || `cust-${i + 1}`);
    const custName = String(findVal(['cust', 'client', 'company', 'name', 'account']) || 'Enterprise Client');
    const date = parseDateString(findVal(['date', 'created', 'invoice_date', 'issued']) || '2026-08-01');
    const dueDate = parseDateString(findVal(['due', 'expiry', 'payment_due']) || date);
    const amount = parseFinancialAmount(findVal(['amount', 'total', 'grand', 'value', 'price', 'inr', 'usd']));
    const rawStatus = String(findVal(['status', 'state', 'payment_status']) || 'UNPAID').toUpperCase();

    let status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' = 'UNPAID';
    if (rawStatus.includes('PAID') && !rawStatus.includes('UNPAID')) status = 'PAID';
    else if (rawStatus.includes('OVERDUE')) status = 'OVERDUE';
    else if (rawStatus.includes('CANCEL')) status = 'CANCELLED';
    else if (rawStatus.includes('REFUND')) status = 'REFUNDED';
    else status = 'UNPAID';

    const discountVal = parseFinancialAmount(findVal(['discount', 'discountpercent', 'disc']));
    const notes = String(findVal(['notes', 'comment', 'description', 'remarks', 'memo']) || '');

    return {
      id: `inv-parsed-${i + 1}`,
      invoiceNumber: invNum,
      customerId: custId,
      customerName: custName,
      date,
      dueDate,
      amount,
      status,
      discountPercent: discountVal > 0 ? discountVal : undefined,
      notes: notes || undefined,
      originalData: r,
    };
  });
}

// Map generic rows to Leads
function mapToLeads(rows: Record<string, any>[]): LeadRecord[] {
  return rows.map((r, i) => {
    const keys = Object.keys(r);
    const findVal = (keywords: string[]) => {
      const match = keys.find((k) => keywords.some((kw) => normalizeHeader(k).includes(kw)));
      return match ? r[match] : undefined;
    };

    const leadName = String(findVal(['lead', 'contact', 'person', 'fullname', 'name']) || `Lead ${i + 1}`);
    const company = String(findVal(['company', 'organization', 'account', 'business']) || 'Acme Group');
    const email = String(findVal(['email', 'mail']) || `contact${i}@example.com`);
    const dealValue = parseFinancialAmount(findVal(['deal', 'value', 'amount', 'opportunity', 'size', 'pipeline', 'worth']));
    const intentRaw = findVal(['intent', 'score', 'priority', 'rating']);
    let intentScore = 5;
    if (typeof intentRaw === 'number') intentScore = Math.max(1, Math.min(10, intentRaw));
    else if (intentRaw) {
      const parsed = parseFloat(String(intentRaw).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) intentScore = Math.max(1, Math.min(10, parsed));
    }

    const createdDate = parseDateString(findVal(['created', 'date', 'added']) || '2026-07-01');
    const lastContactDate = parseDateString(findVal(['last', 'contact', 'touch', 'followup', 'activity']) || createdDate);
    const rep = String(findVal(['rep', 'owner', 'assigned', 'agent']) || 'Sales Team');
    const source = String(findVal(['source', 'channel', 'campaign']) || 'Inbound');

    return {
      id: `lead-parsed-${i + 1}`,
      leadName,
      company,
      contactEmail: email,
      dealValue,
      intentScore,
      status: 'QUALIFIED',
      createdDate,
      lastContactDate,
      assignedRep: rep,
      source,
      originalData: r,
    };
  });
}

// Map generic rows to Customers
function mapToCustomers(rows: Record<string, any>[]): CustomerRecord[] {
  return rows.map((r, i) => {
    const keys = Object.keys(r);
    const findVal = (keywords: string[]) => {
      const match = keys.find((k) => keywords.some((kw) => normalizeHeader(k).includes(kw)));
      return match ? r[match] : undefined;
    };

    const name = String(findVal(['customer', 'company', 'client', 'name', 'account']) || `Customer ${i + 1}`);
    const email = String(findVal(['email', 'mail']) || `client${i}@example.com`);
    const ltv = parseFinancialAmount(findVal(['ltv', 'lifetime', 'revenue', 'spend', 'totalval']));
    const orderCount = Math.max(1, Math.round(parseFinancialAmount(findVal(['orders', 'count', 'ordercount', 'transactions'])) || 1));
    const lastOrderDate = parseDateString(findVal(['lastorder', 'lastpurchase', 'recentdate', 'lastdate']) || '2026-08-01');
    const churnRaw = parseFinancialAmount(findVal(['churn', 'risk', 'churnscore', 'churnprob']));

    return {
      id: `cust-parsed-${i + 1}`,
      name,
      email,
      totalLifetimeValue: ltv,
      orderCount,
      lastOrderDate,
      churnRiskScore: churnRaw > 0 ? churnRaw : undefined,
      status: churnRaw > 70 ? 'AT_RISK' : 'ACTIVE',
      originalData: r,
    };
  });
}

// Map generic rows to Payments
function mapToPayments(rows: Record<string, any>[]): PaymentRecord[] {
  return rows.map((r, i) => {
    const keys = Object.keys(r);
    const findVal = (keywords: string[]) => {
      const match = keys.find((k) => keywords.some((kw) => normalizeHeader(k).includes(kw)));
      return match ? r[match] : undefined;
    };

    const txnId = String(findVal(['txn', 'trans', 'id', 'reference']) || `TXN-${1000 + i}`);
    const invoiceId = String(findVal(['inv', 'invoice', 'invoiceid']) || '');
    const custId = String(findVal(['cust', 'customerid']) || `cust-${i + 1}`);
    const custName = String(findVal(['customername', 'company', 'client']) || 'Client');
    const amount = parseFinancialAmount(findVal(['amount', 'total', 'sum', 'paid']));
    const date = parseDateString(findVal(['date', 'timestamp', 'time']) || '2026-09-01');
    const statusRaw = String(findVal(['status', 'state', 'result']) || 'SUCCESS').toUpperCase();

    let status: 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PENDING' = 'SUCCESS';
    if (statusRaw.includes('FAIL') || statusRaw.includes('DECLIN')) status = 'FAILED';
    else if (statusRaw.includes('REFUND')) status = 'REFUNDED';
    else if (statusRaw.includes('PEND')) status = 'PENDING';

    const failReason = String(findVal(['reason', 'error', 'failure', 'code']) || '');
    const isRefund = status === 'REFUNDED' || parseFinancialAmount(findVal(['refund', 'refundamount'])) > 0;

    return {
      id: `pay-parsed-${i + 1}`,
      transactionId: txnId,
      invoiceId: invoiceId || undefined,
      customerId: custId,
      customerName: custName,
      amount,
      date,
      status,
      failureReason: failReason || undefined,
      isRefund,
      refundAmount: isRefund ? amount : undefined,
      originalData: r,
    };
  });
}

// Parse Raw File (CSV, XLSX, XLS)
export async function parseUploadedFile(file: File): Promise<ParsedDataset> {
  const fileName = file.name;
  const warnings: string[] = [];

  return new Promise<ParsedDataset>((resolve, reject) => {
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            throw new Error('The uploaded spreadsheet contains no data or rows.');
          }

          const headers = Object.keys(rawRows[0] || {});
          const { type: detectedType, confidence } = detectTableType(headers);

          const dataset: ParsedDataset = {
            id: `ds-${Date.now()}`,
            name: fileName,
            detectedType,
            typeConfidence: confidence,
            rowCount: rawRows.length,
            columnCount: headers.length,
            headers,
            invoices: detectedType === 'invoices' || detectedType === 'mixed' ? mapToInvoices(rawRows) : [],
            leads: detectedType === 'leads' || detectedType === 'mixed' ? mapToLeads(rawRows) : [],
            customers: detectedType === 'customers' || detectedType === 'mixed' ? mapToCustomers(rawRows) : [],
            payments: detectedType === 'payments' || detectedType === 'mixed' ? mapToPayments(rawRows) : [],
            orders: [],
            rawRows,
            uploadedAt: new Date().toISOString(),
            parsingWarnings: warnings,
          };

          resolve(dataset);
        } catch (err: any) {
          reject(new Error(err.message || 'Failed to parse Excel spreadsheet.'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed.'));
      reader.readAsBinaryString(file);
    } else {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          try {
            if (results.errors && results.errors.length > 0) {
              results.errors.slice(0, 3).forEach((err) => {
                warnings.push(`Row ${err.row}: ${err.message}`);
              });
            }

            const rawRows = (results.data as Record<string, any>[]).filter((row) =>
              Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
            );

            if (rawRows.length === 0) {
              throw new Error('CSV file is empty or contains only blank rows.');
            }

            const headers = Object.keys(rawRows[0] || {});
            const { type: detectedType, confidence } = detectTableType(headers);

            const dataset: ParsedDataset = {
              id: `ds-${Date.now()}`,
              name: fileName,
              detectedType,
              typeConfidence: confidence,
              rowCount: rawRows.length,
              columnCount: headers.length,
              headers,
              invoices: detectedType === 'invoices' || detectedType === 'mixed' ? mapToInvoices(rawRows) : [],
              leads: detectedType === 'leads' || detectedType === 'mixed' ? mapToLeads(rawRows) : [],
              customers: detectedType === 'customers' || detectedType === 'mixed' ? mapToCustomers(rawRows) : [],
              payments: detectedType === 'payments' || detectedType === 'mixed' ? mapToPayments(rawRows) : [],
              orders: [],
              rawRows,
              uploadedAt: new Date().toISOString(),
              parsingWarnings: warnings,
            };

            resolve(dataset);
          } catch (err: any) {
            reject(new Error(err.message || 'Error processing CSV rows.'));
          }
        },
        error: (err) => {
          reject(new Error(`CSV Parsing failed: ${err.message}`));
        },
      });
    }
  });
}
