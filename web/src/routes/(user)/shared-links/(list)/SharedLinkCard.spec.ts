import { screen } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { init, register, waitLocale } from 'svelte-i18n';
import { renderWithTooltips } from '$tests/helpers';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import SharedLinkCard from './SharedLinkCard.svelte';

vi.mock('$lib/utils');

const renderCard = (expiresAt: string | null) =>
  renderWithTooltips(SharedLinkCard, { sharedLink: sharedLinkFactory.build({ expiresAt }) });

describe('SharedLinkCard component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows "Never" when the shared link has no expiry date', () => {
    renderCard(null);
    expect(screen.getByTestId('shared-link-expiry-date')).toHaveTextContent('Never');
  });

  it('shows the formatted expiry date when the shared link expires', () => {
    const expiresAt = DateTime.now().plus({ days: 10 });
    renderCard(expiresAt.toISO());
    const cell = screen.getByTestId('shared-link-expiry-date');
    expect(cell).toHaveTextContent(expiresAt.toLocaleString(DateTime.DATETIME_MED));
    expect(cell).not.toHaveTextContent('Never');
  });
});
