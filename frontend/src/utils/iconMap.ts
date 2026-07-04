import { Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map, LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map };

export function resolveIcon(iconKey: string): LucideIcon {
  return ICONS[iconKey] || BookOpen;
}
