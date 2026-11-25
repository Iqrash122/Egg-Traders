const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format number as Pakistani Rupees (PKR), e.g., "Rs. 21,300"
 */
export function formatPKR(amount) {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
  return `Rs. ${formatted}`;
}

/**
 * Format quantity of Petti cleanly, e.g., "10 Petti" or "2.5 Petti"
 */
export function formatPetti(qty, includeUnit = true) {
  const num = Number(qty) || 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
  }).format(num);
  return includeUnit ? `${formatted} Petti` : formatted;
}

/**
 * Format YYYY-MM-DD date string to Pakistani date format: "25 Nov 2026"
 */
export function formatPKDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = String(Number(parts[2])).padStart(2, '0');
  if (isNaN(year) || monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${day} ${MONTHS[monthIdx]} ${year}`;
}

/**
 * Return today's date in local timezone as YYYY-MM-DD
 */
export function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate a simple unique ID
 */
export function generateId(prefix = 'rec') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

