import { Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map } from 'lucide-react';

const ICONS = { Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map };

export function resolveIcon(iconKey) {
  return ICONS[iconKey] || BookOpen;
}
