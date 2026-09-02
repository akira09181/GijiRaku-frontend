import test from 'node:test';
import assert from 'node:assert/strict';

const { getApiBase, buildApiUrl } = await import('../app/lib/apiBase.ts');

test('uses explicit public API base when configured', () => {
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL;
  const previousApi = process.env.API_BASE_URL;
  delete process.env.API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://example-api.example.com';
  try {
    assert.equal(getApiBase(), 'https://example-api.example.com');
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous;
    if (previousApi === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previousApi;
  }
});

test('falls back to the production Render service when no env is set', () => {
  const previousPublic = process.env.NEXT_PUBLIC_API_BASE_URL;
  const previousApi = process.env.API_BASE_URL;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  delete process.env.API_BASE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(getApiBase(), 'https://gijiraku-backend.onrender.com');
    assert.equal(buildApiUrl('/api/issues'), 'https://gijiraku-backend.onrender.com/api/issues');
  } finally {
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousPublic;
    if (previousApi === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previousApi;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
