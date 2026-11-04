import '@testing-library/jest-dom';
import { personFactory } from '@test-data/factories/person-factory';
import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import PeopleCard from './PeopleCard.svelte';

describe('PeopleCard', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  const props = { onMergePeople: vi.fn(), onHidePerson: vi.fn(), onToggleFavorite: vi.fn() };

  it('shows how many photos the person appears in', () => {
    render(PeopleCard, { person: personFactory.build({ assetCount: 42 }), ...props });

    expect(screen.getByTestId('person-photo-count')).toHaveTextContent('42 photos');
  });

  it('uses the singular form for a single photo', () => {
    render(PeopleCard, { person: personFactory.build({ assetCount: 1 }), ...props });

    expect(screen.getByTestId('person-photo-count')).toHaveTextContent('1 photo');
    expect(screen.getByTestId('person-photo-count')).not.toHaveTextContent('photos');
  });

  it('hides the count when the server did not provide one', () => {
    render(PeopleCard, { person: personFactory.build(), ...props });

    expect(screen.queryByTestId('person-photo-count')).not.toBeInTheDocument();
  });
});
