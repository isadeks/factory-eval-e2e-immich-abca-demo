import type { SessionResponseDto } from '@immich/sdk';

/**
 * Returns the most recent login time (ISO string) across the given sessions.
 * A session's creation time is the moment the user logged in.
 */
export const getLastLogin = (sessions: Pick<SessionResponseDto, 'createdAt'>[]): string | undefined => {
  let latest: { iso: string; time: number } | undefined;
  for (const { createdAt } of sessions) {
    const time = Date.parse(createdAt);
    if (!Number.isNaN(time) && (!latest || time > latest.time)) {
      latest = { iso: createdAt, time };
    }
  }
  return latest?.iso;
};
