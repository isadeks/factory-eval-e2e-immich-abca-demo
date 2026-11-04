import { render, screen } from '@testing-library/svelte';
import { addMessages } from 'svelte-i18n';
import ArchiveEmptyState from './ArchiveEmptyState.svelte';

describe('ArchiveEmptyState', () => {
  beforeAll(() => {
    addMessages('dev', { nothing_archived_yet: 'Nothing archived yet' });
  });

  it('shows the empty message', () => {
    render(ArchiveEmptyState);

    expect(screen.getByText('Nothing archived yet')).toBeInTheDocument();
  });

  it('centers the message and mutes its colour', () => {
    render(ArchiveEmptyState);

    expect(screen.getByTestId('archive-empty-state')).toHaveClass('items-center', 'justify-center');
    const message = screen.getByText('Nothing archived yet');
    expect(message).toHaveClass('text-center', 'text-gray-500');
  });
});
