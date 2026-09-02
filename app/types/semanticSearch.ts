export interface SemanticSearchResult {
  readonly issue_id: string;
  readonly statement_id: string;
  readonly assembly_id: string;
  readonly assembly_name: string;
  readonly title: string;
  readonly meeting_name: string;
  readonly meeting_date: string;
  readonly speaker_name: string;
  readonly speaker_role: string;
  readonly summary: string;
  readonly source_excerpt: string;
  readonly source_url: string;
  readonly relevance_score: number;
}

export interface SemanticSearchResponse {
  readonly status: 'success';
  readonly query: string;
  readonly assembly_id: string | null;
  readonly result_count: number;
  readonly results: readonly SemanticSearchResult[];
}
