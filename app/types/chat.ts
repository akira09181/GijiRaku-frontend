/**
 * LINE風チャット・対話メッセージ関連の型定義
 */
export interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'assistant';
  readonly text: string;
  readonly timestamp: string;
  readonly originalMinutes?: {
    readonly date: string;
    readonly speaker: string;
    readonly title: string;
    readonly quoteText: string;
    readonly sourceUrl?: string;
  };
  readonly relatedStats?: {
    readonly label: string;
    readonly value: string;
    readonly change?: string;
  };
}

export interface QuickPrompt {
  readonly label: string;
  readonly query: string;
  readonly theme: string;
}
