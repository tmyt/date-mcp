import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const server = new FastMCP({
  name: 'Date MCP Server',
  version: '1.0.0'
});

const formatters = {
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

server.addTool({
  name: 'get_current_time',
  description: '現在の日時を取得します。複数のフォーマットで時刻情報を提供し、AIエージェントが時制を正しく理解できるようにします。',
  parameters: z.object({
    timezone: z.string().optional().describe('タイムゾーン (例: "Asia/Tokyo", "America/New_York")。指定しない場合はシステムのタイムゾーンを使用します。'),
    locale: z.string().default('ja-JP').optional().describe('ロケール (例: "ja-JP", "en-US")。人間が読める形式の表示に使用されます。')
  }),
  execute: async (args) => {
    const { timezone, locale = 'ja-JP' } = args;
    try {
      const now = new Date();
      
      const timeInfo: any = {
        current: {
          iso: formatters.toISOString(now),
          unix: formatters.toUnixTimestamp(now),
          human: formatters.toLocaleDateString(now, locale),
          milliseconds: now.getTime()
        },
        timezone: {
          system: Intl.DateTimeFormat().resolvedOptions().timeZone,
          requested: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          offset: now.getTimezoneOffset()
        },
        components: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds(),
          dayOfWeek: now.getDay(),
          weekOfYear: getWeekNumber(now)
        },
        context: {
          isWeekend: now.getDay() === 0 || now.getDay() === 6,
          quarter: Math.floor((now.getMonth() + 3) / 3),
          dayOfYear: getDayOfYear(now),
          daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        }
      };

      if (timezone && timezone !== timeInfo.timezone.system) {
        try {
          const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
          timeInfo.timezone.converted = {
            iso: formatters.toISOString(tzDate),
            human: formatters.toLocaleDateString(tzDate, locale)
          };
        } catch (error) {
          timeInfo.timezone.error = `無効なタイムゾーン: ${timezone}`;
        }
      }

      return JSON.stringify(timeInfo, null, 2);
    } catch (error) {
      return `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
    }
  }
});

server.addTool({
  name: 'get_time_difference',
  description: '指定された日時と現在時刻の差を計算します。過去や未来の日時との関係を理解するのに役立ちます。',
  parameters: z.object({
    target_date: z.string().describe('比較対象の日時 (ISO 8601形式)'),
    unit: z.enum(['seconds', 'minutes', 'hours', 'days', 'all']).default('all').describe('表示する単位')
  }),
  execute: async (args) => {
    const { target_date, unit = 'all' } = args;
    try {
      const now = new Date();
      const target = new Date(target_date);
      
      if (isNaN(target.getTime())) {
        throw new Error('無効な日付形式です');
      }

      const diffMs = now.getTime() - target.getTime();
      const isPast = diffMs > 0;
      const absDiffMs = Math.abs(diffMs);
      
      const diff = {
        milliseconds: absDiffMs,
        seconds: Math.floor(absDiffMs / 1000),
        minutes: Math.floor(absDiffMs / (1000 * 60)),
        hours: Math.floor(absDiffMs / (1000 * 60 * 60)),
        days: Math.floor(absDiffMs / (1000 * 60 * 60 * 24)),
        weeks: Math.floor(absDiffMs / (1000 * 60 * 60 * 24 * 7)),
        months: Math.floor(absDiffMs / (1000 * 60 * 60 * 24 * 30)),
        years: Math.floor(absDiffMs / (1000 * 60 * 60 * 24 * 365))
      };

      const result = {
        target_date: target.toISOString(),
        current_date: now.toISOString(),
        is_past: isPast,
        relative: isPast ? '過去' : '未来',
        difference: unit === 'all' ? diff : { [unit]: diff[unit as keyof typeof diff] },
        human_readable: getHumanReadableDiff(absDiffMs, isPast)
      };

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
    }
  }
});

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getHumanReadableDiff(diffMs: number, isPast: boolean): string {
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

server.start({
  transportType: 'stdio'
});