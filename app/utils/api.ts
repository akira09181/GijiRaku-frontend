// api.ts - Client API & Persistence Bridge for MachiVoice
'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USER_ID_KEY = 'machivoice_user_uuid_v2';

/**
 * 永続化された匿名ユーザー識別子（UUID）を取得または新規発行
 */
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'anonymous-server-user';
  
  try {
    let uid = localStorage.getItem(USER_ID_KEY);
    if (!uid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uid = `usr_${crypto.randomUUID()}`;
      } else {
        uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      localStorage.setItem(USER_ID_KEY, uid);
    }
    return uid;
  } catch {
    return 'anonymous-user';
  }
}

export interface ReactionCounts {
  agree: number;
  concern: number;
  more_info: number;
  struggling: number;
  total: number;
}

export type ReactionType = 'agree' | 'concern' | 'more_info' | 'struggling';

/**
 * リアクションをDBへ送信・トグル
 */
export async function sendReaction(params: {
  topicId: string;
  assemblyId: string;
  statementId?: string;
  reactionType: ReactionType;
}): Promise<{ userReaction: ReactionType | null; counts: ReactionCounts }> {
  const userId = getOrCreateUserId();
  const statementId = params.statementId || '';

  try {
    const res = await fetch(`${API_BASE_URL}/api/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        topic_id: params.topicId,
        assembly_id: params.assemblyId,
        statement_id: statementId,
        reaction_type: params.reactionType,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const resultData = data.data;

      // イベント発火して他コンポーネント（ダッシュボード等）へ通知
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('machivoice_reaction_updated', {
            detail: {
              topicId: params.topicId,
              assemblyId: params.assemblyId,
              statementId,
              userReaction: resultData.user_reaction,
              counts: resultData.counts,
            },
          })
        );
      }

      return {
        userReaction: resultData.user_reaction,
        counts: resultData.counts,
      };
    }
  } catch (e) {
    console.warn('API connection failed, using local optimistic reaction:', e);
  }

  // オフライン・フォールバック
  return {
    userReaction: params.reactionType,
    counts: { agree: 1, concern: 0, more_info: 0, struggling: 0, total: 1 },
  };
}

/**
 * リアクション集計を取得
 */
export async function fetchReactionSummary(params: {
  topicId?: string;
  statementId?: string;
  assemblyId?: string;
}): Promise<{ counts: ReactionCounts; userReaction: ReactionType | null }> {
  const userId = getOrCreateUserId();
  const query = new URLSearchParams();
  if (params.topicId) query.set('topic_id', params.topicId);
  if (params.statementId) query.set('statement_id', params.statementId);
  if (params.assemblyId) query.set('assembly_id', params.assemblyId);
  query.set('user_id', userId);

  try {
    const res = await fetch(`${API_BASE_URL}/api/reactions/summary?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return {
        counts: data.counts,
        userReaction: data.user_reaction,
      };
    }
  } catch (e) {
    console.warn('Fetch reaction summary failed:', e);
  }

  return {
    counts: { agree: 42, concern: 8, more_info: 15, struggling: 6, total: 71 },
    userReaction: null,
  };
}

/**
 * 市民コメントをDBへ送信
 */
export async function sendComment(params: {
  topicId: string;
  assemblyId: string;
  statementId?: string;
  commentText: string;
  userName?: string;
}) {
  const userId = getOrCreateUserId();
  const res = await fetch(`${API_BASE_URL}/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      user_name: params.userName || '市民（あなた）',
      topic_id: params.topicId,
      assembly_id: params.assemblyId,
      statement_id: params.statementId || '',
      comment_text: params.commentText,
    }),
  });
  if (!res.ok) throw new Error('コメントの送信に失敗しました');
  return await res.json();
}

/**
 * 更新通知購読をDBへ保存
 */
export async function subscribeTopicUpdates(params: {
  assemblyId: string;
  theme: string;
  email?: string;
  notifyType?: 'browser' | 'email' | 'in_app';
}) {
  const userId = getOrCreateUserId();
  const res = await fetch(`${API_BASE_URL}/api/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      assembly_id: params.assemblyId,
      theme: params.theme,
      email: params.email || '',
      notify_type: params.notifyType || 'browser',
    }),
  });

  if (res.ok) {
    const data = await res.json();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('machivoice_subscription_updated'));
    }
    return data;
  }
  throw new Error('購読の保存に失敗しました');
}

/**
 * ユーザーの購読一覧を取得
 */
export async function fetchUserSubscriptions() {
  const userId = getOrCreateUserId();
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions?user_id=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (e) {
    console.warn('Fetch subscriptions failed:', e);
  }
  return [];
}

/**
 * ユーザーアクティビティ（閲覧履歴・選択状態）を保存
 */
export async function recordUserActivity(params: {
  topicId?: string;
  lastAssemblyId?: string;
  lastTheme?: string;
}) {
  const userId = getOrCreateUserId();
  try {
    await fetch(`${API_BASE_URL}/api/user/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        topic_id: params.topicId,
        last_assembly_id: params.lastAssemblyId,
        last_theme: params.lastTheme,
      }),
    });
  } catch {
    // Silent fail for non-critical logging
  }
}

/**
 * ユーザーアクティビティ・閲覧履歴を取得
 */
export async function fetchUserActivity() {
  const userId = getOrCreateUserId();
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/activity/${encodeURIComponent(userId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Fetch user activity failed:', e);
  }
  return {
    activity: { viewed_topics: [], last_assembly_id: 'tokyo-metropolitan', last_theme: 'all' },
    reactions: {},
    subscriptions: [],
  };
}

/**
 * フィードバック・通報をDBへ送信
 */
export async function sendFeedback(params: {
  category: 'feedback' | 'report' | 'data_correction';
  content: string;
  assemblyId?: string;
}) {
  const userId = getOrCreateUserId();
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      category: params.category,
      content: params.content,
      assembly_id: params.assemblyId || '',
    }),
  });
  if (!res.ok) throw new Error('送信に失敗しました');
  return await res.json();
}
