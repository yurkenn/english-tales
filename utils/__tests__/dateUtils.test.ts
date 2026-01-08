import { formatRelativeTime, formatDate, formatTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatRelativeTime', () => {
    it('returns "now" for times less than a minute ago', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('now');
    });

    it('returns minutes for times less than an hour ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m');
    });

    it('returns hours for times less than a day ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h');
    });

    it('returns days for times less than a week ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d');
    });

    it('returns formatted date for times more than a week ago', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      // The output depends on the locale, so we check if it's not relative format
      expect(formatRelativeTime(tenDaysAgo)).toContain('/'); // Assuming default locale uses /
    });

    it('handles Firestore timestamp-like objects', () => {
      const timestamp = {
        toDate: () => new Date(),
      };
      expect(formatRelativeTime(timestamp)).toBe('now');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-01T12:00:00');
      // Adjust expectation based on locale running in test environment
      // Assuming en-US based on implementation
      expect(formatDate(date)).toMatch(/Jan 1, 2023/);
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
        const date = new Date('2023-01-01T13:30:00');
        expect(formatTime(date)).toMatch(/01:30 PM/);
    });
  });
});
