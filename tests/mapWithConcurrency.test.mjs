import assert from 'node:assert/strict';
import test from 'node:test';

const { mapWithConcurrency } = await import('../app/lib/mapWithConcurrency.ts');

test('mapWithConcurrency limits parallel execution', async () => {
  let active = 0;
  let maxActive = 0;
  const items = Array.from({ length: 8 }, (_, index) => index);

  await mapWithConcurrency(items, 3, async (item) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 20));
    active -= 1;
    return item * 2;
  });

  assert.equal(maxActive, 3);
});

test('mapWithConcurrency preserves result order', async () => {
  const result = await mapWithConcurrency(['a', 'b', 'c'], 2, async (item) => item.toUpperCase());
  assert.deepEqual(result, ['A', 'B', 'C']);
});
