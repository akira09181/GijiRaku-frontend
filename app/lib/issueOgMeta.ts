import { getCitizenQuestionByIssueId } from '../data/citizenQuestions';
import { getIssueStatus } from '../data/issueStatuses';

export interface IssueOgMeta {
  readonly issueId: string;
  readonly title: string;
  readonly description: string;
  readonly municipality: string;
  readonly theme: string;
  readonly statusLabel: string;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://giji-raku-frontend.vercel.app').replace(/\/$/, '');
}

export function buildIssuePageUrl(issueId: string) {
  return `${siteUrl()}/issues/${encodeURIComponent(issueId)}`;
}

export function buildIssueOgImageUrl(issueId: string) {
  return `${siteUrl()}/issues/${encodeURIComponent(issueId)}/opengraph-image`;
}

export function resolveIssueOgMeta(issueId: string): IssueOgMeta | null {
  const decodedId = decodeURIComponent(issueId);
  const citizen = getCitizenQuestionByIssueId(decodedId);
  const status = getIssueStatus(decodedId);

  if (citizen) {
    return {
      issueId: decodedId,
      title: `${citizen.municipality}｜${citizen.theme}`,
      description: status?.problemSummary || citizen.question,
      municipality: citizen.municipality,
      theme: citizen.theme,
      statusLabel: status?.currentStatus || '議会で審議中',
    };
  }

  return null;
}

export async function resolveIssueOgMetaWithCatalog(issueId: string): Promise<IssueOgMeta | null> {
  const local = resolveIssueOgMeta(issueId);
  if (local) return local;

  const decodedId = decodeURIComponent(issueId);
  const apiBase = process.env.API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || 'http://localhost:8000';

  try {
    const response = await fetch(`${apiBase}/api/issues`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const payload = await response.json() as {
      issues?: readonly {
        issue_id: string;
        assembly_name: string;
        title: string;
        summary: string;
        theme: { label: string };
        stage: string;
      }[];
    };
    const issue = payload.issues?.find((item) => item.issue_id === decodedId);
    if (!issue) return null;
    return {
      issueId: decodedId,
      title: `${issue.assembly_name}｜${issue.title}`,
      description: issue.summary,
      municipality: issue.assembly_name,
      theme: issue.theme.label,
      statusLabel: issue.stage,
    };
  } catch {
    return null;
  }
}
