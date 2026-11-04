import { getLastLogin } from '$lib/utils/last-login';

describe('getLastLogin', () => {
  it('returns undefined without sessions', () => {
    expect(getLastLogin([])).toBeUndefined();
  });

  it('returns the most recent session creation time', () => {
    expect(
      getLastLogin([
        { createdAt: '2024-01-01T10:00:00.000Z' },
        { createdAt: '2024-03-01T10:00:00.000Z' },
        { createdAt: '2024-02-01T10:00:00.000Z' },
      ]),
    ).toBe('2024-03-01T10:00:00.000Z');
  });

  it('ignores invalid dates', () => {
    expect(getLastLogin([{ createdAt: 'nope' }, { createdAt: '2024-02-01T10:00:00.000Z' }])).toBe(
      '2024-02-01T10:00:00.000Z',
    );
  });
});
