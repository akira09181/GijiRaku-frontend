'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { IssueCatalogItem } from '../../types/issueCatalog';
import { getApiBase } from '../../lib/apiBase';

interface RelatedIssuesPanelProps {
  readonly issueId: string;
  readonly assemblyId?: string;
  readonly themeLabel?: string;
  readonly onOpenIssue: (issue: IssueCatalogItem) => void;
}

export default function RelatedIssuesPanel({
  issueId,
  assemblyId,
  themeLabel,
  onOpenIssue,
}: RelatedIssuesPanelProps) {
  const [related, setRelated] = useState<readonly IssueCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${getApiBase()}/api/issues`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Issue catalog API failed: ${response.status}`);
        const payload = await response.json() as { issues?: readonly IssueCatalogItem[] };
        const candidates = (payload.issues || [])
          .filter((issue) => issue.issue_id !== issueId)
          .sort((left, right) => {
            const leftTheme = themeLabel && left.theme.label === themeLabel ? 1 : 0;
            const rightTheme = themeLabel && right.theme.label === themeLabel ? 1 : 0;
            if (leftTheme !== rightTheme) return rightTheme - leftTheme;
            const leftAssembly = assemblyId && left.assembly_id !== assemblyId ? 1 : 0;
            const rightAssembly = assemblyId && right.assembly_id !== assemblyId ? 1 : 0;
            if (leftAssembly !== rightAssembly) return rightAssembly - leftAssembly;
            return right.meeting_date.localeCompare(left.meeting_date);
          })
          .slice(0, 3);
        if (!cancelled) setRelated(candidates);
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assemblyId, issueId, themeLabel]);

  if (loading || related.length === 0) return null;

  return (
    <section
      data-testid="related-issues-panel"
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        他地域の関連議題
      </h3>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        同じテーマや別地域の議題を比較して、議論の広がりを確かめられます。
      </p>
      <ul className="mt-3 space-y-2">
        {related.map((issue) => (
          <li key={issue.issue_id}>
            <button
              type="button"
              onClick={() => onOpenIssue(issue)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
            >
              <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">{issue.assembly_name}</span>
              <span className="mt-0.5 block text-sm font-bold text-slate-900 dark:text-white">{issue.title}</span>
              <span className="mt-1 block text-[11px] text-slate-500">{issue.theme.label}｜{issue.stage}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
