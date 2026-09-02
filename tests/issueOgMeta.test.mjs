import test from 'node:test';
import assert from 'node:assert/strict';
import { getCitizenQuestionByIssueId } from '../app/data/citizenQuestions.ts';
import { getIssueStatus } from '../app/data/issueStatuses.ts';

test('citizen question issues expose OGP-friendly metadata fields', () => {
  const issueId = 'shinjuku-sick-child-care-2026-06-10';
  const citizen = getCitizenQuestionByIssueId(issueId);
  const status = getIssueStatus(issueId);
  assert.ok(citizen);
  assert.ok(status);
  assert.match(`${citizen.municipality}｜${citizen.theme}`, /新宿区/);
  assert.match(status.problemSummary, /病児保育/);
});
