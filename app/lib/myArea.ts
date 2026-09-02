export const MY_AREA_STORAGE_KEY = 'gijiraku_my_area_v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadMyArea(storage: StorageLike, validAssemblyIds: readonly string[]): string {
  try {
    const stored = storage.getItem(MY_AREA_STORAGE_KEY);
    return stored && validAssemblyIds.includes(stored) ? stored : 'all';
  } catch {
    return 'all';
  }
}

export function saveMyArea(storage: StorageLike, assemblyId: string): boolean {
  try {
    if (assemblyId === 'all') {
      storage.removeItem(MY_AREA_STORAGE_KEY);
    } else {
      storage.setItem(MY_AREA_STORAGE_KEY, assemblyId);
    }
    return true;
  } catch {
    return false;
  }
}
