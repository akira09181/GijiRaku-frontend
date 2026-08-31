import test from 'node:test';
import assert from 'node:assert/strict';

import { isFollowUnread } from '../app/lib/followStatus.js';

test('status update is unread only when it is newer than the last detail view', () => {
  assert.equal(
    isFollowUnread('2026-08-24T09:00:00+09:00', '2026-08-23T23:59:59Z'),
    true,
  );
  assert.equal(
    isFollowUnread('2026-08-24T09:00:00+09:00', '2026-08-24T00:00:00Z'),
    false,
  );
  assert.equal(
    isFollowUnread('2026-08-24T09:00:00+09:00', '2026-08-25T00:00:00Z'),
    false,
  );
});

test('missing or invalid timestamps do not create a misleading badge', () => {
  assert.equal(isFollowUnread('2026-08-24T09:00:00+09:00', null), false);
  assert.equal(isFollowUnread('invalid', '2026-08-24T00:00:00Z'), false);
});
