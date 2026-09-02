import { ReactionButton } from './ReactionButton';
import type { ReactionCounts, ReactionType } from '../../types/reaction';

type ReactionVariant = 'utterance' | 'topic' | 'compact';

interface ReactionBarProps {
  readonly counts: ReactionCounts;
  readonly userVote: ReactionType | null;
  readonly variant: ReactionVariant;
  readonly disabled?: boolean;
  readonly showCount?: boolean;
  readonly onVote: (type: ReactionType) => void;
}

const VARIANT_TYPES: Record<ReactionVariant, readonly ReactionType[]> = {
  utterance: ['agree', 'concern', 'helpful'],
  topic: ['agree', 'concern'],
  compact: ['agree', 'concern'],
};

export function ReactionBar({
  counts,
  userVote,
  variant,
  disabled = false,
  showCount = true,
  onVote,
}: ReactionBarProps) {
  const types = VARIANT_TYPES[variant];

  return (
    <div
      role="group"
      aria-label="この議題への反応"
      data-testid="reaction-bar"
      className="flex flex-wrap items-center gap-1.5"
    >
      {types.map((type) => (
        <ReactionButton
          key={type}
          type={type}
          count={counts[type]}
          pressed={userVote === type}
          variant={variant}
          disabled={disabled}
          showCount={showCount}
          onClick={() => onVote(type)}
        />
      ))}
    </div>
  );
}
