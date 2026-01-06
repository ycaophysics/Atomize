/**
 * Parse natural language dates into Date objects
 */

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

export interface ParsedDate {
  date: Date;
  confidence: number;
  originalText: string;
}

/**
 * Parse a natural language date string
 */
export function parseNaturalDate(input: string, referenceDate?: Date): ParsedDate | null {
  const ref = referenceDate || new Date();
  const normalized = input.toLowerCase().trim();

  // Try each parser in order of specificity
  const parsers = [
    parseToday,
    parseTomorrow,
    parseYesterday,
    parseNextWeek,
    parseInNDays,
    parseInNWeeks,
    parseNextDayOfWeek,
    parseThisDayOfWeek,
    parseByDay,
    parseMonthDay,
    parseEndOfWeek,
    parseEndOfMonth,
  ];

  for (const parser of parsers) {
    const result = parser(normalized, ref);
    if (result) {
      return {
        ...result,
        originalText: input,
      };
    }
  }

  // Try to parse as ISO date
  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) {
    return {
      date: isoDate,
      confidence: 1.0,
      originalText: input,
    };
  }

  return null;
}

function parseToday(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'today' || input === 'now') {
    const date = new Date(ref);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 1.0 };
  }
  return null;
}

function parseTomorrow(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'tomorrow') {
    const date = new Date(ref);
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 1.0 };
  }
  return null;
}

function parseYesterday(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'yesterday') {
    const date = new Date(ref);
    date.setDate(date.getDate() - 1);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 1.0 };
  }
  return null;
}

function parseNextWeek(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'next week') {
    const date = new Date(ref);
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 0.9 };
  }
  return null;
}

function parseInNDays(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  const match = input.match(/^in\s+(\d+)\s+days?$/);
  if (match) {
    const days = parseInt(match[1], 10);
    const date = new Date(ref);
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 1.0 };
  }
  return null;
}

function parseInNWeeks(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  const match = input.match(/^in\s+(\d+)\s+weeks?$/);
  if (match) {
    const weeks = parseInt(match[1], 10);
    const date = new Date(ref);
    date.setDate(date.getDate() + weeks * 7);
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 1.0 };
  }
  return null;
}

function parseNextDayOfWeek(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  const match = input.match(/^next\s+(\w+)$/);
  if (match) {
    const dayName = match[1].toLowerCase();
    const dayIndex = DAY_NAMES.indexOf(dayName);
    if (dayIndex !== -1) {
      const date = new Date(ref);
      const currentDay = date.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      // "next" means the week after, so add 7 more days
      daysToAdd += 7;
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(23, 59, 59, 999);
      return { date, confidence: 0.95 };
    }
  }
  return null;
}

function parseThisDayOfWeek(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  const match = input.match(/^(this\s+)?(\w+)$/);
  if (match) {
    const dayName = match[2].toLowerCase();
    const dayIndex = DAY_NAMES.indexOf(dayName);
    if (dayIndex !== -1) {
      const date = new Date(ref);
      const currentDay = date.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(23, 59, 59, 999);
      return { date, confidence: 0.9 };
    }
  }
  return null;
}

function parseByDay(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  const match = input.match(/^by\s+(\w+)$/);
  if (match) {
    const dayName = match[1].toLowerCase();
    const dayIndex = DAY_NAMES.indexOf(dayName);
    if (dayIndex !== -1) {
      const date = new Date(ref);
      const currentDay = date.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(23, 59, 59, 999);
      return { date, confidence: 0.9 };
    }
  }
  return null;
}

function parseMonthDay(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  // Match "January 15" or "Jan 15" or "15 January"
  const patterns = [
    /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?$/,
    /^(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let monthStr: string, dayStr: string;
      if (isNaN(parseInt(match[1], 10))) {
        monthStr = match[1];
        dayStr = match[2];
      } else {
        dayStr = match[1];
        monthStr = match[2];
      }

      const monthIndex = MONTH_NAMES.findIndex(
        (m) => m.startsWith(monthStr.toLowerCase()) || monthStr.toLowerCase().startsWith(m.slice(0, 3))
      );

      if (monthIndex !== -1) {
        const day = parseInt(dayStr, 10);
        if (day >= 1 && day <= 31) {
          const date = new Date(ref.getFullYear(), monthIndex, day, 23, 59, 59, 999);
          // If the date is in the past, assume next year
          if (date < ref) {
            date.setFullYear(date.getFullYear() + 1);
          }
          return { date, confidence: 0.95 };
        }
      }
    }
  }
  return null;
}

function parseEndOfWeek(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'end of week' || input === 'eow' || input === 'this weekend') {
    const date = new Date(ref);
    const currentDay = date.getDay();
    const daysToFriday = 5 - currentDay;
    date.setDate(date.getDate() + (daysToFriday >= 0 ? daysToFriday : daysToFriday + 7));
    date.setHours(23, 59, 59, 999);
    return { date, confidence: 0.85 };
  }
  return null;
}

function parseEndOfMonth(input: string, ref: Date): Omit<ParsedDate, 'originalText'> | null {
  if (input === 'end of month' || input === 'eom') {
    const date = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    return { date, confidence: 0.9 };
  }
  return null;
}

/**
 * Format a date in natural language
 */
export function formatNaturalDate(date: Date, referenceDate?: Date): string {
  const ref = referenceDate || new Date();
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((targetDay.getTime() - refDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0 && diffDays <= 7) {
    return DAY_NAMES[date.getDay()];
  }
  if (diffDays > 7 && diffDays <= 14) {
    return `next ${DAY_NAMES[date.getDay()]}`;
  }

  // Default to month day format
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

/**
 * Extract deadline from text (looks for common patterns)
 */
export function extractDeadlineFromText(text: string): ParsedDate | null {
  const patterns = [
    /by\s+([^,.]+)/i,
    /due\s+([^,.]+)/i,
    /deadline[:\s]+([^,.]+)/i,
    /before\s+([^,.]+)/i,
    /until\s+([^,.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const result = parseNaturalDate(match[1].trim());
      if (result) {
        return result;
      }
    }
  }

  return null;
}
