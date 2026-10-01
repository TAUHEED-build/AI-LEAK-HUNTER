/**
 * Currency & Number formatters with support for Indian Lakhs/Crores and standard Western millions.
 */

export function formatCurrency(amount: number, currencyCode: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return currencyCode === 'INR' ? '₹0' : '$0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currencyCode === 'INR') {
    // Format in Lakhs (L) and Crores (Cr) for large numbers
    if (absAmount >= 10000000) {
      const cr = (absAmount / 10000000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${cr} Cr`;
    }
    if (absAmount >= 100000) {
      const lk = (absAmount / 100000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${lk}L`;
    }
    // Indian comma grouping (e.g., 1,45,000)
    return `${isNegative ? '-' : ''}₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(absAmount)}`;
  }

  // Western currencies
  const symbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : '£';
  if (absAmount >= 1000000) {
    return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1000000).toFixed(2)}M`;
  }
  if (absAmount >= 1000) {
    return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1000).toFixed(1)}k`;
  }
  return `${isNegative ? '-' : ''}${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(absAmount)}`;
}

export function formatExactCurrency(amount: number, currencyCode: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'): string {
  const symbol = currencyCode === 'INR' ? '₹' : currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : '£';
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getDaysBetween(date1: string, date2: string = new Date().toISOString()): number {
  try {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const diffTime = d2 - d1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
