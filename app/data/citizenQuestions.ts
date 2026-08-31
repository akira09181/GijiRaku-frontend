export interface CitizenQuestionChoice {
  readonly id: string;
  readonly label: string;
}

export interface CitizenQuestionDefinition {
  readonly assemblyId: string;
  readonly issueId: string;
  readonly questionId: string;
  readonly municipality: string;
  readonly theme: string;
  readonly question: string;
  readonly answers: readonly CitizenQuestionChoice[];
  readonly reasons: readonly CitizenQuestionChoice[];
}

export const SHINJUKU_SICK_CHILD_CARE_ISSUE_ID = 'shinjuku-sick-child-care-2026-06-10';
export const SHINJUKU_SICK_CHILD_CARE_QUESTION_ID = 'shinjuku-sick-child-care-realtime-booking-v1';

export const CITIZEN_QUESTIONS: readonly CitizenQuestionDefinition[] = [
  {
    assemblyId: 'tokyo-metropolitan',
    issueId: 'tokyo-app-2026-06-16',
    questionId: 'tokyo-app-one-stop-services-v1',
    municipality: '東京都',
    theme: '東京アプリの機能強化',
    question: '東京アプリで、子育て・介護など自分に必要な支援情報と行政手続をワンストップで確認・利用できる機能を優先して整備してほしいですか？',
    answers: [
      { id: 'prioritize', label: '優先して整備してほしい' },
      { id: 'limited_rollout', label: '機能を限定して慎重に進めてほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'support_is_hard_to_find', label: '自分に必要な支援情報を探しにくい' },
      { id: 'simpler_login_and_procedures', label: 'ログインや行政手続を簡単にしてほしい' },
      { id: 'points_and_digital_id', label: '東京ポイントやデジタル都民証が便利そう' },
      { id: 'privacy_and_security', label: '個人情報やセキュリティが心配' },
      { id: 'never_used', label: '東京アプリを利用したことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'shinjuku-ward',
    issueId: SHINJUKU_SICK_CHILD_CARE_ISSUE_ID,
    questionId: SHINJUKU_SICK_CHILD_CARE_QUESTION_ID,
    municipality: '新宿区',
    theme: '病児保育の利用拒否と予約・空き状況の改善',
    question: '病児保育の空き状況をリアルタイムで確認・予約できる仕組みが必要だと思いますか？',
    answers: [
      { id: 'needed', label: '必要だと思う' },
      { id: 'current_is_enough', label: '現状の案内で十分' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'availability_unknown', label: '空き状況が分からず困る' },
      { id: 'same_day_booking_unknown', label: '当日予約できるか分からない' },
      { id: 'capacity_shortage', label: '施設や定員が足りない' },
      { id: 'criteria_unclear', label: '症状別の受入基準が分かりにくい' },
      { id: 'never_used', label: '利用したことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'machida-city',
    issueId: 'machida-regional-transport-2026-03-26',
    questionId: 'machida-regional-transport-model-v1',
    municipality: '町田市',
    theme: '交通不便地域の新しい地域交通モデル',
    question: '交通不便地域で、予約型乗合交通など地域の実情に合う新しい移動手段を導入してほしいですか？',
    answers: [
      { id: 'introduce', label: '導入してほしい' },
      { id: 'improve_existing', label: 'まず既存のバス・交通を改善してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'stops_are_far', label: '駅やバス停まで遠く移動しにくい' },
      { id: 'non_drivers_need_options', label: '高齢者や車を運転しない人の移動手段が必要' },
      { id: 'booking_and_schedule', label: '予約方法や運行時間が使いやすいか気になる' },
      { id: 'fare_and_sustainability', label: '運賃や継続的な運行費用が気になる' },
      { id: 'never_used', label: '予約型・乗合交通を利用したことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'shinagawa-ward',
    issueId: 'shinagawa-inclusive-education-2026-02-19',
    questionId: 'shinagawa-school-support-and-dx-v1',
    municipality: '品川区',
    theme: '深い学び・多様性の包摂と教員負担軽減',
    question: '教員の負担を減らしながら多様な子どもの学びを支えるため、支援人材の増員と教育DXを優先して進めてほしいですか？',
    answers: [
      { id: 'prioritize_both', label: '支援人材と教育DXを進めてほしい' },
      { id: 'prioritize_people', label: 'まず支援人材の充実を優先してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'teacher_workload', label: '教員の業務負担が大きい' },
      { id: 'individual_support', label: '一人ひとりに合う学習・特別支援が必要' },
      { id: 'information_sharing', label: '教育データや支援情報の共有を改善してほしい' },
      { id: 'dx_may_add_work', label: '教育DXがかえって負担を増やさないか心配' },
      { id: 'never_experienced', label: '区立学校に通学・勤務した経験がない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'shibuya-ward',
    issueId: 'shibuya-inflation-support-2026-01-16',
    questionId: 'shibuya-inflation-benefit-balance-v1',
    municipality: '渋谷区',
    theme: '物価高騰緊急支援給付金と子育て応援手当',
    question: '物価高騰支援は、全区民への一律給付と子育て世帯への上乗せ給付を組み合わせる方法が適切だと思いますか？',
    answers: [
      { id: 'balanced_support', label: 'この組み合わせが適切だと思う' },
      { id: 'more_targeted', label: '困窮度に応じた重点支援を優先してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'living_costs', label: '食費や光熱費の上昇が家計に響いている' },
      { id: 'childcare_costs', label: '子育て世帯の負担が特に大きい' },
      { id: 'simple_and_fast', label: '一律給付は分かりやすく早く届く' },
      { id: 'amount_or_target', label: '給付額や対象の決め方を見直してほしい' },
      { id: 'never_received', label: '同様の給付を受けたことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'arakawa-ward',
    issueId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    questionId: 'arakawa-budget-priorities-and-results-v1',
    municipality: '荒川区',
    theme: '令和8年度当初予算の重点施策',
    question: '令和8年度予算は、防災・子育て・福祉・地域活性化の事業ごとに目標と成果を公開し、区民の声で優先順位を見直せるようにしてほしいですか？',
    answers: [
      { id: 'publish_and_review', label: '目標と成果を公開して見直してほしい' },
      { id: 'current_explanation_enough', label: '現在の予算説明で十分だと思う' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'priorities_unclear', label: '何を優先した予算か分かりにくい' },
      { id: 'outcomes_needed', label: '事業の成果や費用対効果を確認したい' },
      { id: 'resident_feedback', label: '区民の声を次年度予算に反映してほしい' },
      { id: 'administrative_cost', label: '公開や検証にかかる行政コストが気になる' },
      { id: 'never_checked', label: '区の予算資料を見たことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
  {
    assemblyId: 'hachioji-city',
    issueId: 'hachioji-rag-ai-2026-06-11',
    questionId: 'hachioji-rag-ai-safeguarded-rollout-v1',
    municipality: '八王子市',
    theme: '検索拡張生成AIの行政利用',
    question: '庁内文書を参照する検索拡張生成AIを、回答根拠の表示と職員の確認を条件に行政業務へ広げてほしいですか？',
    answers: [
      { id: 'expand_with_safeguards', label: '安全対策を条件に広げてほしい' },
      { id: 'limited_pilot', label: '対象業務を限った試行にとどめてほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'faster_search', label: '職員の情報検索や文書作成を速くしてほしい' },
      { id: 'service_quality', label: '問い合わせ対応の質を高めてほしい' },
      { id: 'source_traceability', label: '回答の根拠となる庁内文書を確認できることが重要' },
      { id: 'accuracy_and_data', label: '誤回答や機密情報の扱いが心配' },
      { id: 'never_used', label: '生成AIを利用したことがない' },
      { id: 'other', label: 'その他' },
    ],
  },
] as const;

export const SHINJUKU_SICK_CHILD_CARE_QUESTION = CITIZEN_QUESTIONS.find(
  (definition) => definition.issueId === SHINJUKU_SICK_CHILD_CARE_ISSUE_ID,
)!;

const CITIZEN_QUESTION_BY_ISSUE_ID = new Map(
  CITIZEN_QUESTIONS.map((definition) => [definition.issueId, definition]),
);

const CITIZEN_QUESTION_BY_ASSEMBLY_ID = new Map(
  CITIZEN_QUESTIONS.map((definition) => [definition.assemblyId, definition]),
);

export function getCitizenQuestionByIssueId(issueId: string | undefined) {
  return issueId ? CITIZEN_QUESTION_BY_ISSUE_ID.get(issueId) : undefined;
}

export function getCitizenQuestionByAssemblyId(assemblyId: string) {
  return CITIZEN_QUESTION_BY_ASSEMBLY_ID.get(assemblyId);
}

export const CITIZEN_RESPONSE_SUCCESS_MESSAGE =
  '回答を受け付けました。この結果は個人を特定しない形で集計され、議員・行政向け分析画面に反映されます。';
