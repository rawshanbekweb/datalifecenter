import { apiFetch } from './client';

export function getSiteSettings(): Promise<Record<string, any>> {
  return apiFetch('/site-settings');
}

export function updateSiteSettingSection(section: string, data: unknown): Promise<any> {
  return apiFetch(`/site-settings/${section}`, { method: 'PATCH', body: JSON.stringify(data) });
}
