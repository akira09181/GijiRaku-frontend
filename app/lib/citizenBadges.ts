export type CitizenBadgeId =
  | 'first_reaction'
  | 'first_answer'
  | 'first_follow'
  | 'region_advocate';

export interface CitizenBadgeDefinition {
  readonly id: CitizenBadgeId;
  readonly label: string;
  readonly description: string;
  readonly emoji: string;
}

export const CITIZEN_BADGES: readonly CitizenBadgeDefinition[] = [
  {
    id: 'first_reaction',
    label: 'はじめてのリアクション',
    description: '議題に最初のリアクションを送りました。',
    emoji: '👍',
  },
  {
    id: 'first_answer',
    label: '市民の声',
    description: '市民質問に最初の回答を届けました。',
    emoji: '🗳️',
  },
  {
    id: 'first_follow',
    label: '見守り市民',
    description: '議題を初めてフォローしました。',
    emoji: '🔖',
  },
  {
    id: 'region_advocate',
    label: '地域の先導者',
    description: '未対応地域の導入をリクエストしました。',
    emoji: '📍',
  },
];

export const BADGE_UNLOCK_EVENT = 'machivoice:badge-unlocked';
export const BADGE_STORAGE_KEY = 'machivoice_citizen_badges_v1';

const badgeMap = new Map(CITIZEN_BADGES.map((badge) => [badge.id, badge]));

export function getCitizenBadge(id: CitizenBadgeId) {
  return badgeMap.get(id);
}

export function loadUnlockedBadges(storage: Storage = window.localStorage): readonly CitizenBadgeId[] {
  try {
    const raw = storage.getItem(BADGE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CitizenBadgeId => (
      typeof item === 'string' && badgeMap.has(item as CitizenBadgeId)
    ));
  } catch {
    return [];
  }
}

export function unlockCitizenBadge(
  id: CitizenBadgeId,
  storage: Storage = window.localStorage,
): boolean {
  const current = new Set(loadUnlockedBadges(storage));
  if (current.has(id)) return false;
  current.add(id);
  storage.setItem(BADGE_STORAGE_KEY, JSON.stringify([...current]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BADGE_UNLOCK_EVENT, { detail: { id } }));
  }
  return true;
}
