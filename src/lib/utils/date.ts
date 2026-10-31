/**
 * Date calculation and formatting utilities for UtsavMate-AI.
 * @module date
 */

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculates the number of days remaining until the target event date.
 *
 * @param dateStr - The target event date in YYYY-MM-DD or ISO 8601 string format.
 * @param relativeTo - Optional reference date to calculate from (defaults to `new Date()`).
 * @returns Positive integer for future dates, 0 or negative integer for current or past dates.
 *
 * @example
 * ```ts
 * getDaysUntil("2027-02-15"); // returns days until Feb 15, 2027
 * ```
 */
export function getDaysUntil(dateStr: string, relativeTo: Date = new Date()): number {
  const eventDate = new Date(dateStr);
  return Math.ceil((eventDate.getTime() - relativeTo.getTime()) / MILLISECONDS_PER_DAY);
}

/**
 * Formats a date string into Indian standard locale display format (e.g. "15 Feb 2027").
 *
 * @param dateStr - The date string to format.
 * @returns Formatted localized string or original string if parsing fails.
 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
