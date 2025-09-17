/**
 * Korean Won currency utilities
 * All amounts are stored as integers (no decimals)
 */

/**
 * Format a number as Korean Won with proper comma separators
 * @param amount - Amount in Korean Won (integer)
 * @returns Formatted string like "₩1,234,567"
 */
export function formatKRW(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₩0';
  }
  
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * Parse a Korean Won string back to a number
 * @param krwString - String like "₩1,234,567" or "1,234,567"
 * @returns Number value
 */
export function parseKRW(krwString: string): number {
  if (!krwString) return 0;
  
  // Remove ₩ symbol and commas, then parse as integer
  const cleanString = krwString.replace(/[₩,\s]/g, '');
  const parsed = parseInt(cleanString, 10);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate if a Korean Won amount is valid
 * @param amount - Amount to validate
 * @returns True if valid, false otherwise
 */
export function isValidKRWAmount(amount: number): boolean {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         amount >= 0 && 
         Number.isInteger(amount);
}

/**
 * Format Korean Won for input fields (without ₩ symbol)
 * @param amount - Amount in Korean Won
 * @returns Formatted string like "1,234,567"
 */
export function formatKRWInput(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  
  return amount.toLocaleString('ko-KR');
}

/**
 * Format a Korean Won amount with abbreviations for large numbers
 * @param amount - Amount in Korean Won
 * @returns Formatted string like "₩1.2만" or "₩3.4억"
 */
export function formatKRWShort(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₩0';
  }
  
  if (amount >= 100000000) { // 1억 (100 million)
    return `₩${(amount / 100000000).toFixed(1)}억`;
  } else if (amount >= 10000) { // 1만 (10 thousand)
    return `₩${(amount / 10000).toFixed(1)}만`;
  } else {
    return formatKRW(amount);
  }
}