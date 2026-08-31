'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import type { CitizenQuestionDefinition } from '../data/citizenQuestions';
import type { IssueStatusDefinition } from '../data/issueStatuses';
import { buildIssueShare, shareIssueCard } from '../lib/issueShare.js';

interface IssueShareButtonProps {
  readonly issue: CitizenQuestionDefinition;
  readonly status: IssueStatusDefinition;
  readonly className?: string;
}

export default function IssueShareButton({ issue, status, className = '' }: IssueShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const handleShare = async () => {
    setSharing(true);
    setFeedback(null);
    try {
      const card = buildIssueShare(issue, status, window.location.origin);
      const result = await shareIssueCard(card);
      setFeedback(result === 'copied' ? '共有文とURLをコピーしました。' : '共有画面を開きました。');
    } catch {
      setFeedback('議題カードを共有できませんでした。時間をおいて再試行してください。');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={handleShare} disabled={sharing} data-testid="share-issue-card" className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        {sharing ? '共有準備中…' : '議題カードを共有する'}
      </button>
      {feedback && <p role={feedback.includes('できません') ? 'alert' : 'status'} className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{feedback}</p>}
    </div>
  );
}
