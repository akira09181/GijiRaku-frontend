// @ts-check

/**
 * Build a public issue card. The function deliberately accepts no user response data.
 * @param {{issueId: string, municipality: string, theme: string, question: string}} issue
 * @param {{problemSummary: string, governmentResponseSummary: string, currentStatus: string, sourceUrl: string}} status
 * @param {string} origin
 */
export function buildIssueShare(issue, status, origin) {
  const issueUrl = `${origin.replace(/\/$/, '')}/issues/${encodeURIComponent(issue.issueId)}`;
  const text = [
    `${issue.municipality}｜${issue.theme}`,
    `何が問題？ ${status.problemSummary}`,
    `議会・行政の回答：${status.governmentResponseSummary}`,
    `現在確認できている状態：${status.currentStatus}`,
    `市民への質問：${issue.question}`,
    `公式原文：${status.sourceUrl}`,
    `マチボイス：${issueUrl}`,
  ].join('\n');
  return { title: `${issue.municipality}｜${issue.theme}`, text, url: issueUrl };
}

/** @param {{title: string, text: string, url: string}} card */
export async function shareIssueCard(card) {
  if (typeof navigator.share === 'function') {
    await navigator.share(card);
    return 'shared';
  }
  if (!navigator.clipboard?.writeText) throw new Error('Sharing is unavailable');
  await navigator.clipboard.writeText(card.text);
  return 'copied';
}
