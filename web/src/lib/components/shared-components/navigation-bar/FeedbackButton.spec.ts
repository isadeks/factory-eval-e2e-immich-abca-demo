import { screen } from '@testing-library/svelte';
import FeedbackButton from '$lib/components/shared-components/navigation-bar/FeedbackButton.svelte';
import { renderWithTooltips } from '$tests/helpers';

describe('FeedbackButton component', () => {
  it('renders a link that opens the feedback page in a new tab', () => {
    renderWithTooltips(FeedbackButton, {});

    const link = screen.getByRole('link', { name: 'send_feedback' });
    expect(link).toHaveAttribute('href', 'https://github.com/immich-app/immich/issues/new/choose');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });
});
