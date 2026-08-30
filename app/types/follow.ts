export interface FollowedTopic {
  readonly discussion_id: string;
  readonly assembly_id: string;
  readonly municipality_name: string;
  readonly theme_name: string;
  readonly followed_at: string;
}

export interface TopicProgressUpdate {
  readonly date: string;
  readonly label: string;
  readonly detail: string;
  readonly kind: 'question' | 'answer' | 'no-change';
}

export interface FollowableTopic {
  readonly discussionId: string;
  readonly assemblyId: string;
  readonly municipalityName: string;
  readonly themeName: string;
  readonly modalTheme: string;
  readonly lastCheckedAt: string;
  readonly currentStatus: string;
  readonly sourceUrl: string;
  readonly updates: readonly TopicProgressUpdate[];
}
