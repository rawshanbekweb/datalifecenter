import { Crown, Code2, Database, Palette, Megaphone, GraduationCap, Briefcase } from 'lucide-react';
import { DEPARTMENTS, Department } from '../../api/team';

export interface DepartmentMeta {
  /** i18n kaliti — `team.dept.<key>` */
  labelKey: string;
  icon: React.ComponentType<{ size?: number | string }>;
  color: string;
  bg: string;
  border: string;
}

// Bo'lim rangi butun sayt bo'ylab bir xil bo'lishi uchun bitta joyda:
// jamoa kartasi, filtr tugmalari, a'zo sahifasi va admin ro'yxati shundan oladi.
export const DEPARTMENT_META: Record<Department, DepartmentMeta> = {
  LEADERSHIP:  { labelKey: 'team.dept.LEADERSHIP',  icon: Crown,         color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  ENGINEERING: { labelKey: 'team.dept.ENGINEERING', icon: Code2,         color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  DATA:        { labelKey: 'team.dept.DATA',        icon: Database,      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  DESIGN:      { labelKey: 'team.dept.DESIGN',      icon: Palette,       color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
  MARKETING:   { labelKey: 'team.dept.MARKETING',   icon: Megaphone,     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  EDUCATION:   { labelKey: 'team.dept.EDUCATION',   icon: GraduationCap, color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  OPERATIONS:  { labelKey: 'team.dept.OPERATIONS',  icon: Briefcase,     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

// Noma'lum qiymat kelsa (eski keshdan yoki yangi enum qiymati) sayt buzilmasin
export function departmentMeta(dept: string | null | undefined): DepartmentMeta {
  return DEPARTMENT_META[dept as Department] ?? DEPARTMENT_META.OPERATIONS;
}

export { DEPARTMENTS };
export type { Department };

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
