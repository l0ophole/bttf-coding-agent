import { describe, expect, it } from 'vitest';

import {
  basename,
  formatDuration,
  formatDurationLong,
  formatTime,
  stripMarkdown,
  truncate,
} from './format';

describe('formatDuration', () => {
  it('uses seconds, minutes+seconds, then hours+minutes', () => {
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(134_000)).toBe('2m 14s');
    expect(formatDuration(9_240_000)).toBe('2h 34m');
  });

  it('never goes negative', () => {
    expect(formatDuration(-5_000)).toBe('0s');
  });
});

describe('formatDurationLong', () => {
  it('spells durations out for screen readers', () => {
    expect(formatDurationLong(134_000)).toBe('2 minutes 14 seconds');
    expect(formatDurationLong(3_600_000)).toBe('1 hour');
  });
});

describe('formatTime', () => {
  it('formats a clock time in the given locale', () => {
    const date = new Date(2026, 10, 7, 10, 24);
    expect(formatTime(date, 'en-US')).toBe('10:24 AM');
  });
});

describe('text helpers', () => {
  it('extracts the last path segment', () => {
    expect(basename('~/projects/web-app/server/routes/users.py')).toBe('users.py');
  });

  it('truncates on a word boundary', () => {
    expect(truncate('Investigate the failing users endpoint', 20)).toBe('Investigate the…');
  });

  it('strips the supported markdown', () => {
    expect(stripMarkdown('Run **all** `pytest` [docs](https://example.com)')).toBe(
      'Run all pytest docs',
    );
  });
});
