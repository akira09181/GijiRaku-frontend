import type { Assembly } from '../types/assembly';

export type HomeScope = 'tokyo' | 'diet';

export const HOME_SCOPE_STORAGE_KEY = 'gijiraku_home_scope_v1';
export const NATIONAL_DIET_ASSEMBLY_ID = 'national-diet';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadHomeScope(storage: StorageLike): HomeScope {
  try {
    return storage.getItem(HOME_SCOPE_STORAGE_KEY) === 'diet' ? 'diet' : 'tokyo';
  } catch {
    return 'tokyo';
  }
}

export function saveHomeScope(storage: StorageLike, scope: HomeScope): void {
  try {
    storage.setItem(HOME_SCOPE_STORAGE_KEY, scope);
  } catch {
    // ignore quota / privacy mode errors
  }
}

export function getMyAreaStorageKey(scope: HomeScope): string {
  return scope === 'diet' ? 'gijiraku_my_area_diet_v1' : 'gijiraku_my_area_tokyo_v1';
}

export function isNationalAssembly(assembly: Assembly): boolean {
  return assembly.type === 'national' || assembly.id === NATIONAL_DIET_ASSEMBLY_ID;
}

export function partitionReadyAssemblies(assemblies: readonly Assembly[]): {
  readonly national: readonly Assembly[];
  readonly tokyo: readonly Assembly[];
} {
  const national: Assembly[] = [];
  const tokyo: Assembly[] = [];
  for (const assembly of assemblies) {
    if (isNationalAssembly(assembly)) {
      national.push(assembly);
    } else {
      tokyo.push(assembly);
    }
  }
  return { national, tokyo };
}

export function validAssemblyIdsForScope(
  scope: HomeScope,
  tokyoAssemblies: readonly Assembly[],
  nationalAssemblies: readonly Assembly[],
  plannedAssemblyIds: readonly string[],
): readonly string[] {
  if (scope === 'diet') {
    return nationalAssemblies.map((assembly) => assembly.id);
  }
  return [...tokyoAssemblies.map((assembly) => assembly.id), ...plannedAssemblyIds];
}
