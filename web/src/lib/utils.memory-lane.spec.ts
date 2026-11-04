import { MemoryType, type MemoryResponseDto } from '@immich/sdk';
import { init, register, waitLocale } from 'svelte-i18n';
import { get } from 'svelte/store';
import { memoryLaneCardTitle } from '$lib/utils';

const buildMemory = (year: number): MemoryResponseDto =>
  ({ id: 'memory-1', type: MemoryType.OnThisDay, data: { year }, assets: [] }) as unknown as MemoryResponseDto;

describe('memoryLaneCardTitle', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include the memory year in the card title', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    expect(get(memoryLaneCardTitle)(buildMemory(2023))).toBe('3 years ago (2023)');
  });

  it('should use the singular form for a one year old memory', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    expect(get(memoryLaneCardTitle)(buildMemory(2025))).toBe('1 year ago (2025)');
  });
});
