export interface TrendKeyword {
  readonly label: string;
  readonly issue_count: number;
  readonly assembly_count: number;
}

export interface TrendTheme {
  readonly label: string;
  readonly issue_count: number;
}

export interface AssemblyTrend {
  readonly assembly_id: string;
  readonly assembly_name: string;
  readonly issue_count: number;
  readonly speaker_count: number;
  readonly top_theme: string | null;
  readonly themes: readonly TrendTheme[];
}

export interface ProTrendData {
  readonly period: { readonly from: string; readonly to: string };
  readonly updated_at: string | null;
  readonly totals: {
    readonly assembly_count: number;
    readonly issue_count: number;
    readonly speaker_count: number;
  };
  readonly keywords: readonly TrendKeyword[];
  readonly themes: readonly TrendTheme[];
  readonly assemblies: readonly AssemblyTrend[];
}

export type TrendResult =
  | { readonly ok: true; readonly data: ProTrendData }
  | { readonly ok: false; readonly message: string };
