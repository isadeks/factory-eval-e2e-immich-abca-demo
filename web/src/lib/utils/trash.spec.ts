import { getDaysUntilPermanentDeletion } from '$lib/utils/trash';

describe('getDaysUntilPermanentDeletion', () => {
  const now = new Date('2024-03-10T12:00:00.000Z');

  it('returns the full retention period for an asset trashed just now', () => {
    expect(getDaysUntilPermanentDeletion(now, 30, now)).toBe(30);
  });

  it('subtracts the days already spent in the trash', () => {
    expect(getDaysUntilPermanentDeletion('2024-03-05T12:00:00.000Z', 30, now)).toBe(25);
  });

  it('rounds partial days up', () => {
    expect(getDaysUntilPermanentDeletion('2024-03-05T18:00:00.000Z', 30, now)).toBe(26);
  });

  it('returns 1 on the last day', () => {
    expect(getDaysUntilPermanentDeletion('2024-02-09T18:00:00.000Z', 30, now)).toBe(1);
  });

  it('never returns a negative number once the retention period has passed', () => {
    expect(getDaysUntilPermanentDeletion('2023-01-01T00:00:00.000Z', 30, now)).toBe(0);
  });

  it('accepts a Date', () => {
    expect(getDaysUntilPermanentDeletion(new Date('2024-03-09T12:00:00.000Z'), 7, now)).toBe(6);
  });
});
