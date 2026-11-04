import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { locale } from '$lib/stores/preferences.store';
import ServerUptime from './ServerUptime.svelte';

describe('ServerUptime', () => {
  beforeEach(() => {
    locale.set('en');
  });

  it('shows the formatted server uptime', () => {
    render(ServerUptime, { uptimeSeconds: 2 * 86_400 + 3 * 3600 });

    expect(screen.getByTestId('server-uptime-value')).toHaveTextContent('2 days, 3 hr');
  });

  it('shows a placeholder while the uptime is unknown', () => {
    render(ServerUptime, {});

    expect(screen.getByTestId('server-uptime-value')).toHaveTextContent('-');
  });
});
