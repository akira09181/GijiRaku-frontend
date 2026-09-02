import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicCommentSubmissionText,
  getPublicCommentPortal,
} from '../app/data/publicCommentPortals.ts';

test('getPublicCommentPortal returns portal for ready assemblies', () => {
  const portal = getPublicCommentPortal('shinjuku-ward');
  assert.ok(portal);
  assert.match(portal.portalUrl, /^https:\/\//);
  assert.equal(portal.municipality, '新宿区');
});

test('buildPublicCommentSubmissionText wraps draft with municipality and theme', () => {
  const text = buildPublicCommentSubmissionText({
    municipality: '新宿区',
    issueTitle: '病児保育',
    draftText: 'リアルタイム予約が必要です。',
  });
  assert.match(text, /新宿区 パブリックコメント意見/);
  assert.match(text, /病児保育/);
  assert.match(text, /リアルタイム予約が必要です。/);
});
