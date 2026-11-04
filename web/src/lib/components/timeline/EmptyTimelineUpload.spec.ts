import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { init, register, waitLocale } from 'svelte-i18n';
import EmptyTimelineUpload from './EmptyTimelineUpload.svelte';

describe('EmptyTimelineUpload component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows the drag and drop upload hint', () => {
    render(EmptyTimelineUpload, { onClick: vi.fn() });

    expect(screen.getByText('Drag photos here to upload')).toBeInTheDocument();
    expect(screen.getByText('Click to upload your first photo')).toBeInTheDocument();
  });

  it('calls onClick when the placeholder is clicked', async () => {
    const onClick = vi.fn();
    render(EmptyTimelineUpload, { onClick });

    await userEvent.setup().click(screen.getByText('Click to upload your first photo'));

    await waitFor(() => expect(onClick).toHaveBeenCalledOnce());
  });
});
