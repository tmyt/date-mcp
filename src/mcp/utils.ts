export const formatters = {
  toISOString: (date: Date) => date.toISOString(),
  toUnixTimestamp: (date: Date) => Math.floor(date.getTime() / 1000),
  toLocaleDateString: (date: Date, locale: string) => {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long'
    });
  },
  toRelativeTime: (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}日前`;
    if (diffHours > 0) return `${diffHours}時間前`;
    if (diffMinutes > 0) return `${diffMinutes}分前`;
    return '今';
  }
};

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getHumanReadableDiff(diffMs: number, isPast: boolean): string {
  const units = [
    { name: '年', ms: 365 * 24 * 60 * 60 * 1000 },
    { name: 'ヶ月', ms: 30 * 24 * 60 * 60 * 1000 },
    { name: '週間', ms: 7 * 24 * 60 * 60 * 1000 },
    { name: '日', ms: 24 * 60 * 60 * 1000 },
    { name: '時間', ms: 60 * 60 * 1000 },
    { name: '分', ms: 60 * 1000 },
    { name: '秒', ms: 1000 }
  ];

  for (const unit of units) {
    const value = Math.floor(diffMs / unit.ms);
    if (value > 0) {
      return `${value}${unit.name}${isPast ? '前' : '後'}`;
    }
  }
  
  return '今';
}

export const timeUnitJa = {
  seconds: '秒',
  minutes: '分',
  hours: '時間',
  days: '日',
  weeks: '週間',
  months: 'ヶ月',
  years: '年'
} as const;