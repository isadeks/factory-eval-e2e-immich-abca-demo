/**
 * Builds the document title, prefixing it with the number of selected assets (e.g. "3 selected") when a selection is active.
 */
export const getPageTitle = (title: string | undefined, selectedLabel: string | undefined): string => {
  const base = `${title || 'Web'} - Immich`;
  return selectedLabel ? `(${selectedLabel}) ${base}` : base;
};
