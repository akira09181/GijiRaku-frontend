export interface IssueCatalogTheme {
  readonly id: string;
  readonly label: string;
}

export interface IssueCatalogItem {
  readonly issue_id: string;
  readonly assembly_id: string;
  readonly assembly_name: string;
  readonly meeting_name: string;
  readonly meeting_date: string;
  readonly title: string;
  readonly theme: IssueCatalogTheme;
  readonly summary: string;
  readonly people: readonly string[];
  readonly speaker_count: number;
  readonly stage: string;
  readonly stage_detail: string;
  readonly answer_count: number | null;
  readonly question_id: string | null;
  readonly source_url: string;
  readonly source_dataset: {
    readonly title: string;
    readonly catalog_url: string;
    readonly resource_url: string;
  };
}

export interface IssueCatalogResponse {
  readonly status: 'success';
  readonly updated_at: string;
  readonly issue_count: number;
  readonly total_catalog_issue_count: number;
  readonly counts_by_assembly: Readonly<Record<string, number>>;
  readonly themes: readonly IssueCatalogTheme[];
  readonly issues: readonly IssueCatalogItem[];
}
