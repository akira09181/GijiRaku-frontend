// @ts-check

/** @typedef {import('../types/follow').FollowUpDetails} FollowUpDetails */

/** @type {FollowUpDetails} */
export const SICK_CHILD_CARE_FOLLOW_UP = {
  discussion_id: 'shinjuku-sick-child-care-2026-06-10',
  last_checked_at: '2026/08/24',
  current_status: '本会議で質問・答弁済み。新しい対応状況は未確認',
  source_url: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3193&schedule_id=2&minute_id=12',
  updates: [
    {
      date: '2026/06/10',
      label: '議会で質問',
      detail: '病児保育の利用断り、受入体制、空き状況と予約方法の改善について質問されました。',
      kind: 'question',
    },
    {
      date: '2026/06/10',
      label: '行政から答弁',
      detail: '受入体制を総合的に検討し、空き状況や予約に使えるICTツールを研究すると答弁しました。',
      kind: 'answer',
    },
    {
      date: '2026/08/24',
      label: '現在確認できている対応状況',
      detail: '新しい対応状況はまだ確認できていません。変化がないことも確認結果として記録しています。',
      kind: 'no-change',
    },
  ],
};

/** @type {ReadonlyMap<string, FollowUpDetails>} */
const FOLLOW_UP_DETAILS = new Map([
  [SICK_CHILD_CARE_FOLLOW_UP.discussion_id, SICK_CHILD_CARE_FOLLOW_UP],
]);

/**
 * 確認済みの更新情報だけを返す。フォロー可否とは独立している。
 * @param {string | undefined} discussionId
 * @returns {FollowUpDetails | undefined}
 */
export function getFollowUpDetails(discussionId) {
  return discussionId ? FOLLOW_UP_DETAILS.get(discussionId) : undefined;
}

/** @param {string} discussionId */
export function getFollowTopicCtaLabel(discussionId) {
  return getFollowUpDetails(discussionId) ? 'その後を見る' : '議論を見る';
}
