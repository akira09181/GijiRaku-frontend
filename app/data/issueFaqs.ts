export interface IssueFaqDefinition {
  readonly issueId: string;
  readonly questions: readonly string[];
}

const ISSUE_FAQS: readonly IssueFaqDefinition[] = [
  {
    issueId: 'tokyo-app-2026-06-16',
    questions: ['東京アプリで何が変わる？', 'どんな支援情報が届く？', '生成AI案内は何をする？'],
  },
  {
    issueId: 'shinjuku-sick-child-care-2026-06-10',
    questions: ['病児保育を利用できないのはなぜ？', '空き状況はどう確認する？', '予約方法はどう改善される？'],
  },
  {
    issueId: 'machida-regional-transport-2026-03-26',
    questions: ['交通不便地域とは？', 'どんな移動手段を検討している？', '導入までの課題は？'],
  },
  {
    issueId: 'shinagawa-inclusive-education-2026-02-19',
    questions: ['誰の学びを支える議題？', '教員負担をどう減らす？', '教育DXは何に使う？'],
  },
  {
    issueId: 'shibuya-inflation-support-2026-01-16',
    questions: ['給付の対象は誰？', '子育て世帯への上乗せは？', '予算は可決された？'],
  },
  {
    issueId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    questions: ['予算の重点分野は？', '成果をどう確認する？', '区民の声はどう反映する？'],
  },
  {
    issueId: 'hachioji-rag-ai-2026-06-11',
    questions: ['検索拡張生成AIとは？', '回答根拠は確認できる？', '安全対策はどうする？'],
  },
];

const FAQ_BY_ISSUE_ID = new Map(
  ISSUE_FAQS.map((definition) => [definition.issueId, definition]),
);

export function getIssueFaqByIssueId(issueId: string | undefined) {
  return issueId ? FAQ_BY_ISSUE_ID.get(issueId) : undefined;
}
