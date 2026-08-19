// ebpmStore.ts - 市民リアクション数のリアルタイム連動ストア

const STORAGE_KEY = 'gijiraku_ebpm_reaction_count';
const DEFAULT_COUNT = 37;

export function getEbpmReactionCount(): number {
  if (typeof window === 'undefined') return DEFAULT_COUNT;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, DEFAULT_COUNT.toString());
    return DEFAULT_COUNT;
  }
  const val = parseInt(stored, 10);
  return isNaN(val) ? DEFAULT_COUNT : val;
}

export function incrementEbpmReactionCount(): number {
  if (typeof window === 'undefined') return DEFAULT_COUNT + 1;
  const current = getEbpmReactionCount();
  const next = current + 1;
  localStorage.setItem(STORAGE_KEY, next.toString());
  window.dispatchEvent(new CustomEvent('ebpm_count_updated', { detail: { count: next } }));
  return next;
}
