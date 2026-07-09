import { apiFetch } from './client';

export function getSiteSettings(): Promise<Record<string, any>> {
  return apiFetch('/site-settings');
}

// Admin tahrirlash paneli — xom (barcha til) ma'lumot qaytaradi
export function getSiteSettingsAdmin(): Promise<Record<string, any>> {
  return apiFetch('/site-settings/admin');
}

export function updateSiteSettingSection(section: string, data: unknown): Promise<any> {
  return apiFetch(`/site-settings/${section}`, { method: 'PATCH', body: JSON.stringify(data) });
}
