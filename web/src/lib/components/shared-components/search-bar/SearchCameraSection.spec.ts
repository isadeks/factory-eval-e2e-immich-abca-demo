import { SearchSuggestionType, getSearchSuggestions } from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import type { SearchCameraFilter } from '$lib/types';
import SearchCameraSection from './SearchCameraSection.svelte';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  getSearchSuggestions: vi.fn(),
}));

describe('SearchCameraSection component', () => {
  beforeEach(() => {
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.mocked(getSearchSuggestions).mockImplementation(({ $type }) =>
      Promise.resolve($type === SearchSuggestionType.CameraLensModel ? ['EF 50mm f/1.8'] : ['Canon']),
    );
  });

  it('shows the lens model filter next to make and model', async () => {
    const filters: SearchCameraFilter = {};
    render(TestWrapper, { component: SearchCameraSection, componentProps: { filters } });

    expect(screen.getByRole('combobox', { name: /^make$/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^model$/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /lens_model/i })).toBeInTheDocument();

    await waitFor(() =>
      expect(getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ $type: SearchSuggestionType.CameraLensModel }),
      ),
    );
  });

  it('displays the selected lens model', async () => {
    render(TestWrapper, {
      component: SearchCameraSection,
      componentProps: { filters: { lensModel: 'EF 50mm f/1.8' } },
    });

    const lens = screen.getByRole('combobox', { name: /lens_model/i }) as HTMLInputElement;
    await waitFor(() => expect(lens.value).toBe('EF 50mm f/1.8'));
  });

  it('narrows the make and model suggestions by the selected lens model', async () => {
    render(TestWrapper, {
      component: SearchCameraSection,
      componentProps: { filters: { lensModel: 'EF 50mm f/1.8' } },
    });

    await waitFor(() => {
      expect(getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ $type: SearchSuggestionType.CameraMake, lensModel: 'EF 50mm f/1.8' }),
      );
      expect(getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ $type: SearchSuggestionType.CameraModel, lensModel: 'EF 50mm f/1.8' }),
      );
    });
  });
});
