/**
 * EBPM分析・議員スコア・世論関連の型定義
 */
export interface TopicTrend {
  readonly topic: string;
  readonly frequency: number;
  readonly sentimentRatio: {
    readonly positive: number;
    readonly neutral: number;
    readonly negative: number;
  };
  readonly hotKeywords: readonly string[];
}

export interface PartyPolicyStance {
  readonly partyName: string;
  readonly membersCount: number;
  readonly topCategory: string;
  readonly aiStanceSummary: string;
}

export interface MemberScorecard {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly party: string;
  readonly avatarType: 'male' | 'female' | 'neutral';
  readonly activityScore: number;
  readonly aiEval: string;
}

export interface AssemblyAnalytics {
  readonly assemblyId: string;
  readonly assemblyName: string;
  readonly totalSpeechesAnalyzed: number;
  readonly ebpmDataReadinessScore: number;
  readonly topicTrends: readonly TopicTrend[];
  readonly partyAnalytics: readonly PartyPolicyStance[];
  readonly memberScorecards: readonly MemberScorecard[];
  readonly publicSentimentScore: number;
}
