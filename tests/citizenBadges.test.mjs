import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BADGE_STORAGE_KEY,
  loadUnlockedBadges,
  unlockCitizenBadge,
} from '../app/lib/citizenBadges.ts';

test('unlockCitizenBadge persists idempotently in storage', () => {
  const storage = {
    value: '',
    getItem(key) {
      return key === BADGE_STORAGE_KEY ? this.value : null;
    },
    setItem(key, next) {
      if (key === BADGE_STORAGE_KEY) this.value = next;
    },
  };

  assert.equal(unlockCitizenBadge('first_reaction', storage), true);
  assert.equal(unlockCitizenBadge('first_reaction', storage), false);
  assert.deepEqual(loadUnlockedBadges(storage), ['first_reaction']);
});
