import { getApiBase } from './apiBase';
import { fetchWithRetry } from './fetchWithRetry';
import type { AssemblyRecord, AssemblyRecordsResponse } from '../types/assemblyRecord';

export interface FetchAssemblyRecordsParams {
  readonly assemblyId: string;
  readonly discussionId?: string;
  readonly limit?: number;
}

export async function fetchAssemblyRecords(
  params: FetchAssemblyRecordsParams,
  signal?: AbortSignal,
): Promise<AssemblyRecordsResponse> {
  const apiBase = getApiBase();
  const query = new URLSearchParams({
    assembly_id: params.assemblyId,
    limit: String(params.limit ?? 100),
  });
  if (params.discussionId) {
    query.set('discussion_id', params.discussionId);
  }

  const response = await fetchWithRetry(
    `${apiBase}/api/assembly-records?${query.toString()}`,
    {
      cache: 'no-store',
      signal,
    },
    5,
  );
  if (!response.ok) {
    throw new Error(`Assembly record API failed: ${response.status}`);
  }
  return response.json() as Promise<AssemblyRecordsResponse>;
}

export function selectAssemblyRecord(
  payload: AssemblyRecordsResponse,
  discussionId: string,
): AssemblyRecord | undefined {
  return payload.records.find((record) => record.discussion_id === discussionId);
}
