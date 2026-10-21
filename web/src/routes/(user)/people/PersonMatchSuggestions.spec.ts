import { confirmMatchSuggestion, rejectMatchSuggestion, type PersonMatchSuggestionResponseDto } from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { personFactory } from '@test-data/factories/person-factory';
import PersonMatchSuggestions from './PersonMatchSuggestions.svelte';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  confirmMatchSuggestion: vi.fn(),
  rejectMatchSuggestion: vi.fn(),
}));

const buildSuggestion = (): PersonMatchSuggestionResponseDto => ({
  id: 'suggestion-1',
  distance: 0.55,
  person: personFactory.build({ id: 'new-person', name: '' }),
  suggestedPerson: personFactory.build({ id: 'existing-person', name: 'Alice' }),
});

describe('PersonMatchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the algorithm is sure about every face', () => {
    render(PersonMatchSuggestions, { suggestions: [], onResolved: vi.fn() });

    expect(screen.queryByTestId('person-match-suggestions')).toBeNull();
  });

  it('asks the user whether two people are the same person', () => {
    render(PersonMatchSuggestions, { suggestions: [buildSuggestion()], onResolved: vi.fn() });

    expect(screen.getByText('person_match_title')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // people are unnamed by default
    expect(screen.getByText('unnamed_person')).toBeInTheDocument();
  });

  it('merges the people when the user confirms', async () => {
    const suggestion = buildSuggestion();
    const onResolved = vi.fn();
    vi.mocked(confirmMatchSuggestion).mockResolvedValue(suggestion.suggestedPerson);
    render(PersonMatchSuggestions, { suggestions: [suggestion], onResolved });

    await userEvent.setup().click(screen.getByRole('button', { name: 'person_match_same' }));

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(suggestion, true));
    expect(confirmMatchSuggestion).toHaveBeenCalledWith({ id: suggestion.id });
    expect(rejectMatchSuggestion).not.toHaveBeenCalled();
  });

  it('keeps the people apart when the user rejects', async () => {
    const suggestion = buildSuggestion();
    const onResolved = vi.fn();
    vi.mocked(rejectMatchSuggestion).mockResolvedValue(undefined as never);
    render(PersonMatchSuggestions, { suggestions: [suggestion], onResolved });

    await userEvent.setup().click(screen.getByRole('button', { name: 'person_match_different' }));

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(suggestion, false));
    expect(rejectMatchSuggestion).toHaveBeenCalledWith({ id: suggestion.id });
    expect(confirmMatchSuggestion).not.toHaveBeenCalled();
  });
});
