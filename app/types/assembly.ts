/**
 * 自治体・議会関連の型定義
 */
export type IssueTheme = 'all' | 'child' | 'dx' | 'redevelop' | 'medical';

export interface AssemblyIssueStat {
  readonly theme: string;
  readonly label: string;
  readonly count: number;
}

export interface Assembly {
  readonly id: string;
  readonly name: string;
  readonly type: 'prefecture' | 'ward' | 'city' | 'town' | 'village';
  readonly lat: number;
  readonly lng: number;
  readonly membersCount: number;
  readonly mayorName: string;
  readonly openDataStatus: 'ready' | 'beta' | 'planned';
  readonly totalMinutesCount: number;
  readonly hotTopic: string;
  readonly mainIssues: readonly AssemblyIssueStat[];
}
