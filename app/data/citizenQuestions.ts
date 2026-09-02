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
  readonly statusCheckedAt: string;
  readonly answers: readonly CitizenQuestionChoice[];
  readonly reasons: readonly CitizenQuestionChoice[];
  readonly draft: {
    readonly templateId: string;
    readonly answerStatements: Readonly<Record<string, string>>;
    readonly reasonClauses: Readonly<Record<string, string>>;
  };
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
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'tokyo-app-opinion-v1',
      answerStatements: {
        prioritize: '東京アプリのワンストップ機能を優先して整備してほしいです。',
        limited_rollout: '東京アプリは対象機能を限定し、安全性を確かめながら進めてほしいです。',
        need_more_information: '東京アプリの機能強化は、効果や安全性の情報を示してから判断したいです。',
      },
      reasonClauses: {
        support_is_hard_to_find: '必要な支援情報を探しにくいこと',
        simpler_login_and_procedures: 'ログインや行政手続が複雑なこと',
        points_and_digital_id: 'ポイントやデジタル都民証の利便性に期待していること',
        privacy_and_security: '個人情報とセキュリティが心配なこと',
        never_used: '東京アプリの利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'shinjuku-ward',
    issueId: SHINJUKU_SICK_CHILD_CARE_ISSUE_ID,
    questionId: SHINJUKU_SICK_CHILD_CARE_QUESTION_ID,
    municipality: '新宿区',
    theme: '病児保育の利用拒否と予約・空き状況の改善',
    question: '病児保育の空き状況をリアルタイムで確認・予約できる仕組みが必要だと思いますか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'shinjuku-sick-child-care-opinion-v1',
      answerStatements: {
        needed: '病児保育の空き状況や当日予約の可否が分かる仕組みを整備してほしいです。',
        current_is_enough: '病児保育は現状の案内を基本に、必要な情報を分かりやすく伝えてほしいです。',
        need_more_information: '病児保育の予約改善は、利用実績や費用を示してから判断したいです。',
      },
      reasonClauses: {
        availability_unknown: '空き状況が分かりにくいこと',
        same_day_booking_unknown: '当日予約できるか分かりにくいこと',
        capacity_shortage: '施設や定員の不足が心配なこと',
        criteria_unclear: '症状別の受入基準が分かりにくいこと',
        never_used: '利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'machida-city',
    issueId: 'machida-regional-transport-2026-03-26',
    questionId: 'machida-regional-transport-model-v1',
    municipality: '町田市',
    theme: '交通不便地域の新しい地域交通モデル',
    question: '交通不便地域で、予約型乗合交通など地域の実情に合う新しい移動手段を導入してほしいですか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'machida-regional-transport-opinion-v1',
      answerStatements: {
        introduce: '交通不便地域に、地域の実情に合う新しい移動手段を導入してほしいです。',
        improve_existing: '新しい交通の導入前に、既存のバスや交通手段を改善してほしいです。',
        need_more_information: '新しい地域交通は、運行方法や費用を示してから判断したいです。',
      },
      reasonClauses: {
        stops_are_far: '駅やバス停まで移動しにくいこと',
        non_drivers_need_options: '車を運転しない人の移動手段が必要なこと',
        booking_and_schedule: '予約方法や運行時間の使いやすさが気になること',
        fare_and_sustainability: '運賃と継続的な運行費用が気になること',
        never_used: '予約型・乗合交通の利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'shinagawa-ward',
    issueId: 'shinagawa-inclusive-education-2026-02-19',
    questionId: 'shinagawa-school-support-and-dx-v1',
    municipality: '品川区',
    theme: '深い学び・多様性の包摂と教員負担軽減',
    question: '教員の負担を減らしながら多様な子どもの学びを支えるため、支援人材の増員と教育DXを優先して進めてほしいですか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'shinagawa-education-support-opinion-v1',
      answerStatements: {
        prioritize_both: '教員の負担軽減に向け、支援人材の増員と教育DXを進めてほしいです。',
        prioritize_people: '教員の負担軽減は、まず支援人材の充実を優先してほしいです。',
        need_more_information: '支援人材と教育DXの効果を示してから優先順位を判断したいです。',
      },
      reasonClauses: {
        teacher_workload: '教員の業務負担が大きいこと',
        individual_support: '一人ひとりに合う学習・特別支援が必要なこと',
        information_sharing: '教育データや支援情報の共有に改善が必要なこと',
        dx_may_add_work: '教育DXが負担を増やさないか心配なこと',
        never_experienced: '区立学校での通学・勤務経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'shibuya-ward',
    issueId: 'shibuya-inflation-support-2026-01-16',
    questionId: 'shibuya-inflation-benefit-balance-v1',
    municipality: '渋谷区',
    theme: '物価高騰緊急支援給付金と子育て応援手当',
    question: '物価高騰支援は、全区民への一律給付と子育て世帯への上乗せ給付を組み合わせる方法が適切だと思いますか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'shibuya-inflation-support-opinion-v1',
      answerStatements: {
        balanced_support: '物価高騰支援は、全区民への給付と子育て世帯への上乗せを組み合わせてほしいです。',
        more_targeted: '物価高騰支援は、困窮度に応じた重点支援を優先してほしいです。',
        need_more_information: '物価高騰支援は、対象と効果を示してから判断したいです。',
      },
      reasonClauses: {
        living_costs: '食費や光熱費の上昇が家計に響いていること',
        childcare_costs: '子育て世帯の負担が大きいこと',
        simple_and_fast: '一律給付は分かりやすく早く届くこと',
        amount_or_target: '給付額や対象の決め方に見直しが必要なこと',
        never_received: '同様の給付を受けた経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'arakawa-ward',
    issueId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    questionId: 'arakawa-budget-priorities-and-results-v1',
    municipality: '荒川区',
    theme: '令和8年度当初予算の重点施策',
    question: '令和8年度予算は、防災・子育て・福祉・地域活性化の事業ごとに目標と成果を公開し、区民の声で優先順位を見直せるようにしてほしいですか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'arakawa-budget-opinion-v1',
      answerStatements: {
        publish_and_review: '令和8年度予算は、事業ごとの目標と成果を公開し、優先順位を見直してほしいです。',
        current_explanation_enough: '令和8年度予算は、現在の予算説明を基本に進めてよいと思います。',
        need_more_information: '令和8年度予算は、事業別の成果や費用を示してから判断したいです。',
      },
      reasonClauses: {
        priorities_unclear: '予算の優先順位が分かりにくいこと',
        outcomes_needed: '事業の成果や費用対効果を確認したいこと',
        resident_feedback: '区民の声を次年度予算に反映してほしいこと',
        administrative_cost: '公開や検証にかかる行政コストが気になること',
        never_checked: '区の予算資料を見た経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'hachioji-city',
    issueId: 'hachioji-rag-ai-2026-06-11',
    questionId: 'hachioji-rag-ai-safeguarded-rollout-v1',
    municipality: '八王子市',
    theme: '検索拡張生成AIの行政利用',
    question: '庁内文書を参照する検索拡張生成AIを、回答根拠の表示と職員の確認を条件に行政業務へ広げてほしいですか？',
    statusCheckedAt: '2026/08/24',
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
    draft: {
      templateId: 'hachioji-rag-ai-opinion-v1',
      answerStatements: {
        expand_with_safeguards: '検索拡張生成AIは、安全対策を条件に行政業務へ広げてほしいです。',
        limited_pilot: '検索拡張生成AIは、対象業務を限定した試行にとどめてほしいです。',
        need_more_information: '検索拡張生成AIは、精度や安全対策を示してから判断したいです。',
      },
      reasonClauses: {
        faster_search: '職員の情報検索や文書作成を速くしてほしいこと',
        service_quality: '問い合わせ対応の質を高めてほしいこと',
        source_traceability: '回答根拠の庁内文書を確認できることが重要なこと',
        accuracy_and_data: '誤回答や機密情報の扱いが心配なこと',
        never_used: '生成AIの利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'nerima-ward',
    issueId: 'nerima-ward-auto-2024-03-15-5227-9-275',
    questionId: 'nerima-elderly-support-v1',
    municipality: '練馬区',
    theme: '高齢者対策の強化',
    question: '高齢者いきいき健康事業の対象拡大や地域包括支援センター増設など、高齢者対策を強化してほしいですか？',
    statusCheckedAt: '2026/09/02',
    answers: [
      { id: 'strengthen', label: '強化してほしい' },
      { id: 'current_is_enough', label: '現状の支援で十分' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'health_program', label: '健康事業の対象や内容が狭い' },
      { id: 'support_center', label: '相談・支援体制を充実してほしい' },
      { id: 'housing_cost', label: '家賃など生活費の負担が大きい' },
      { id: 'fiscal_priority', label: '財源や優先順位が気になる' },
      { id: 'not_applicable', label: '高齢者支援の利用経験がない' },
      { id: 'other', label: 'その他' },
    ],
    draft: {
      templateId: 'nerima-elderly-support-opinion-v1',
      answerStatements: {
        strengthen: '練馬区の高齢者対策を、健康事業や支援体制の面から強化してほしいです。',
        current_is_enough: '練馬区の高齢者支援は、現状の取組を基本に進めてよいと思います。',
        need_more_information: '高齢者対策は、費用や効果を示してから判断したいです。',
      },
      reasonClauses: {
        health_program: '健康事業の対象や内容が狭いこと',
        support_center: '相談・支援体制を充実してほしいこと',
        housing_cost: '家賃など生活費の負担が大きいこと',
        fiscal_priority: '財源や優先順位が気になること',
        not_applicable: '高齢者支援の利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'nakano-ward',
    issueId: 'nakano-ward-auto-2024-03-06-197-4-196',
    questionId: 'nakano-childcare-support-v1',
    municipality: '中野区',
    theme: '子育て支援',
    question: '待機児童対策や保育施設の整備など、中野区の子育て支援を優先して進めてほしいですか？',
    statusCheckedAt: '2026/09/02',
    answers: [
      { id: 'prioritize', label: '優先して進めてほしい' },
      { id: 'steady_progress', label: '慎重に段階的に進めてほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'waiting_lists', label: '保育園の空きや待機が心配' },
      { id: 'facility_access', label: '施設の場所や利用時間が合わない' },
      { id: 'cost_burden', label: '保育料や学童などの費用が負担' },
      { id: 'info_hard_to_find', label: '支援制度の情報が分かりにくい' },
      { id: 'no_childcare_need', label: '現在子育て支援を利用していない' },
      { id: 'other', label: 'その他' },
    ],
    draft: {
      templateId: 'nakano-childcare-opinion-v1',
      answerStatements: {
        prioritize: '中野区の子育て支援を優先して進めてほしいです。',
        steady_progress: '中野区の子育て支援は、慎重に段階的に進めてほしいです。',
        need_more_information: '子育て支援は、具体的内容を示してから判断したいです。',
      },
      reasonClauses: {
        waiting_lists: '保育園の空きや待機が心配なこと',
        facility_access: '施設の場所や利用時間が合わないこと',
        cost_burden: '保育料や学童などの費用が負担なこと',
        info_hard_to_find: '支援制度の情報が分かりにくいこと',
        no_childcare_need: '現在子育て支援を利用していないこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'kita-ward',
    issueId: 'kita-ward-auto-2024-06-07-653-2-8',
    questionId: 'kita-child-rights-ordinance-v1',
    municipality: '北区',
    theme: '子育て支援策',
    question: '子どもの権利と幸せを定める条例に基づき、北区の子育て支援と防災対策を一体的に進めてほしいですか？',
    statusCheckedAt: '2026/09/02',
    answers: [
      { id: 'advance_together', label: '一体的に進めてほしい' },
      { id: 'childcare_first', label: 'まず子育て支援を優先してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'child_ordinance', label: '子ども条例の実効性が重要' },
      { id: 'disaster_safety', label: '能登地震を踏まえた防災が必要' },
      { id: 'metro_collaboration', label: '東京都との連携事項が気になる' },
      { id: 'implementation_cost', label: '条例運用の費用や体制が心配' },
      { id: 'no_direct_experience', label: '区立学校・保育の利用経験がない' },
      { id: 'other', label: 'その他' },
    ],
    draft: {
      templateId: 'kita-childcare-opinion-v1',
      answerStatements: {
        advance_together: '北区は子育て支援と防災対策を一体的に進めてほしいです。',
        childcare_first: '北区はまず子育て支援を優先して進めてほしいです。',
        need_more_information: '子育て支援策は、具体策を示してから判断したいです。',
      },
      reasonClauses: {
        child_ordinance: '子ども条例の実効性が重要なこと',
        disaster_safety: '防災・安全なまちづくりが必要なこと',
        metro_collaboration: '東京都との連携事項が気になること',
        implementation_cost: '条例運用の費用や体制が心配なこと',
        no_direct_experience: '区立学校・保育の利用経験がなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'sumida-ward',
    issueId: 'sumida-ward-auto-2024-06-12-555-2-150',
    questionId: 'sumida-hr-strategy-v1',
    municipality: '墨田区',
    theme: '職員の人材育成',
    question: '墨田区版総合的人事戦略で、職員の確保・育成・定着を進め、質の高い行政サービスを維持してほしいですか？',
    statusCheckedAt: '2026/09/02',
    answers: [
      { id: 'support_strategy', label: '戦略を進めてほしい' },
      { id: 'efficiency_first', label: 'まず業務効率化を優先してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'service_quality', label: '行政サービスの質維持が重要' },
      { id: 'recruitment', label: '職員採用の確保が課題' },
      { id: 'retention', label: '若手・ベテランの定着が心配' },
      { id: 'resident_contact', label: '窓口対応の質が気になる' },
      { id: 'no_visibility', label: '区役所の人事施策を知らない' },
      { id: 'other', label: 'その他' },
    ],
    draft: {
      templateId: 'sumida-hr-opinion-v1',
      answerStatements: {
        support_strategy: '墨田区の総合的人事戦略で、職員の確保・育成を進めてほしいです。',
        efficiency_first: '墨田区はまず業務効率化を優先し、必要な人材を確保してほしいです。',
        need_more_information: '職員の人材育成は、戦略の具体策を示してから判断したいです。',
      },
      reasonClauses: {
        service_quality: '行政サービスの質維持が重要なこと',
        recruitment: '職員採用の確保が課題なこと',
        retention: '職員の定着が心配なこと',
        resident_contact: '窓口対応の質が気になること',
        no_visibility: '区役所の人事施策を知らないこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
  },
  {
    assemblyId: 'tachikawa-city',
    issueId: 'tachikawa-city-auto-2024-02-27-2629-4-62',
    questionId: 'tachikawa-education-support-plans-v1',
    municipality: '立川市',
    theme: '個別の教育支援計画と個別の指導計画',
    question: '特別な支援を必要とする児童生徒について、個別の教育支援計画・指導計画を保護者の意向も踏まえて作成・引き継ぎしてほしいですか？',
    statusCheckedAt: '2026/09/02',
    answers: [
      { id: 'ensure_plans', label: '作成と引き継ぎを徹底してほしい' },
      { id: 'school_discretion', label: '学校の判断を尊重してほしい' },
      { id: 'need_more_information', label: '判断材料が足りない' },
    ],
    reasons: [
      { id: 'support_continuity', label: '進学時の支援引き継ぎが重要' },
      { id: 'parent_voice', label: '保護者の意向を反映してほしい' },
      { id: 'plan_criteria', label: '作成基準や学校間格差が気になる' },
      { id: 'teacher_burden', label: '教員の負担増が心配' },
      { id: 'no_school_child', label: '市内の学校に通う子どもがいない' },
      { id: 'other', label: 'その他' },
    ],
    draft: {
      templateId: 'tachikawa-education-plan-opinion-v1',
      answerStatements: {
        ensure_plans: '個別の教育支援計画・指導計画の作成と引き継ぎを徹底してほしいです。',
        school_discretion: '個別の教育支援計画は、学校の判断を基本に進めてよいと思います。',
        need_more_information: '個別の教育支援計画は、作成状況や基準を示してから判断したいです。',
      },
      reasonClauses: {
        support_continuity: '進学時の支援引き継ぎが重要なこと',
        parent_voice: '保護者の意向を反映してほしいこと',
        plan_criteria: '作成基準や学校間格差が気になること',
        teacher_burden: '教員の負担増が心配なこと',
        no_school_child: '市内の学校に通う子どもがいなく判断しにくいこと',
        other: 'ほかにも考慮したい点があること',
      },
    },
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
