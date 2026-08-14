// Transport surge temporal factors for the Philippines
// Rush hour curves, payday detection, holiday calendar

// Normalized rush hour intensity curve (0-100) for each hour of the day
// Higher = more commuter demand = more surge potential
export const RUSH_HOUR_CURVE: number[] = [
  10, 10, 10, 10, 15, 30,  // 0-5 AM: minimal demand
  70, 90, 100, 80, 50, 40, // 6-11 AM: morning rush peaks at 8 AM
  55, 60, 50, 40, 45, 70,  // 12-5 PM: lunch bump, pre-evening build
  90, 100, 80, 50, 30, 15  // 6-11 PM: evening rush peaks at 7 PM
];

// Philippine holidays 2026 (regular + special non-working days)
// Format: [month (0-indexed), day]
const PH_HOLIDAYS_2026: [number, number][] = [
  // Regular holidays
  [0, 1],   // New Year's Day
  [3, 9],   // Araw ng Kagitingan (Day of Valor)
  [3, 2],   // Holy Thursday (estimated)
  [3, 3],   // Good Friday (estimated)
  [4, 1],   // Labor Day
  [5, 12],  // Independence Day
  [7, 21],  // Ninoy Aquino Day
  [7, 31],  // National Heroes Day (last Monday of August)
  [10, 30], // Bonifacio Day
  [11, 25], // Christmas Day
  [11, 30], // Rizal Day

  // Special non-working days
  [1, 1],   // Additional special day (Chinese New Year area)
  [3, 4],   // Black Saturday
  [7, 21],  // Ninoy Aquino Day
  [10, 1],  // All Saints Day
  [10, 2],  // All Souls Day
  [11, 8],  // Feast of the Immaculate Conception
  [11, 24], // Christmas Eve
  [11, 31], // New Year's Eve (last day)
];

function isSameDate(date: Date, month: number, day: number): boolean {
  return date.getMonth() === month && date.getDate() === day;
}

/**
 * Check if a date is a Philippine holiday
 */
export function isHoliday(date: Date): boolean {
  return PH_HOLIDAYS_2026.some(([m, d]) => isSameDate(date, m, d));
}

/**
 * Check if a date is the eve of a Philippine holiday
 */
export function isHolidayEve(date: Date): boolean {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isHoliday(tomorrow);
}

/**
 * Check if a date is a payday (15th or last day of month)
 */
export function isPayday(date: Date): boolean {
  const day = date.getDate();
  if (day === 15) return true;

  // Last day of month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return day === lastDay;
}

/**
 * Get payday boost points
 * - Payday itself: +20
 * - Day before/after payday: +10
 * - Otherwise: 0
 */
export function getPaydayBoost(date: Date): number {
  if (isPayday(date)) return 20;

  // Check day before and after
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isPayday(yesterday) || isPayday(tomorrow)) return 10;
  return 0;
}

/**
 * Get day type multiplier for surge calculation
 * - Weekday: 1.0 (full commuter demand)
 * - Holiday eve: 0.8 (early departures)
 * - Saturday: 0.7 (reduced)
 * - Sunday: 0.5 (minimal)
 * - Holiday: 0.4 (lowest)
 */
export function getDayTypeMultiplier(date: Date): number {
  if (isHoliday(date)) return 0.4;
  if (isHolidayEve(date)) return 0.8;

  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return 0.5; // Sunday
  if (dayOfWeek === 6) return 0.7; // Saturday
  return 1.0; // Weekday
}

/**
 * Compute the full temporal factor for a given hour and date
 * Returns 0-100 score
 */
export function computeTemporalFactor(hour: number, date: Date): number {
  const rushIntensity = RUSH_HOUR_CURVE[hour] ?? 30;
  const paydayBoost = getPaydayBoost(date);
  const dayMultiplier = getDayTypeMultiplier(date);

  const temporal = (
    (rushIntensity * 0.50) +
    (paydayBoost * 0.25) +
    (dayMultiplier * 100 * 0.25)
  );

  return Math.round(Math.min(100, Math.max(0, temporal)));
}
