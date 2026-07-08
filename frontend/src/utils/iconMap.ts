import {
  Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map, LucideIcon,
  Users, Briefcase, Award, CheckCircle, GraduationCap, Zap, HeartHandshake, Trophy,
  Globe, Palette, Brain, Cpu, BarChart3,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  Monitor, Server, Shield, Smartphone, Database, Cloud, BookOpen, Map,
  Users, Briefcase, Award, CheckCircle, GraduationCap, Zap, HeartHandshake, Trophy,
  Globe, Palette, Brain, Cpu, BarChart3,
};

export const ICON_NAMES: string[] = Object.keys(ICONS);

export function resolveIcon(iconKey: string): LucideIcon {
  return ICONS[iconKey] || BookOpen;
}
