/**
 * @file dateUtils.ts
 * @description Shared date validation, auto-hyphen formatting, and itinerary day calculation utilities.
 * @requirements REQ-7
 * @functional FUN-6
 * @author Antigravity Agent
 */

export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Auto-hyphen formatting function.
 * Converts raw digits (e.g. 20260801) into YYYY-MM-DD format (2026-08-01).
 */
export function formatYYYYMMDD(text: string): string {
  if (DATE_REGEX.test(text.trim())) {
    return text.trim();
  }
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/**
 * Calculate total days automatically from start and end dates using explicit local Date components.
 */
export function calculateTotalDays(startDate: string, endDate: string): number | null {
  const startTrim = startDate.trim();
  const endTrim = endDate.trim();

  if (!startTrim || !endTrim) return null;

  if (/^\d+$/.test(endTrim) && Number(endTrim) > 0) {
    return Number(endTrim);
  }

  if (DATE_REGEX.test(startTrim) && DATE_REGEX.test(endTrim)) {
    const sParts = startTrim.split('-').map(Number);
    const eParts = endTrim.split('-').map(Number);

    const sY = sParts[0];
    const sM = sParts[1];
    const sD = sParts[2];
    const eY = eParts[0];
    const eM = eParts[1];
    const eD = eParts[2];

    if (
      sY !== undefined &&
      sM !== undefined &&
      sD !== undefined &&
      eY !== undefined &&
      eM !== undefined &&
      eD !== undefined
    ) {
      const start = new Date(sY, sM - 1, sD);
      const end = new Date(eY, eM - 1, eD);

      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }
  }

  return null;
}
