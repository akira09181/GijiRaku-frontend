import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FOLLOWED_TOPICS_STORAGE_KEY,
  hasFollowedTopics,
  isTopicFollowed,
  loadFollowedTopics,
  parseFollowedTopics,
  toggleFollowedTopic,
} from '../app/lib/followedTopics.js';

function createStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) values.set(FOLLOWED_TOPICS_STORAGE_KEY, initialValue);
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

const topic = {
  discussion_id: 'shinjuku-sick-child-care-2026-06-10',
  assembly_id: 'shinjuku-ward',
  municipality_name: '新宿区',
  theme_name: '病児保育の予約・受入問題',
};

test('フォロー追加時に必要な項目と登録日時を保存する', () => {
  const storage = createStorage();
  const followedAt = '2026-08-31T09:00:00.000Z';
  const result = toggleFollowedTopic(storage, [], topic, followedAt);

  assert.deepEqual(result, [{ ...topic, followed_at: followedAt }]);
  assert.deepEqual(loadFollowedTopics(storage), result);
  assert.equal(isTopicFollowed(result, topic.discussion_id), true);
  assert.equal(hasFollowedTopics(result), true);
});

test('同じ議題を再クリックするとフォローを解除する', () => {
  const storage = createStorage();
  const followed = toggleFollowedTopic(storage, [], topic, '2026-08-31T09:00:00.000Z');
  const result = toggleFollowedTopic(storage, followed, topic, '2026-08-31T10:00:00.000Z');

  assert.deepEqual(result, []);
  assert.deepEqual(loadFollowedTopics(storage), []);
  assert.equal(hasFollowedTopics(result), false);
});

test('壊れた保存値と重複したdiscussion_idを安全に処理する', () => {
  assert.deepEqual(parseFollowedTopics('{broken'), []);
  const valid = { ...topic, followed_at: '2026-08-31T09:00:00.000Z' };
  const parsed = parseFollowedTopics(JSON.stringify([valid, valid, { discussion_id: 'missing-fields' }]));
  assert.deepEqual(parsed, [valid]);
});

test('localStorageの読み込みに失敗しても空配列へフォールバックする', () => {
  const storage = {
    getItem() {
      throw new Error('storage unavailable');
    },
    setItem() {},
  };
  assert.deepEqual(loadFollowedTopics(storage), []);
});
