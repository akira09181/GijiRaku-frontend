import test from 'node:test';
import assert from 'node:assert/strict';

import { CITIZEN_QUESTIONS } from '../app/data/citizenQuestions.ts';
import { buildOpinionDraft, MAX_DRAFT_LENGTH } from '../app/lib/opinionDraft.js';

test('全7議題で回答・理由から200文字以内の下書きを作る', () => {
  for (const definition of CITIZEN_QUESTIONS) {
    const draft = buildOpinionDraft(
      definition,
      definition.answers[0].id,
      [definition.reasons[0].id, definition.reasons[1].id],
    );
    assert.ok(draft.length > 0, definition.issueId);
    assert.ok(draft.length <= MAX_DRAFT_LENGTH, definition.issueId);
    assert.match(draft, new RegExp(definition.draft.reasonClauses[definition.reasons[0].id]));
    assert.match(draft, new RegExp(definition.draft.reasonClauses[definition.reasons[1].id]));
  }
});

test('選択していない利用経験を下書きへ追加しない', () => {
  const definition = CITIZEN_QUESTIONS.find(
    (question) => question.issueId === 'shinjuku-sick-child-care-2026-06-10',
  );
  assert.ok(definition);
  const draft = buildOpinionDraft(definition, 'needed', ['availability_unknown']);
  assert.match(draft, /空き状況が分かりにくい/);
  assert.doesNotMatch(draft, /利用経験/);
  assert.doesNotMatch(draft, /利用を断られ/);
});
