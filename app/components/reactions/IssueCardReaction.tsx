'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactionBar } from './ReactionBar';
import {
  fetchReactionSnapshot,
  findReactionAggregate,
  findUserReaction,
  putReactionState,
} from '../../lib/reactions/reactionApi';
import { applyOptimisticReaction } from '../../lib/reactions/reactionOptimistic';
import { unlockCitizenBadge } from '../../lib/citizenBadges';
import {
  EMPTY_REACTION_COUNTS,
  TOPIC_REACTION_STATEMENT_ID,
  type ReactionCounts,
  type ReactionType,
} from '../../types/reaction';

interface IssueCardReactionProps {
  readonly issueId: string;
}

export function IssueCardReaction({ issueId }: IssueCardReactionProps) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_REACTION_COUNTS);
  const [userVote, setUserVote] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const requestInFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchReactionSnapshot(issueId, true);
        if (cancelled || controller.signal.aborted) return;
        setCounts(findReactionAggregate(payload, TOPIC_REACTION_STATEMENT_ID) ?? EMPTY_REACTION_COUNTS);
        const vote = findUserReaction(payload, TOPIC_REACTION_STATEMENT_ID);
        setUserVote(vote === 'helpful' ? null : vote);
      } catch {
        if (!cancelled) {
          setCounts(EMPTY_REACTION_COUNTS);
          setUserVote(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [issueId]);

  const handleVote = useCallback(async (type: ReactionType) => {
    if (requestInFlight.current || type === 'helpful') return;
    requestInFlight.current = true;
    setVoting(true);

    const currentVote = userVote;
    const nextVote: ReactionType | null = currentVote === type ? null : type;
    const previousCounts = counts;
    const optimisticCounts = applyOptimisticReaction(previousCounts, currentVote, nextVote);

    setUserVote(nextVote);
    setCounts(optimisticCounts);

    try {
      const result = await putReactionState(
        issueId,
        TOPIC_REACTION_STATEMENT_ID,
        nextVote,
        previousCounts,
      );
      setUserVote(
        result.reaction_type === 'agree' || result.reaction_type === 'concern'
          ? result.reaction_type
          : null,
      );
      setCounts(result.counts);
      unlockCitizenBadge('first_reaction');
    } catch {
      setUserVote(currentVote);
      setCounts(previousCounts);
    } finally {
      requestInFlight.current = false;
      setVoting(false);
    }
  }, [counts, issueId, userVote]);

  if (loading) {
    return (
      <div
        aria-label="リアクションを読み込み中"
        data-testid="issue-card-reaction-loading"
        className="mt-2 flex gap-1.5"
      >
        <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div
      className="mt-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <ReactionBar
        counts={counts}
        userVote={userVote}
        variant="compact"
        disabled={voting}
        onVote={handleVote}
      />
    </div>
  );
}
