// @ts-check

/**
 * @param {string | null | undefined} statusUpdatedAt
 * @param {string | null | undefined} lastViewedStatusAt
 */
export function isFollowUnread(statusUpdatedAt, lastViewedStatusAt) {
  if (!statusUpdatedAt || !lastViewedStatusAt) return false;
  const statusTime = Date.parse(statusUpdatedAt);
  const viewedTime = Date.parse(lastViewedStatusAt);
  if (!Number.isFinite(statusTime) || !Number.isFinite(viewedTime)) return false;
  return statusTime > viewedTime;
}
