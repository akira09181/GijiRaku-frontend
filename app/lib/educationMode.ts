export const EDUCATION_MODE_STORAGE_KEY = 'machivoice_education_mode_v1';
export const EDUCATION_MODE_EVENT = 'machivoice:education-mode-changed';

export function loadEducationMode(storage: Storage = window.localStorage): boolean {
  try {
    return storage.getItem(EDUCATION_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveEducationMode(enabled: boolean, storage: Storage = window.localStorage) {
  storage.setItem(EDUCATION_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  document.documentElement.setAttribute('data-education-mode', enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(EDUCATION_MODE_EVENT, { detail: { enabled } }));
}

export function applyEducationModeAttribute(enabled: boolean) {
  document.documentElement.setAttribute('data-education-mode', enabled ? 'true' : 'false');
}
