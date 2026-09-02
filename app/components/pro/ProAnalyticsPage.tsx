'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AnalyticsDashboardModal from '../AnalyticsDashboardModal';
import type { Assembly } from '../../types/assembly';

const ASSEMBLY_NAMES: Readonly<Record<string, string>> = {
  'tokyo-metropolitan': '東京都議会',
  'shinjuku-ward': '新宿区議会',
  'machida-city': '町田市議会',
  'shinagawa-ward': '品川区議会',
  'shibuya-ward': '渋谷区議会',
  'arakawa-ward': '荒川区議会',
  'hachioji-city': '八王子市議会',
};

function analyticsAssembly(assemblyId: string): Assembly {
  return {
    id: assemblyId,
    name: ASSEMBLY_NAMES[assemblyId] ?? assemblyId,
    type: assemblyId.endsWith('-ward') ? 'ward' : assemblyId.endsWith('-city') ? 'city' : 'prefecture',
    lat: 0,
    lng: 0,
    membersCount: 0,
    mayorName: '',
    openDataStatus: 'ready',
    totalMinutesCount: 0,
    featuredDiscussionId: '',
    hotTopic: '',
    mainIssues: [],
  };
}

export default function ProAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assemblyId = searchParams.get('assembly_id') || 'tokyo-metropolitan';
  const issueId = searchParams.get('issue_id') || undefined;

  return (
    <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-12 text-center sm:px-6 lg:px-8">
      <p className="text-sm text-slate-400">議会別分析を表示しています。</p>
      <AnalyticsDashboardModal
        key={`${assemblyId}:${issueId ?? 'all'}`}
        assembly={analyticsAssembly(assemblyId)}
        issueId={issueId}
        onClose={() => router.push('/pro/dashboard')}
      />
    </main>
  );
}
