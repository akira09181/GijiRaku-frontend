export interface AssemblyRecordStatement {
  readonly statement_id: string;
  readonly speaker_name: string;
  readonly speaker_role: string;
  readonly party_name?: string;
  readonly committee_name?: string;
  readonly stance_label: string;
  readonly vote_record?: string;
  readonly summary_quote: string;
  readonly full_summary?: string;
  readonly source_excerpt?: string;
  readonly question_type?: string;
  readonly avatar_color?: string;
}

export interface AssemblyRecord {
  readonly discussion_id: string;
  readonly topic: string;
  readonly meeting_date: string;
  readonly meeting_name: string;
  readonly source_url: string;
  readonly what_changes: string;
  readonly target_audience: string;
  readonly current_stage: string;
  readonly budget_info: string;
  readonly original_quote: string;
  readonly statements: readonly AssemblyRecordStatement[];
}

export interface AssemblyRecordsResponse {
  readonly status: 'success';
  readonly assembly_id: string;
  readonly assembly_name: string;
  readonly open_data_source?: {
    readonly title: string;
    readonly catalog_url: string;
    readonly resource_url: string;
    readonly format: string;
    readonly license_id: string;
    readonly license_url: string;
  };
  readonly records: readonly AssemblyRecord[];
}
