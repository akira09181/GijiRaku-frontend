import test from 'node:test';
import assert from 'node:assert/strict';

import { CITIZEN_QUESTIONS } from '../app/data/citizenQuestions.ts';
import { getIssueStatus } from '../app/data/issueStatuses.ts';
import { buildIssueShare } from '../app/lib/issueShare.js';

test('全7議題の共有カードに固有URL・議題情報・公式原文を含める', () => {
  for (const issue of CITIZEN_QUESTIONS) {
    const status = getIssueStatus(issue.issueId);
    assert.ok(status, issue.issueId);
    const card = buildIssueShare(issue, status, 'https://machivoice.example');
    assert.equal(card.url, `https://machivoice.example/issues/${issue.issueId}`);
    assert.match(card.text, new RegExp(issue.municipality));
    assert.match(card.text, new RegExp(issue.question));
    assert.match(card.text, new RegExp(status.sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('共有カードに匿名UUIDや個人の回答を含めない', () => {
  const issue = CITIZEN_QUESTIONS[1];
  const status = getIssueStatus(issue.issueId);
  assert.ok(status);
  const card = buildIssueShare(issue, status, 'https://machivoice.example');
  assert.doesNotMatch(card.text, /anonymous|anonymous_user_id|利用を断られた|あなたの回答/i);
});
