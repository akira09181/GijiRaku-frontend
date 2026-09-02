export const MY_AREA_STORAGE_KEY = 'gijiraku_my_area_v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadMyArea(
  storage: StorageLike,
  validAssemblyIds: readonly string[],
  storageKey: string = MY_AREA_STORAGE_KEY,
): string {
  try {
    const stored = storage.getItem(storageKey);
    return stored && validAssemblyIds.includes(stored) ? stored : 'all';
  } catch {
    return 'all';
  }
}

export function saveMyArea(
  storage: StorageLike,
  assemblyId: string,
  storageKey: string = MY_AREA_STORAGE_KEY,
): boolean {
  try {
    if (assemblyId === 'all') {
      storage.removeItem(storageKey);
    } else {
      storage.setItem(storageKey, assemblyId);
    }
    return true;
  } catch {
    return false;
  }
}
