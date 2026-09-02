import type { ReactionType } from '../../types/reaction';

type ReactionVariant = 'utterance' | 'topic' | 'compact';

interface ReactionLabelConfig {
  readonly label: string;
  readonly activeClass: string;
  readonly idleClass: string;
}

const REACTION_LABELS: Record<ReactionVariant, Record<ReactionType, ReactionLabelConfig>> = {
  utterance: {
    agree: {
      label: '👍 賛成',
      activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-sm',
      idleClass: 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300',
    },
    concern: {
      label: '⚠️ 気になる',
      activeClass: 'bg-amber-600 text-white border-amber-500 shadow-sm',
      idleClass: 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300',
    },
    helpful: {
      label: '💡 参考',
      activeClass: 'bg-sky-600 text-white border-sky-500 shadow-sm',
      idleClass: 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300',
    },
  },
  topic: {
    agree: {
      label: '進めてほしい',
      activeClass: 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300',
    },
    concern: {
      label: 'もっと議論してほしい',
      activeClass: 'bg-rose-600/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300',
    },
    helpful: {
      label: '💡 参考',
      activeClass: 'bg-sky-600/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300',
    },
  },
  compact: {
    agree: {
      label: '👍 進めてほしい',
      activeClass: 'bg-emerald-600 text-white border-emerald-500',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200',
    },
    concern: {
      label: '⚠️ もっと議論',
      activeClass: 'bg-amber-600 text-white border-amber-500',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200',
    },
    helpful: {
      label: '💡 参考',
      activeClass: 'bg-sky-600 text-white border-sky-500',
      idleClass: 'dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-sky-50 text-slate-700 border-slate-200',
    },
  },
};

interface ReactionButtonProps {
  readonly type: ReactionType;
  readonly count: number;
  readonly pressed: boolean;
  readonly variant: ReactionVariant;
  readonly disabled?: boolean;
  readonly showCount?: boolean;
  readonly onClick: () => void;
}

export function ReactionButton({
  type,
  count,
  pressed,
  variant,
  disabled = false,
  showCount = true,
  onClick,
}: ReactionButtonProps) {
  const config = REACTION_LABELS[variant][type];
  const sizeClass = variant === 'topic'
    ? 'px-2.5 py-1 rounded-lg text-xs font-medium'
    : variant === 'compact'
      ? 'px-2 py-1 rounded-lg text-[10px] font-semibold'
      : 'px-2 py-0.8 rounded-lg text-[11px] font-semibold';

  return (
    <button
      type="button"
      data-testid={`reaction-${type}`}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`border flex items-center gap-1 transition-all disabled:cursor-wait disabled:opacity-60 ${sizeClass} ${
        pressed ? config.activeClass : config.idleClass
      }`}
    >
      <span>{config.label}</span>
      {showCount && (
        <span className="text-[10px] opacity-90 font-mono">({count})</span>
      )}
    </button>
  );
}
