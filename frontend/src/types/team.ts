import { Department } from '../api/team';
import { LocalizedString, emptyLocalizedString } from './locale';
import { DEFAULT_FOCUS } from '../utils/imageFocus';

export type { Department };

/** Loyihaga biriktirilgan a'zo — ommaviy API (til allaqachon tanlangan). */
export interface TeamProjectLink {
  project: {
    id: string;
    title: string;
    category: string;
    screenshotUrl: string;
    liveUrl?: string | null;
  };
  role?: string | null;
  order: number;
}

/** Ommaviy /team va /team/:slug javoblari — matn maydonlari bitta satr. */
export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  position: string;
  bio: string;
  department: Department;
  leadership: boolean;
  photoUrl?: string | null;
  /** Rasm kadrga kesilganda markazda qoladigan nuqta (foizda) */
  focusX?: number;
  focusY?: number;
  skills: string[];
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  telegramUrl?: string | null;
  websiteUrl?: string | null;
  joinedAt?: string | null;
  featured: boolean;
  mentor?: {
    id: string;
    specialty?: string;
    courses?: { id: string; title: string; slug: string }[];
  } | null;
  projects: TeamProjectLink[];
}

/** Admin paneli va shaxsiy kabinet — xom {uz,ru,kaa,en} obyektlari bilan. */
export interface TeamMemberAdmin extends Omit<TeamMember, 'position' | 'bio' | 'projects' | 'mentor'> {
  position: LocalizedString;
  bio: LocalizedString;
  published: boolean;
  order: number;
  userId?: string | null;
  mentorId?: string | null;
  projects: { projectId: string; role?: LocalizedString | null; order: number }[];
  user?: { id: string; name: string; email: string; role: string } | null;
  mentor?: { id: string; name: string } | null;
}

/**
 * A'zoning o'zi ham, admin ham tahrirlaydigan maydonlar — backend'dagi
 * team.validator.ts `selfFields` bilan bir xil ro'yxat.
 * TeamProfileFields komponenti aynan shu shaklni kutadi.
 */
export interface TeamProfileFormState {
  name: string;
  position: LocalizedString;
  bio: LocalizedString;
  photoUrl: string;
  focusX: number;
  focusY: number;
  skills: string[];
  email: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
  telegramUrl: string;
  websiteUrl: string;
}

export function emptyTeamProfileForm(): TeamProfileFormState {
  return {
    name: '',
    position: emptyLocalizedString(),
    bio: emptyLocalizedString(),
    photoUrl: '',
    focusX: DEFAULT_FOCUS,
    focusY: DEFAULT_FOCUS,
    skills: [],
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    telegramUrl: '',
    websiteUrl: '',
  };
}
