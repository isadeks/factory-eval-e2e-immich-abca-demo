import { DateTime } from 'luxon';
import { getPersonAge } from './person';

describe('getPersonAge', () => {
  const now = DateTime.fromISO('2024-06-15');

  it('should return undefined without a birth date', () => {
    expect(getPersonAge(null, now)).toBeUndefined();
    expect(getPersonAge(undefined, now)).toBeUndefined();
  });

  it('should return undefined for an invalid birth date', () => {
    expect(getPersonAge('not-a-date', now)).toBeUndefined();
  });

  it('should return undefined for a birth date in the future', () => {
    expect(getPersonAge('2025-01-01', now)).toBeUndefined();
  });

  it('should return months for babies under one year', () => {
    expect(getPersonAge('2024-06-01', now)).toEqual({ key: 'age_months', values: { months: 0 } });
    expect(getPersonAge('2023-12-15', now)).toEqual({ key: 'age_months', values: { months: 6 } });
    expect(getPersonAge('2023-06-16', now)).toEqual({ key: 'age_months', values: { months: 11 } });
  });

  it('should return one year and months between 12 and 24 months', () => {
    expect(getPersonAge('2022-12-15', now)).toEqual({ key: 'age_year_months', values: { months: 6 } });
  });

  it('should return exactly one year on the first birthday', () => {
    expect(getPersonAge('2023-06-15', now)).toEqual({ key: 'age_years', values: { years: 1 } });
  });

  it('should return whole years from two years on', () => {
    expect(getPersonAge('2022-06-15', now)).toEqual({ key: 'age_years', values: { years: 2 } });
    expect(getPersonAge('1990-06-16', now)).toEqual({ key: 'age_years', values: { years: 33 } });
    expect(getPersonAge('1990-06-15', now)).toEqual({ key: 'age_years', values: { years: 34 } });
  });
});
