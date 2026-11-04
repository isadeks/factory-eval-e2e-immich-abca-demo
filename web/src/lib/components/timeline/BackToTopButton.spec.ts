import '@testing-library/jest-dom';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { renderWithTooltips } from '$tests/helpers';
import BackToTopButton from './BackToTopButton.svelte';

describe('BackToTopButton component', () => {
  it('is hidden when not scrolled', () => {
    renderWithTooltips(BackToTopButton, { scrollTop: 0, viewportHeight: 800, onclick: vi.fn() });
    expect(screen.queryByTestId('back-to-top-button')).not.toBeInTheDocument();
  });

  it('is hidden when scrolled less than one screen', () => {
    renderWithTooltips(BackToTopButton, { scrollTop: 800, viewportHeight: 800, onclick: vi.fn() });
    expect(screen.queryByTestId('back-to-top-button')).not.toBeInTheDocument();
  });

  it('is shown after scrolling more than one screen', () => {
    renderWithTooltips(BackToTopButton, { scrollTop: 801, viewportHeight: 800, onclick: vi.fn() });
    expect(screen.getByTestId('back-to-top-button')).toBeInTheDocument();
  });

  it('calls onclick when clicked', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    renderWithTooltips(BackToTopButton, { scrollTop: 2000, viewportHeight: 800, onclick });
    await user.click(screen.getByTestId('back-to-top-button'));
    expect(onclick).toHaveBeenCalledOnce();
  });
});
