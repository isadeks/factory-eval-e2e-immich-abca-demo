import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';
import { isDateTimeChanged } from './timezone-utils';

describe('isDateTimeChanged', () => {
  test('is false for identical values', () => {
    expect(isDateTimeChanged('2026-03-19T23:31:30.112', '2026-03-19T23:31:30.112')).toBe(false);
  });

  test('ignores insignificant seconds and milliseconds', () => {
    expect(isDateTimeChanged('2026-03-19T23:31:00.000', '2026-03-19T23:31')).toBe(false);
    expect(isDateTimeChanged('2026-03-19T23:31:30.000', '2026-03-19T23:31:30')).toBe(false);
  });

  test('is true for different values', () => {
    expect(isDateTimeChanged('2026-03-19T23:31:30.112', '2026-03-19T23:31:31.112')).toBe(true);
  });
});

describe('AssetChangeDateModal changed indicators', () => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  const getDateInput = async () => (await screen.findByDisplayValue('2026-03-19T23:31:30.112')) as HTMLInputElement;
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

  const renderModal = () =>
    render(AssetChangeDateModal, {
      props: { initialDate, initialTimeZone, timezoneInput: true, asset: { id: 'asset-id' } as never, onClose },
    });

  test('does not highlight any field initially', async () => {
    renderModal();

    expect(await getDateInput()).not.toHaveAttribute('data-changed');
    expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
  });

  test('highlights only the timezone when only the timezone changed', async () => {
    renderModal();
    const dateInput = await getDateInput();
    const timezoneInput = getTimeZoneInput();

    await fireEvent.focus(timezoneInput);
    await fireEvent.input(timezoneInput, { target: { value: 'Pacific/Pitcairn' } });
    await fireEvent.click(await screen.findByText(/Pacific\/Pitcairn/i));

    expect(timezoneInput).toHaveAttribute('data-changed', 'true');
    expect(timezoneInput).toHaveClass('immich-form-input-changed');
    expect(dateInput).not.toHaveAttribute('data-changed');
    expect(dateInput).not.toHaveClass('immich-form-input-changed');
  });

  test('highlights only the date when only the date changed', async () => {
    renderModal();
    const dateInput = await getDateInput();

    await fireEvent.input(dateInput, { target: { value: '2026-03-20T10:00:00.000' } });
    await fireEvent.blur(dateInput);

    await waitFor(() => expect(dateInput).toHaveAttribute('data-changed', 'true'));
    expect(dateInput).toHaveClass('immich-form-input-changed');
    expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
  });

  test('removes the highlight when the date is reverted', async () => {
    renderModal();
    const dateInput = await getDateInput();

    await fireEvent.input(dateInput, { target: { value: '2026-03-20T10:00:00.000' } });
    await fireEvent.blur(dateInput);
    await waitFor(() => expect(dateInput).toHaveAttribute('data-changed', 'true'));

    await fireEvent.input(dateInput, { target: { value: '2026-03-19T23:31:30.112' } });
    await fireEvent.blur(dateInput);
    await waitFor(() => expect(dateInput).not.toHaveAttribute('data-changed'));
  });
});
