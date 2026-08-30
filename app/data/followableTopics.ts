import type { FollowableTopic } from '../types/follow';

export const SICK_CHILD_CARE_TOPIC: FollowableTopic = {
  discussionId: 'shinjuku-sick-child-care-2026-06-10',
  assemblyId: 'shinjuku-ward',
  municipalityName: '新宿区',
  themeName: '病児保育の予約・受入問題',
  modalTheme: '病児保育',
  lastCheckedAt: '2026/08/24',
  currentStatus: '本会議で質問・答弁済み。新しい対応状況は未確認',
  sourceUrl: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3193&schedule_id=2&minute_id=12',
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

const FOLLOWABLE_TOPICS = new Map<string, FollowableTopic>([
  [SICK_CHILD_CARE_TOPIC.discussionId, SICK_CHILD_CARE_TOPIC],
]);

export function getFollowableTopic(discussionId?: string): FollowableTopic | undefined {
  return discussionId ? FOLLOWABLE_TOPICS.get(discussionId) : undefined;
}
