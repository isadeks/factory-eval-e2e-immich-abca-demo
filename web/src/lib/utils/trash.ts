const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Number of whole days (rounded up) left until a trashed asset is permanently deleted.
 * Never returns a negative number: assets past the retention period are due for deletion ("0 days").
 */
export const getDaysUntilPermanentDeletion = (
  deletedAt: string | Date,
  trashDays: number,
  now: Date = new Date(),
): number => {
  const deletionTime = new Date(deletedAt).getTime() + trashDays * MS_PER_DAY;
  const remaining = Math.ceil((deletionTime - now.getTime()) / MS_PER_DAY);
  return Math.max(0, remaining);
};
