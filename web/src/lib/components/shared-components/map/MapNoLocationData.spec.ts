import { render, screen } from '@testing-library/svelte';
import { addMessages, locale } from 'svelte-i18n';
import MapNoLocationData from './MapNoLocationData.svelte';

describe('MapNoLocationData component', () => {
  beforeAll(async () => {
    addMessages('en', { no_location_data: 'No location data' });
    await locale.set('en');
  });

  it('shows a muted "No location data" message', () => {
    render(MapNoLocationData);

    const message = screen.getByText('No location data');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-gray-500');
    expect(screen.getByTestId('map-no-location-data')).toHaveClass('items-center', 'justify-center');
  });
});
