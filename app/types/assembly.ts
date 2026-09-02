/**
 * 自治体・議会関連の型定義
 */
export type IssueTheme =
  | 'all'
  | 'children'
  | 'digital'
  | 'health'
  | 'housing'
  | 'transport'
  | 'economy'
  | 'safety'
  | 'community'
  | 'administration';

export interface AssemblyIssueStat {
  readonly theme: string;
  readonly label: string;
  readonly count: number;
}

export interface Assembly {
  readonly id: string;
  readonly name: string;
  readonly type: 'national' | 'prefecture' | 'ward' | 'city' | 'town' | 'village';
  readonly lat: number;
  readonly lng: number;
  readonly membersCount: number;
  readonly mayorName: string;
  readonly openDataStatus: 'ready' | 'beta' | 'planned';
  readonly totalMinutesCount: number;
  readonly featuredDiscussionId: string;
  readonly hotTopic: string;
  readonly mainIssues: readonly AssemblyIssueStat[];
  readonly sourceUrl?: string;
  readonly lastMeetingDate?: string;
  readonly lastUpdatedDate?: string;
}
