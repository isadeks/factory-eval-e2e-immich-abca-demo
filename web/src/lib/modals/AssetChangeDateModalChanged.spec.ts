import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe.each([
  ['AssetChangeDateModal', AssetChangeDateModal, { asset: { id: 'asset-id' } as never }],
  ['AssetSelectionChangeDateModal', AssetSelectionChangeDateModal, { assets: [] }],
] as const)('%s changed-field indication', (_name, Component, extraProps) => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  const renderModal = () =>
    render(Component as never, { props: { initialDate, initialTimeZone, onClose, ...extraProps } } as never);
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

  test('does not mark any field as changed initially', async () => {
    renderModal();
    await screen.findByLabelText('date_and_time');

    expect(screen.queryByTestId('date-changed-indicator')).toBeNull();
    expect(screen.queryByTestId('changed-indicator')).toBeNull();
    expect(getDateInput().dataset.changed).toBeUndefined();
    expect(getTimeZoneInput().dataset.changed).toBeUndefined();
  });

  test('marks only the time zone as changed when only the time zone is edited', async () => {
    renderModal();
    const timezoneInput = getTimeZoneInput();

    await fireEvent.focus(timezoneInput);
    await fireEvent.input(timezoneInput, { target: { value: 'Pacific/Pitcairn' } });
    await fireEvent.click(await screen.findByText(/Pacific\/Pitcairn/i));

    await waitFor(() => expect(screen.getByTestId('changed-indicator')).toBeInTheDocument());
    expect(getTimeZoneInput().dataset.changed).toBe('true');
    expect(screen.queryByTestId('date-changed-indicator')).toBeNull();
    expect(getDateInput().dataset.changed).toBeUndefined();
  });

  test('marks the date as changed when the date is edited, and unmarks it when restored', async () => {
    renderModal();
    const dateInput = getDateInput();
    const original = dateInput.value;

    await fireEvent.input(dateInput, { target: { value: '2026-03-20T10:00:00.000' } });
    await fireEvent.blur(dateInput);

    await waitFor(() => expect(screen.getByTestId('date-changed-indicator')).toBeInTheDocument());
    expect(getDateInput().dataset.changed).toBe('true');
    expect(screen.queryByTestId('changed-indicator')).toBeNull();

    await fireEvent.input(dateInput, { target: { value: original } });
    await fireEvent.blur(dateInput);

    await waitFor(() => expect(screen.queryByTestId('date-changed-indicator')).toBeNull());
  });
});
