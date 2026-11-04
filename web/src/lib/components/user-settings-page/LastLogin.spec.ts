import type { SessionResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import LastLogin from './LastLogin.svelte';

const session = (createdAt: string): SessionResponseDto => ({
  id: createdAt,
  createdAt,
  updatedAt: createdAt,
  current: false,
  deviceOS: 'Linux',
  deviceType: 'Chrome',
  appVersion: null,
  isPendingSyncReset: false,
});

describe('LastLogin', () => {
  it('renders nothing without sessions', () => {
    render(LastLogin, { props: { sessions: [] } });
    expect(screen.queryByTestId('last-login')).not.toBeInTheDocument();
  });

  it('shows the most recent login time', () => {
    render(LastLogin, {
      props: { sessions: [session('2024-01-01T10:00:00.000Z'), session('2024-03-05T10:00:00.000Z')] },
    });
    const field = screen.getByTestId('last-login');
    expect(field).toBeInTheDocument();
    expect(field.querySelector('input')?.value).toContain('2024');
    expect(field.querySelector('input')?.value).not.toBe('');
  });
});
