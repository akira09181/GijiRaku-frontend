import path from 'node:path';

export interface UxLoopConfig {
  readonly rootDir: string;
  readonly artifactsRoot: string;
  readonly baseUrl: string;
  readonly seed: number;
  readonly iterations: number;
  readonly mode: 'evaluate-only' | 'dry-run' | 'apply';
  readonly resumeRunId?: string;
  readonly evaluatorProvider: 'codex' | 'command' | 'deterministic-smoke';
  readonly evaluatorModel: string;
  readonly evaluatorCommand?: string;
  readonly codexBin: string;
  readonly codexModel?: string;
  readonly concurrency: number;
  readonly timeoutMs: number;
  readonly smoke: boolean;
}

function integer(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Expected integer between ${min} and ${max}`);
  }
  return parsed;
}

export function parseConfig(argv: readonly string[], rootDir = process.cwd()): UxLoopConfig {
  let mode: UxLoopConfig['mode'] = 'evaluate-only';
  let iterations = 1;
  let resumeRunId: string | undefined;
  let smoke = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--evaluate-only') mode = 'evaluate-only';
    else if (arg === '--dry-run') mode = 'dry-run';
    else if (arg === '--apply') mode = 'apply';
    else if (arg === '--smoke') smoke = true;
    else if (arg === '--iterations') iterations = integer(argv[++index], 1, 1, 10);
    else if (arg === '--resume') resumeRunId = argv[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (resumeRunId && !/^[a-zA-Z0-9_-]+$/.test(resumeRunId)) {
    throw new Error('Invalid run id');
  }

  const provider = smoke
    ? 'deterministic-smoke'
    : (process.env.AI_UX_EVALUATOR_PROVIDER || 'codex');
  if (!['codex', 'command', 'deterministic-smoke'].includes(provider)) {
    throw new Error('AI_UX_EVALUATOR_PROVIDER must be codex, command, or deterministic-smoke');
  }

  return {
    rootDir,
    artifactsRoot: path.join(rootDir, 'artifacts', 'ai-ux-loop'),
    baseUrl: process.env.AI_UX_BASE_URL || 'http://127.0.0.1:3100',
    seed: integer(process.env.AI_UX_SEED, 2030, 1, 2_147_483_647),
    iterations,
    mode,
    resumeRunId,
    evaluatorProvider: provider as UxLoopConfig['evaluatorProvider'],
    evaluatorModel: process.env.AI_UX_EVALUATOR_MODEL || 'configured-by-codex-cli',
    evaluatorCommand: process.env.AI_UX_EVALUATOR_COMMAND,
    codexBin: process.env.AI_UX_CODEX_BIN || 'codex',
    codexModel: process.env.AI_UX_CODEX_MODEL,
    concurrency: integer(process.env.AI_UX_CONCURRENCY, 4, 1, 5),
    timeoutMs: integer(process.env.AI_UX_TIMEOUT_MS, 120_000, 10_000, 600_000),
    smoke,
  };
}
