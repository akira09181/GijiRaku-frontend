export const SHINJUKU_SICK_CHILD_CARE_ISSUE_ID = 'shinjuku-sick-child-care-2026-06-10';
export const SHINJUKU_SICK_CHILD_CARE_QUESTION_ID = 'shinjuku-sick-child-care-realtime-booking-v1';

export const SHINJUKU_SICK_CHILD_CARE_QUESTION = {
  issueId: SHINJUKU_SICK_CHILD_CARE_ISSUE_ID,
  questionId: SHINJUKU_SICK_CHILD_CARE_QUESTION_ID,
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
} as const;

export const CITIZEN_RESPONSE_SUCCESS_MESSAGE =
  '回答を受け付けました。この結果は個人を特定しない形で集計され、議員・行政向け分析画面に反映されます。';
