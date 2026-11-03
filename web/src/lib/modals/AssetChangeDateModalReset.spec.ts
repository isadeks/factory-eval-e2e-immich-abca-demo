import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe.each([
  { name: 'AssetChangeDateModal', Component: AssetChangeDateModal, props: { asset: { id: 'asset-id' } } },
  { name: 'AssetSelectionChangeDateModal', Component: AssetSelectionChangeDateModal, props: { assets: [] } },
])('$name reset buttons', ({ Component, props }) => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  const renderModal = () =>
    render(Component as never, { props: { ...props, initialDate, initialTimeZone, onClose } as never });
  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByRole('combobox', { name: /timezone/i }) as HTMLInputElement;

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

  test('does not show reset buttons or tint when nothing changed', () => {
    renderModal();

    expect(screen.queryByTestId('reset-date-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reset-timezone-button')).not.toBeInTheDocument();
    expect(getDateInput().className).not.toContain('bg-green-100');
  });

  test('restores the original date when the date reset button is clicked', async () => {
    renderModal();
    const original = getDateInput().value;

    await fireEvent.input(getDateInput(), { target: { value: '2026-03-20T10:00:00.000' } });
    await fireEvent.blur(getDateInput());

    expect(getDateInput().className).toContain('bg-green-100');
    await fireEvent.click(await screen.findByTestId('reset-date-button'));

    await waitFor(() => expect(getDateInput().value).toBe(original));
    expect(getDateInput().className).not.toContain('bg-green-100');
    expect(screen.queryByTestId('reset-date-button')).not.toBeInTheDocument();
  });

  test('restores the original time zone when the time zone reset button is clicked', async () => {
    renderModal();
    const original = getTimeZoneInput().value;

    await fireEvent.focus(getTimeZoneInput());
    await fireEvent.input(getTimeZoneInput(), { target: { value: 'Pacific/Pitcairn' } });
    await fireEvent.click(await screen.findByText(/Pacific\/Pitcairn/i));

    expect(getTimeZoneInput().value).toBe('Pacific/Pitcairn (-08:00)');
    expect(screen.queryByTestId('reset-date-button')).not.toBeInTheDocument();
    await fireEvent.click(await screen.findByTestId('reset-timezone-button'));

    await waitFor(() => expect(getTimeZoneInput().value).toBe(original));
    expect(screen.queryByTestId('reset-timezone-button')).not.toBeInTheDocument();
  });
});
