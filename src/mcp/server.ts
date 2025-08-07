import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { 
  getHumanReadableDiff, 
  timeUnits, 
  getDateComponents, 
  getDateContext, 
  formatDateInfo, 
  parseDateWithTimezone,
  addDuration,
  calculateDifference
} from './utils.js';

export function createDateMcpServer(timezone: string): McpServer {
  const server = new McpServer({
    name: 'Date MCP Server',
    version: '1.0.0'
  });

  // Register tools
  server.tool(
    'get_current_time',
    'Get current date and time. Provides time information in multiple formats to help AI agents correctly understand temporal context.',
    {
      timezone: z.string().optional().describe('Timezone (e.g., "Asia/Tokyo", "America/New_York"). If not specified, uses the server-configured timezone.'),
      locale: z.string().default('ja-JP').optional().describe('Locale (e.g., "ja-JP", "en-US"). Used for human-readable format display.')
    },
    async (args) => {
      const { timezone: requestTimezone, locale = 'ja-JP' } = args;
      const effectiveTimezone = requestTimezone || timezone;
      
      try {
        // Get current time in the effective timezone
        const now = DateTime.now().setZone(effectiveTimezone);
        
        if (!now.isValid) {
          throw new Error(`Invalid timezone: ${effectiveTimezone}`);
        }
        
        const timeInfo = {
          current: formatDateInfo(now, locale),
          components: getDateComponents(now),
          context: getDateContext(now)
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(timeInfo, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'calculate_date',
    'Calculate a date/time by adding or subtracting a specified duration from now or a given date. Examples: 1 day later, 3 days ago, 6 hours later, 2 weeks later, 8 years ago',
    {
      amount: z.number().describe('Amount to add or subtract (positive for future, negative for past)'),
      unit: z.enum(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years']).describe('Time unit'),
      base_date: z.string().optional().describe('Base date/time (ISO 8601 format). If not specified, uses current time'),
      base_timezone: z.string().optional().describe('Timezone for base_date interpretation if ISO string lacks timezone (e.g., "Asia/Tokyo"). ISO timezone takes precedence if present.'),
      target_timezone: z.string().optional().describe('Target timezone for output (e.g., "Asia/Tokyo", "America/New_York"). If not specified, uses the server-configured timezone.'),
      locale: z.string().default('ja-JP').optional().describe('Locale (e.g., "ja-JP", "en-US")')
    },
    async (args) => {
      const { amount, unit, base_date, base_timezone, target_timezone: requestTimezone, locale = 'ja-JP' } = args;
      const effectiveTimezone = requestTimezone || timezone;
      
      try {
        // Parse base date or use current time
        let baseDateTime: DateTime;
        if (base_date) {
          const parsed = parseDateWithTimezone(base_date, base_timezone || timezone);
          if (!parsed || !parsed.isValid) {
            throw new Error('Invalid date format');
          }
          baseDateTime = parsed;
        } else {
          baseDateTime = DateTime.now().setZone(timezone);
        }

        // Add the duration
        const resultDateTime = addDuration(baseDateTime, amount, unit);
        
        // Convert to target timezone
        const resultInTargetZone = resultDateTime.setZone(effectiveTimezone);
        
        const direction = amount > 0 ? 'later' : 'ago';
        const absAmount = Math.abs(amount);
        const unitName = timeUnits[unit] || '';

        const result = {
          calculation: {
            base_date: baseDateTime.toISO() || '',
            amount: amount,
            unit: unit,
            description: `${absAmount} ${unitName}${absAmount !== 1 ? 's' : ''} ${direction}`
          },
          result: formatDateInfo(resultInTargetZone, locale),
          components: getDateComponents(resultInTargetZone),
          context: {
            ...getDateContext(resultInTargetZone),
            fromNow: getHumanReadableDiff(resultInTargetZone, DateTime.now().setZone(effectiveTimezone))
          }
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'get_time_difference',
    'Calculate the difference between a specified date/time and the current time. Useful for understanding relationships with past or future dates.',
    {
      reference_date: z.string().describe('Reference date/time for comparison (ISO 8601 format)'),
      reference_timezone: z.string().optional().describe('Timezone for reference_date interpretation if ISO string lacks timezone (e.g., "Asia/Tokyo"). ISO timezone takes precedence if present.'),
      unit: z.enum(['seconds', 'minutes', 'hours', 'days', 'all']).default('all').describe('Unit to display'),
      target_timezone: z.string().optional().describe('Target timezone for output (e.g., "Asia/Tokyo", "America/New_York"). If not specified, uses the server-configured timezone.'),
      locale: z.string().default('ja-JP').optional().describe('Locale (e.g., "ja-JP", "en-US")')
    },
    async (args) => {
      const { reference_date, reference_timezone, unit = 'all', target_timezone: requestTimezone, locale = 'ja-JP' } = args;
      const effectiveTimezone = requestTimezone || timezone;
      
      try {
        // Get current time in effective timezone
        const now = DateTime.now().setZone(effectiveTimezone);
        
        // Parse reference date
        const parsed = parseDateWithTimezone(reference_date, reference_timezone || timezone);
        if (!parsed || !parsed.isValid) {
          throw new Error('Invalid date format');
        }
        
        // Convert to effective timezone for display
        const target = parsed.setZone(effectiveTimezone);
        
        // Calculate differences
        const diff = calculateDifference(now, target);
        const isPast = now > target;
        
        const result = {
          reference_date: formatDateInfo(target, locale),
          current_date: formatDateInfo(now, locale),
          is_past: isPast,
          relative: isPast ? 'past' : 'future',
          difference: unit === 'all' ? diff : { [unit]: diff[unit as keyof typeof diff] },
          human_readable: getHumanReadableDiff(target, now)
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'convert_timezone',
    'Convert a date/time to a different timezone. The input date should include timezone information in the ISO string.',
    {
      source_date: z.string().describe('Date/time to convert (ISO 8601 format)'),
      source_timezone: z.string().optional().describe('Timezone for source_date interpretation if ISO string lacks timezone (e.g., "Asia/Tokyo"). ISO timezone takes precedence if present.'),
      target_timezone: z.string().describe('Target timezone (e.g., "Asia/Tokyo", "America/New_York")'),
      locale: z.string().default('ja-JP').optional().describe('Locale (e.g., "ja-JP", "en-US")')
    },
    async (args) => {
      const { source_date, source_timezone, target_timezone, locale = 'ja-JP' } = args;
      
      try {
        // Parse source date
        const parsed = parseDateWithTimezone(source_date, source_timezone || timezone);
        if (!parsed || !parsed.isValid) {
          throw new Error('Invalid date format');
        }
        
        // Convert to target timezone
        const targetDateTime = parsed.setZone(target_timezone);
        
        if (!targetDateTime.isValid) {
          throw new Error(`Invalid target timezone: ${target_timezone}`);
        }
        
        const result = {
          input: {
            iso: parsed.toISO() || '',
            unix: Math.floor(parsed.toSeconds()),
            milliseconds: parsed.toMillis()
          },
          output: {
            timezone: target_timezone,
            formatted: formatDateInfo(targetDateTime, locale),
            components: getDateComponents(targetDateTime),
            context: getDateContext(targetDateTime)
          }
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  return server;
}