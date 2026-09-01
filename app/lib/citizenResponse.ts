export interface CitizenResponseItem {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly percentage?: number;
}

export interface CitizenResponseAggregate {
  readonly total_responses: number;
  readonly answers: readonly CitizenResponseItem[];
  readonly reasons: readonly CitizenResponseItem[];
  readonly top_reasons: readonly CitizenResponseItem[];
  readonly updated_at?: string | null;
}

export interface CitizenResponseSnapshot {
  readonly issue_id?: string;
  readonly question_id?: string;
  readonly storage_backend?: string;
  readonly my_response?: {
    readonly selected_answer: string;
    readonly selected_reasons: readonly string[];
    readonly free_text: string;
  } | null;
  readonly aggregate: CitizenResponseAggregate;
}

export const CITIZEN_RESPONSE_COUNT_EVENT = 'citizen_response_count_updated';

function nonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function normalizeItems(value: unknown): CitizenResponseItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== 'string' || typeof candidate.label !== 'string') return [];
    try {
      const count = nonNegativeNumber(candidate.count, 'aggregate item count');
      const percentage = typeof candidate.percentage === 'number' && Number.isFinite(candidate.percentage)
        ? Math.max(0, candidate.percentage)
        : undefined;
      return [{ id: candidate.id, label: candidate.label, count, percentage }];
    } catch {
      return [];
    }
  });
}

export function normalizeCitizenResponseSnapshot(
  payload: unknown,
  expectedIssueId: string,
  expectedQuestionId: string,
): CitizenResponseSnapshot {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid citizen response payload');
  const source = payload as Record<string, unknown>;
  const question = source.question && typeof source.question === 'object'
    ? source.question as Record<string, unknown>
    : undefined;
  const responseIssueId = source.issue_id ?? question?.issue_id;
  const responseQuestionId = source.question_id;
  if (typeof responseIssueId === 'string' && responseIssueId !== expectedIssueId) {
    throw new Error(`Citizen response issue_id mismatch: ${responseIssueId}`);
  }
  if (typeof responseQuestionId === 'string' && responseQuestionId !== expectedQuestionId) {
    throw new Error(`Citizen response question_id mismatch: ${responseQuestionId}`);
  }
  if (source.storage_backend != null && source.storage_backend !== 'firestore') {
    throw new Error('Unexpected citizen response storage backend');
  }
  if (!source.aggregate || typeof source.aggregate !== 'object') {
    throw new Error('Missing citizen response aggregate');
  }
  const aggregate = source.aggregate as Record<string, unknown>;
  const totalResponses = nonNegativeNumber(aggregate.total_responses, 'aggregate.total_responses');
  const myResponse = source.my_response && typeof source.my_response === 'object'
    ? source.my_response as Record<string, unknown>
    : null;
  return {
    issue_id: typeof responseIssueId === 'string' ? responseIssueId : undefined,
    question_id: typeof responseQuestionId === 'string' ? responseQuestionId : undefined,
    storage_backend: typeof source.storage_backend === 'string' ? source.storage_backend : undefined,
    my_response: myResponse && typeof myResponse.selected_answer === 'string'
      ? {
          selected_answer: myResponse.selected_answer,
          selected_reasons: Array.isArray(myResponse.selected_reasons)
            ? myResponse.selected_reasons.filter((item): item is string => typeof item === 'string')
            : [],
          free_text: typeof myResponse.free_text === 'string' ? myResponse.free_text : '',
        }
      : null,
    aggregate: {
      total_responses: totalResponses,
      answers: normalizeItems(aggregate.answers),
      reasons: normalizeItems(aggregate.reasons),
      top_reasons: normalizeItems(aggregate.top_reasons),
      updated_at: typeof aggregate.updated_at === 'string' ? aggregate.updated_at : null,
    },
  };
}

export function publishCitizenResponseCount(issueId: string, count: number) {
  window.dispatchEvent(new CustomEvent(CITIZEN_RESPONSE_COUNT_EVENT, {
    detail: { issueId, count },
  }));
  window.dispatchEvent(new Event('ebpm_count_updated'));
}
