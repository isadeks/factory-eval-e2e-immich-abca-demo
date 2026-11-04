import { Permission, type ApiKeyResponseDto } from '@immich/sdk';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { dateFormats } from '$lib/constants';
import UserApiKeyList from './UserApiKeyList.svelte';

// the action buttons need a tooltip provider, which is irrelevant to what is tested here
vi.mock('$lib/components/TableButton.svelte', () => ({ default: () => {} }));

describe('UserApiKeyList', () => {
  const createdAt = '2024-03-15T12:00:00.000Z';
  const key: ApiKeyResponseDto = {
    id: 'key-1',
    name: 'My test key',
    permissions: [Permission.All],
    createdAt,
    updatedAt: createdAt,
  };

  it('shows the creation date (with full timestamp tooltip) of each API key', () => {
    const otherCreatedAt = '2023-11-02T12:00:00.000Z';
    render(UserApiKeyList, { keys: [key, { ...key, id: 'key-2', name: 'Other key', createdAt: otherCreatedAt }] });

    const format = (date: string) => new Date(date).toLocaleDateString(undefined, dateFormats.settings);

    expect(screen.getByRole('columnheader', { name: 'created' })).toBeInTheDocument();

    const first = screen.getByRole('row', { name: /My test key/ });
    const second = screen.getByRole('row', { name: /Other key/ });
    expect(within(first).getByText(format(createdAt))).toBeInTheDocument();
    expect(within(second).getByText(format(otherCreatedAt))).toBeInTheDocument();

    // the full creation date and time is available as a tooltip on the date cell
    const cell = within(first).getByText(format(createdAt));
    expect(cell).toHaveAttribute('title', new Date(createdAt).toLocaleString(undefined, dateFormats.settingsWithTime));
  });
});
