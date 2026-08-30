import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FOLLOWED_TOPICS_STORAGE_KEY,
  createFollowTopic,
  hasFollowedTopics,
  isTopicFollowed,
  loadFollowedTopics,
  parseFollowedTopics,
  toggleFollowedTopic,
} from '../app/lib/followedTopics.js';
import {
  getFollowTopicCtaLabel,
  getFollowUpDetails,
} from '../app/data/followUpDetails.js';

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

const publicAssemblyTopics = [
  ['tokyo-metropolitan', '東京都議会', 'tokyo-app-2026-06-16', '東京アプリの機能強化'],
  ['shinjuku-ward', '新宿区議会', 'shinjuku-sick-child-care-2026-06-10', '病児保育の利用拒否と予約・空き状況の改善'],
  ['machida-city', '町田市議会', 'machida-regional-transport-2026-03-26', '交通不便地域の新しい地域交通モデル'],
  ['shinagawa-ward', '品川区議会', 'shinagawa-inclusive-education-2026-02-19', '深い学び・多様性の包摂と教員負担軽減'],
  ['shibuya-ward', '渋谷区議会', 'shibuya-inflation-support-2026-01-16', '物価高騰緊急支援給付金と子育て応援手当'],
  ['arakawa-ward', '荒川区議会', 'arakawa-ward-auto-2026-03-17-685-6-171', '組織名称と学童クラブ'],
  ['hachioji-city', '八王子市議会', 'hachioji-rag-ai-2026-06-11', '検索拡張生成AIの行政利用'],
];

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

test('公開中7議会の会議録からフォロー基本情報を生成する', () => {
  for (const [assemblyId, assemblyName, discussionId, themeName] of publicAssemblyTopics) {
    assert.deepEqual(
      createFollowTopic(
        { id: assemblyId, name: assemblyName },
        { discussion_id: discussionId, topic: themeName },
      ),
      {
        discussion_id: discussionId,
        assembly_id: assemblyId,
        municipality_name: assemblyName,
        theme_name: themeName,
      },
    );
  }
});

test('discussion_idまたはtopicを持たないレコードではフォロー対象を生成しない', () => {
  assert.equal(createFollowTopic({ id: 'tokyo-metropolitan', name: '東京都議会' }, { topic: 'テーマ' }), null);
  assert.equal(createFollowTopic({ id: 'tokyo-metropolitan', name: '東京都議会' }, { discussion_id: 'stable-id' }), null);
});

test('複数テーマを保存し、1件だけ解除しても他のフォローを維持する', () => {
  const storage = createStorage();
  const tokyo = createFollowTopic(
    { id: publicAssemblyTopics[0][0], name: publicAssemblyTopics[0][1] },
    { discussion_id: publicAssemblyTopics[0][2], topic: publicAssemblyTopics[0][3] },
  );
  const machida = createFollowTopic(
    { id: publicAssemblyTopics[2][0], name: publicAssemblyTopics[2][1] },
    { discussion_id: publicAssemblyTopics[2][2], topic: publicAssemblyTopics[2][3] },
  );
  assert.ok(tokyo);
  assert.ok(machida);

  const one = toggleFollowedTopic(storage, [], tokyo, '2026-08-31T09:00:00.000Z');
  const two = toggleFollowedTopic(storage, one, machida, '2026-08-31T10:00:00.000Z');
  assert.equal(two.length, 2);
  assert.deepEqual(loadFollowedTopics(storage), two);

  const remaining = toggleFollowedTopic(storage, two, tokyo, '2026-08-31T11:00:00.000Z');
  assert.deepEqual(remaining.map((item) => item.discussion_id), [machida.discussion_id]);
  assert.deepEqual(loadFollowedTopics(storage), remaining);
});

test('localStorageへ保存できない場合は失敗を呼び出し元へ伝える', () => {
  const storage = {
    getItem() { return null; },
    setItem() { throw new Error('quota exceeded'); },
  };
  assert.throws(() => toggleFollowedTopic(storage, [], topic), /quota exceeded/);
});

test('フォロー可否と確認済み更新情報を分離しCTAを出し分ける', () => {
  assert.ok(getFollowUpDetails('shinjuku-sick-child-care-2026-06-10'));
  assert.equal(getFollowTopicCtaLabel('shinjuku-sick-child-care-2026-06-10'), 'その後を見る');
  assert.equal(getFollowUpDetails('tokyo-app-2026-06-16'), undefined);
  assert.equal(getFollowTopicCtaLabel('tokyo-app-2026-06-16'), '議論を見る');
});

test('並べ替えや絞り込み後もAPIのdiscussion_idを一意キーとして維持する', () => {
  const records = publicAssemblyTopics.map(([, , discussionId, themeName]) => ({
    discussion_id: discussionId,
    topic: themeName,
  }));
  const target = records[2];
  const reordered = [...records].reverse().filter((record) => record.topic.includes('交通'));
  assert.equal(reordered[0].discussion_id, target.discussion_id);
});
