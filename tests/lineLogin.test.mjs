import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLineLoginUrl,
  decodeLineOAuthState,
  encodeLineOAuthState,
  getLineCallbackUrl,
} from '../app/lib/lineLogin.ts';

test('encodeLineOAuthState and decodeLineOAuthState round-trip', () => {
  const encoded = encodeLineOAuthState('anonymous-user-1');
  const decoded = decodeLineOAuthState(encoded);
  assert.equal(decoded?.uid, 'anonymous-user-1');
  assert.ok(decoded?.n);
});

test('buildLineLoginUrl returns null when channel id is missing', () => {
  const previous = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
  delete process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
  try {
    assert.equal(buildLineLoginUrl('anonymous-user-1'), null);
  } finally {
    if (previous) process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID = previous;
  }
});

test('buildLineLoginUrl includes callback redirect uri', () => {
  const previous = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
  process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID = '1234567890';
  try {
    const url = buildLineLoginUrl('anonymous-user-1');
    assert.ok(url);
    assert.match(url, /access\.line\.me/);
    assert.match(url, new RegExp(encodeURIComponent(getLineCallbackUrl())));
  } finally {
    if (previous) process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID = previous;
    else delete process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
  }
});
