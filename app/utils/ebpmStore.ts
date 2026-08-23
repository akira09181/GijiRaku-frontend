// ebpmStore.ts - 市民リアクション数のリアルタイム連動ストア（発言単位）

const STORE_KEY = 'gijiraku_reaction_store_v2';

export interface ReactionCounts {
  agree: number;
  concern: number;
  helpful: number;
}

export function getReactionData(id: string, initialCounts: ReactionCounts): ReactionCounts {
  if (typeof window === 'undefined') return initialCounts;
  
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    
    if (store[id]) {
      return store[id];
    } else {
      store[id] = initialCounts;
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      return initialCounts;
    }
  } catch (e) {
    return initialCounts;
  }
}

export function updateReaction(id: string, type: 'agree' | 'concern' | 'helpful', increment: boolean): ReactionCounts {
  if (typeof window === 'undefined') return { agree: 0, concern: 0, helpful: 0 };
  
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    
    if (!store[id]) {
      store[id] = { agree: 0, concern: 0, helpful: 0 };
    }
    
    if (increment) {
      store[id][type] += 1;
    } else {
      store[id][type] = Math.max(0, store[id][type] - 1);
    }
    
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    
    // イベント発火
    window.dispatchEvent(new CustomEvent('ebpm_reaction_updated', { 
      detail: { id, type, counts: store[id], totalReactions: getTotalReactions() } 
    }));
    
    return store[id];
  } catch (e) {
    return { agree: 0, concern: 0, helpful: 0 };
  }
}

export function getTotalReactions(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    let total = 0;
    Object.values(store).forEach((c: any) => {
      total += (c.agree || 0) + (c.concern || 0) + (c.helpful || 0);
    });
    return total;
  } catch(e) {
    return 0;
  }
}
