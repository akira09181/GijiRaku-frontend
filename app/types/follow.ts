export interface FollowedTopic {
  readonly discussion_id: string;
  readonly assembly_id: string;
  readonly municipality_name: string;
  readonly theme_name: string;
  readonly followed_at: string;
}

export type FollowTopicInput = Omit<FollowedTopic, 'followed_at'>;

export interface TopicProgressUpdate {
  readonly date: string;
  readonly label: string;
  readonly detail: string;
  readonly kind: 'question' | 'answer' | 'no-change';
}

export interface FollowUpDetails {
  readonly discussion_id: string;
  readonly last_checked_at: string;
  readonly current_status: string;
  readonly source_url: string;
  readonly updates: readonly TopicProgressUpdate[];
  readonly next_check_at?: string;
}
