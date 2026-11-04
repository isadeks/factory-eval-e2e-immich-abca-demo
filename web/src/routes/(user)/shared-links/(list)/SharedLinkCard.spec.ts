import { addMessages } from 'svelte-i18n';
import { renderWithTooltips } from '$tests/helpers';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import SharedLinkCard from './SharedLinkCard.svelte';

vi.mock('$lib/utils');

describe('SharedLinkCard component', () => {
  beforeAll(() => {
    addMessages('dev', { shared_link_view_count: '{count, plural, one {# view} other {# views}}' });
  });

  it('shows the view count of the shared link', () => {
    const { getByTestId } = renderWithTooltips(SharedLinkCard, {
      sharedLink: sharedLinkFactory.build({ viewCount: 42 }),
    });

    expect(getByTestId('shared-link-view-count')).toHaveTextContent('42 views');
  });

  it('shows a singular label for a single view', () => {
    const { getByTestId } = renderWithTooltips(SharedLinkCard, {
      sharedLink: sharedLinkFactory.build({ viewCount: 1 }),
    });

    expect(getByTestId('shared-link-view-count')).toHaveTextContent('1 view');
    expect(getByTestId('shared-link-view-count')).not.toHaveTextContent('1 views');
  });

  it('shows zero views for a link that was never opened', () => {
    const { getByTestId } = renderWithTooltips(SharedLinkCard, {
      sharedLink: sharedLinkFactory.build({ viewCount: 0 }),
    });

    expect(getByTestId('shared-link-view-count')).toHaveTextContent('0 views');
  });
});
