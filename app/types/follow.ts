export interface FollowedTopic {
  readonly issue_id: string;
  readonly discussion_id: string;
  readonly assembly_id: string;
  readonly municipality: string;
  readonly municipality_name: string;
  readonly title: string;
  readonly theme_name: string;
  readonly created_at: string;
  readonly followed_at: string;
  readonly last_viewed_status_at: string;
  readonly current_status: string;
  readonly status_summary: string;
  readonly status_updated_at: string;
  readonly status_checked_at: string;
  readonly problem_summary: string;
  readonly government_response_summary: string;
  readonly share_summary: string;
  readonly source_url: string;
  readonly question_id: string;
  readonly notification_enabled: boolean;
  readonly has_new_status: boolean;
  readonly status_updates: readonly FollowStatusUpdate[];
  readonly my_response: {
    readonly selected_answer: string;
    readonly selected_reasons: readonly string[];
    readonly free_text: string;
    readonly created_at: string | null;
    readonly updated_at: string | null;
  } | null;
}

export interface FollowStatusUpdate {
  readonly updated_at: string;
  readonly status: string;
  readonly summary: string;
  readonly source_url: string;
}

export interface FollowTopicInput {
  readonly discussion_id: string;
  readonly assembly_id: string;
  readonly municipality_name: string;
  readonly theme_name: string;
}

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
