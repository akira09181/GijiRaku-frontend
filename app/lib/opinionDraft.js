// @ts-check

const MAX_DRAFT_LENGTH = 200;

/**
 * 選択済みの回答と理由だけを使い、質問定義の固定文節から意見下書きを作る。
 * @param {{
 *   draft: {
 *     answerStatements: Readonly<Record<string, string>>,
 *     reasonClauses: Readonly<Record<string, string>>,
 *   },
 *   reasons: readonly { id: string }[],
 * }} definition
 * @param {string} selectedAnswer
 * @param {readonly string[]} selectedReasons
 */
export function buildOpinionDraft(definition, selectedAnswer, selectedReasons) {
  const answerStatement = definition.draft.answerStatements[selectedAnswer] || '';
  if (!answerStatement) return '';

  const allowedReasonIds = new Set(definition.reasons.map((reason) => reason.id));
  const reasonClauses = Array.from(new Set(selectedReasons))
    .filter((reasonId) => allowedReasonIds.has(reasonId))
    .map((reasonId) => definition.draft.reasonClauses[reasonId])
    .filter(Boolean);
  if (reasonClauses.length === 0) return answerStatement.slice(0, MAX_DRAFT_LENGTH);

  const suffix = ` 背景には、${reasonClauses.join('、')}があります。`;
  const fullDraft = `${answerStatement}${suffix}`;
  if (fullDraft.length <= MAX_DRAFT_LENGTH) return fullDraft;

  const includedClauses = [];
  for (const clause of reasonClauses) {
    const candidate = `${answerStatement} 背景には、${[...includedClauses, clause].join('、')}があります。`;
    if (candidate.length > MAX_DRAFT_LENGTH) break;
    includedClauses.push(clause);
  }
  return includedClauses.length > 0
    ? `${answerStatement} 背景には、${includedClauses.join('、')}があります。`
    : answerStatement.slice(0, MAX_DRAFT_LENGTH);
}

export { MAX_DRAFT_LENGTH };
