export type ReactionType = 'agree' | 'concern' | 'helpful';

export interface ReactionCounts {
  readonly agree: number;
  readonly concern: number;
  readonly helpful: number;
}

export interface ReactionStateResponse {
  readonly status: 'success';
  readonly statement_id: string;
  readonly previous_reaction_type: ReactionType | null;
  readonly reaction_type: ReactionType | null;
  readonly changed: boolean;
  readonly counts: ReactionCounts;
}

export interface PersistedReactionAggregate {
  readonly statement_id: string;
  readonly counts: ReactionCounts;
  readonly live_counts?: ReactionCounts;
}

export interface PersistedUserReactionState {
  readonly statement_id: string;
  readonly reaction_type: ReactionType;
}

export interface LegacyPersistedReactionState extends PersistedReactionAggregate {
  readonly reaction_type: ReactionType | null;
}

export interface ReactionSnapshotResponse {
  readonly aggregates?: readonly PersistedReactionAggregate[];
  readonly user_reactions?: readonly PersistedUserReactionState[];
  readonly data?: readonly LegacyPersistedReactionState[];
}

/** 議題全体へのリアクションでモーダルと一覧カードが共有する statement_id */
export const TOPIC_REACTION_STATEMENT_ID = 'msg-2';

export const EMPTY_REACTION_COUNTS: ReactionCounts = {
  agree: 0,
  concern: 0,
  helpful: 0,
};
