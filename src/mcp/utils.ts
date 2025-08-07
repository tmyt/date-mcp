import { DateTime, Duration } from 'luxon';

// Time unit names for display
export const timeUnits = {
  seconds: 'second',
  minutes: 'minute',
  hours: 'hour',
  days: 'day',
  weeks: 'week',
  months: 'month',
  years: 'year'
} as const;

// Get week number for a DateTime
export function getWeekNumber(dt: DateTime): number {
  return dt.weekNumber;
}

// Get day of year for a DateTime
export function getDayOfYear(dt: DateTime): number {
  return dt.ordinal;
}

// Get human-readable time difference
export function getHumanReadableDiff(dt1: DateTime, dt2: DateTime): string {
  // Use Luxon's relative time formatting
  return dt1.toRelative({ base: dt2 }) || 'now';
}

// Get date components for a given DateTime
export function getDateComponents(dt: DateTime) {
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hour: dt.hour,
    minute: dt.minute,
    second: dt.second,
    dayOfWeek: dt.weekday === 7 ? 0 : dt.weekday, // Convert Sunday from 7 to 0
    weekOfYear: dt.weekNumber,
    offset: -dt.offset, // Negate to match JavaScript's getTimezoneOffset convention
  };
}

// Get date context information
export function getDateContext(dt: DateTime) {
  return {
    isWeekend: dt.weekday >= 6, // Saturday = 6, Sunday = 7 in Luxon
    quarter: dt.quarter,
    dayOfYear: dt.ordinal,
    daysInMonth: dt.daysInMonth,
  };
}

// Format date information in various formats
export function formatDateInfo(dt: DateTime, locale: string = 'ja-JP') {
  return {
    iso: dt.toISO() || '',
    unix: Math.floor(dt.toSeconds()),
    human: dt.setLocale(locale).toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS),
    milliseconds: dt.toMillis(),
  };
}

// Parse date with optional timezone fallback
export function parseDateWithTimezone(dateStr: string, fallbackTimezone?: string): DateTime | null {
  // Check if the string has explicit timezone information
  const hasTimezone = /[+-]\d{2}:\d{2}|Z$/.test(dateStr);
  
  if (hasTimezone) {
    // Parse with timezone info
    return DateTime.fromISO(dateStr);
  }
  
  // No timezone in string, use fallback if provided
  if (fallbackTimezone) {
    // Parse as local time in the specified timezone
    const dt = DateTime.fromISO(dateStr, { zone: 'UTC' }).setZone(fallbackTimezone, { keepLocalTime: true });
    if (dt.isValid) return dt;
  }
  
  // No fallback timezone, parse as local/UTC
  return DateTime.fromISO(dateStr);
}

// Add duration to a DateTime
export function addDuration(dt: DateTime, amount: number, unit: keyof typeof timeUnits): DateTime {
  const durationObj: any = {};
  durationObj[unit] = amount;
  return dt.plus(Duration.fromObject(durationObj));
}

// Calculate the difference between two DateTimes
export function calculateDifference(dt1: DateTime, dt2: DateTime) {
  const diff = dt1.diff(dt2, ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds']);
  
  return {
    milliseconds: Math.abs(diff.milliseconds),
    seconds: Math.floor(Math.abs(diff.as('seconds'))),
    minutes: Math.floor(Math.abs(diff.as('minutes'))),
    hours: Math.floor(Math.abs(diff.as('hours'))),
    days: Math.floor(Math.abs(diff.as('days'))),
    weeks: Math.floor(Math.abs(diff.as('weeks'))),
    months: Math.floor(Math.abs(diff.as('months'))),
    years: Math.floor(Math.abs(diff.as('years'))),
  };
}