import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';

describe('AssetChangeDateModal original value tooltip', () => {
  const initialDate = DateTime.fromISO('2024-05-01T10:30:00.000');
  const onClose = vi.fn();

  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('has no tooltip or tint while unchanged', () => {
    render(AssetChangeDateModal, {
      props: { initialDate, initialTimeZone: 'Europe/Lisbon', asset: { id: 'asset-id' } as never, onClose },
    });

    expect(getDateInput()).not.toHaveAttribute('title');
    expect(getDateInput().className).not.toContain('bg-green');
  });

  test('shows the original value as a tooltip once the date is changed', async () => {
    render(AssetChangeDateModal, {
      props: { initialDate, initialTimeZone: 'Europe/Lisbon', asset: { id: 'asset-id' } as never, onClose },
    });

    const input = getDateInput();
    await fireEvent.input(input, { target: { value: '2024-06-02T11:45' } });
    await fireEvent.change(input, { target: { value: '2024-06-02T11:45' } });
    await fireEvent.blur(input);

    await waitFor(() => expect(getDateInput()).toHaveAttribute('title'));
    // translations are not loaded in unit tests, so the message id is rendered
    expect(getDateInput()).toHaveAttribute('title', 'was_value');
    expect(getDateInput().className).toContain('bg-green');

    // changing back to the original value removes the tooltip again
    await fireEvent.input(input, { target: { value: '2024-05-01T10:30' } });
    await fireEvent.blur(input);
    await waitFor(() => expect(getDateInput()).not.toHaveAttribute('title'));
  });
});
