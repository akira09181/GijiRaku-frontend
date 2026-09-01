export type PersonaGroup = 'training' | 'holdout';
export type ViewportKind = 'desktop' | 'mobile';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Persona {
  readonly id: string;
  readonly group: PersonaGroup;
  readonly residence: string;
  readonly supported_region: boolean;
  readonly interest: '子育て' | '交通' | '行政DX' | '医療・防災' | '教育' | '物価・給付';
  readonly civic_interest: '高' | '中' | '低';
  readonly it_skill: '高' | '中' | '低';
  readonly ai_trust: '高' | '中' | '低';
  readonly available_time: '30秒' | '3分' | '10分';
  readonly purpose: '自分に関係する問題を探す' | '議員の発言を確認する' | '原文を確認する' | '意思を示す' | 'その後を追跡する';
}

export interface ScenarioDefinition {
  readonly id: string;
  readonly title: string;
  readonly task: string;
}

export interface BrowserObservation {
  readonly scenario_id: string;
  readonly viewport: ViewportKind;
  readonly viewport_size: { readonly width: number; readonly height: number };
  readonly task_completed: boolean;
  readonly reached_screen: string;
  readonly visible_text: string;
  readonly accessible_names: readonly string[];
  readonly action_log: readonly string[];
  readonly click_count: number;
  readonly errors: readonly string[];
  readonly console_error_count: number;
  readonly network_error_count: number;
  readonly screenshot_paths: readonly string[];
  readonly visible_character_count: number;
  readonly interactive_element_count: number;
  readonly follow_succeeded?: boolean;
  readonly reaction_succeeded?: boolean;
  readonly state_restored?: boolean;
}

export interface EvaluationInput {
  readonly persona: Persona;
  readonly scenario: ScenarioDefinition;
  readonly observation: BrowserObservation;
}

export interface EvaluationScores {
  readonly value_understanding: number;
  readonly topic_discovery: number;
  readonly content_understanding: number;
  readonly source_trust: number;
  readonly reaction_clarity: number;
  readonly participation_intent: number;
  readonly follow_intent: number;
  readonly return_intent: number;
  readonly overall_trust: number;
}

export interface EvaluationIssue {
  readonly severity: Severity;
  readonly category: string;
  readonly location: string;
  readonly root_cause: string;
  readonly evidence: string;
  readonly suggested_direction: string;
}

export interface EvaluationResult {
  readonly persona_id: string;
  readonly scenario_id: string;
  readonly task_completed: boolean;
  readonly scores: EvaluationScores;
  readonly blocking_issue: boolean;
  readonly issues: readonly EvaluationIssue[];
  readonly would_return: boolean;
  readonly confidence: number;
  readonly missing?: boolean;
}

export interface EvaluationBatch {
  readonly provider: string;
  readonly model: string;
  readonly results: readonly EvaluationResult[];
  readonly missing_persona_ids: readonly string[];
  readonly calls: number;
  readonly estimated_cost_usd?: number;
}

export interface AggregateMetrics {
  readonly normalized_score: number;
  readonly score_by_metric: Readonly<Record<keyof EvaluationScores, number>>;
  readonly task_completion_rate: number;
  readonly blocking_issue_rate: number;
  readonly follow_success_rate: number;
  readonly reaction_success_rate: number;
  readonly state_restore_rate: number;
  readonly desktop_score: number;
  readonly mobile_score: number;
  readonly supported_region_score: number;
  readonly unsupported_region_score: number;
  readonly missing_rate: number;
  readonly average_actions: number;
  readonly console_errors: number;
  readonly network_errors: number;
  readonly complexity: ComplexityMetrics;
}

export interface ComplexityMetrics {
  readonly top_visible_characters: number;
  readonly detail_visible_characters: number;
  readonly top_interactive_elements: number;
  readonly detail_interactive_elements: number;
  readonly added_buttons: number;
  readonly added_explanation_characters: number;
  readonly new_modals: number;
  readonly new_navigation_items: number;
  readonly penalty: number;
}

export interface IssueCluster {
  readonly key: string;
  readonly location: string;
  readonly category: string;
  readonly root_cause: string;
  readonly max_severity: Severity;
  readonly affected_personas: readonly string[];
  readonly regions: readonly string[];
  readonly viewports: readonly ViewportKind[];
  readonly blocking_count: number;
  readonly retention_impact: number;
  readonly estimated_fix_cost: number;
  readonly priority: number;
  readonly evidence: readonly string[];
  readonly suggested_directions: readonly string[];
}

export interface ValidationResult {
  readonly passed: boolean;
  readonly commands: readonly {
    readonly name: string;
    readonly command: string;
    readonly passed: boolean;
    readonly exit_code: number;
    readonly duration_ms: number;
    readonly output_tail: string;
  }[];
}

export interface AdoptionDecision {
  readonly adopted: boolean;
  readonly reasons: readonly string[];
  readonly holdout_delta: number;
  readonly target_metric_delta: number;
  readonly complexity_penalty: number;
}

export interface RunState {
  readonly run_id: string;
  readonly seed: number;
  readonly iteration: number;
  readonly git_commit: string;
  readonly baseline_score: number;
  readonly training_score?: number;
  readonly holdout_score?: number;
  readonly adopted?: boolean;
  readonly selected_issue?: string;
  readonly validation?: ValidationResult;
  readonly llm_calls: number;
  readonly errors: readonly string[];
  readonly next_state: 'baseline' | 'evaluate' | 'improve' | 'complete' | 'blocked';
  readonly consecutive_rejections: number;
}
