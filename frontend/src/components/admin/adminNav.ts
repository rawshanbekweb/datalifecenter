import {
  LayoutDashboard, GraduationCap, BookOpen, Users, UserSquare2, UsersRound,
  Newspaper, Handshake, Mail, Inbox, Settings, Star, MessageSquare, LayoutGrid,
  Megaphone, Wallet, MessagesSquare, ClipboardList, Camera, LineChart, Images,
  UserCog, CalendarDays, HandCoins,
} from 'lucide-react';

/**
 * Admin panelining bo'limlar xaritasi.
 *
 * Yon menyu ham, Ctrl+K tez o'tish oynasi ham SHU ro'yxatdan o'qiydi — aks
 * holda yangi bo'lim qo'shilganda uni ikki joyda qo'shish kerak bo'lardi va
 * biri esdan chiqib, bo'lim tez o'tishda ko'rinmay qolardi.
 */

export interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ComponentType<{ size?: number | string }>;
  end?: boolean;
  /** O'qilmagan xabarlar soni shu bo'limda ko'rsatiladi */
  badge?: boolean;
}

export interface NavGroup {
  labelKey: string;
  icon: React.ComponentType<{ size?: number | string }>;
  items: NavItem[];
}

/**
 * Yigirmata bo'lim tekis ro'yxatda ~986px joy egallardi — ya'ni menyu HAR
 * QANDAY ekranda (hatto 1080p da ham) aylanardi va sahifaning o'z aylanishi
 * bilan ikkita ichma-ich aylanish zonasi hosil bo'lardi.
 *
 * Endi bo'limlar mavzu bo'yicha guruhlangan va bir vaqtda FAQAT BITTA guruh
 * ochiq turadi (akkordeon). Shu tufayli menyu balandligi eng ko'p ~640px
 * bo'ladi va har qanday noutbukka sig'adi.
 *
 * Eng tez-tez kerak bo'ladigan uchta bo'lim guruhdan tashqarida — ular doim
 * bir bosishda ochiladi.
 */
export const TOP_ITEMS: NavItem[] = [
  { labelKey: 'admin.nav.dashboard', to: '/admin',           icon: LayoutDashboard, end: true },
  { labelKey: 'admin.nav.analytics', to: '/admin/analytics', icon: LineChart },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'admin.navGroups.learning', icon: GraduationCap,
    items: [
      { labelKey: 'admin.nav.enrollments',    to: '/admin/enrollments',     icon: GraduationCap },
      { labelKey: 'admin.nav.courseRequests', to: '/admin/course-requests', icon: ClipboardList },
      { labelKey: 'admin.nav.courseGroups',   to: '/admin/course-groups',   icon: CalendarDays },
      { labelKey: 'admin.nav.debtors',        to: '/admin/debtors',         icon: HandCoins },
      { labelKey: 'admin.nav.subscriptions',  to: '/admin/subscriptions',   icon: Wallet },
      { labelKey: 'admin.nav.courses',        to: '/admin/courses',         icon: BookOpen },
    ],
  },
  {
    labelKey: 'admin.navGroups.people', icon: Users,
    items: [
      { labelKey: 'admin.nav.users',          to: '/admin/users',           icon: Users },
      { labelKey: 'admin.nav.mentors',        to: '/admin/mentors',         icon: UserSquare2 },
      { labelKey: 'admin.nav.team',           to: '/admin/team',            icon: UsersRound },
      { labelKey: 'admin.nav.mentorRequests', to: '/admin/mentor-requests', icon: Inbox },
    ],
  },
  {
    labelKey: 'admin.navGroups.content', icon: Images,
    items: [
      { labelKey: 'admin.nav.blog',          to: '/admin/blog',           icon: Newspaper },
      { labelKey: 'admin.nav.projects',      to: '/admin/projects',       icon: LayoutGrid },
      { labelKey: 'admin.nav.moments',       to: '/admin/moments',        icon: Camera },
      { labelKey: 'admin.nav.partners',      to: '/admin/partners',       icon: Handshake },
      { labelKey: 'admin.nav.testimonials',  to: '/admin/testimonials',   icon: Star },
      { labelKey: 'admin.nav.courseReviews', to: '/admin/course-reviews', icon: MessageSquare },
    ],
  },
  {
    labelKey: 'admin.navGroups.communication', icon: MessagesSquare,
    items: [
      { labelKey: 'admin.nav.chat',          to: '/admin/chat',          icon: MessagesSquare, badge: true },
      { labelKey: 'admin.nav.messages',      to: '/admin/messages',      icon: Mail },
      { labelKey: 'admin.nav.announcements', to: '/admin/announcements', icon: Megaphone },
    ],
  },
];

export const BOTTOM_ITEMS: NavItem[] = [
  { labelKey: 'admin.nav.profile',      to: '/admin/profile',       icon: UserCog },
  { labelKey: 'admin.nav.siteSettings', to: '/admin/site-settings', icon: Settings },
];

/** Barcha bo'limlar bitta ro'yxatda — Ctrl+K qidiruvi shu bo'ylab yuradi. */
export const ALL_ITEMS: NavItem[] = [
  ...TOP_ITEMS,
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...BOTTOM_ITEMS,
];

/** Manzilga qaysi guruh mos kelishi — ochiladigan guruh shu bo'yicha aniqlanadi. */
export function groupOfPath(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    // `/admin/courses/:id/curriculum` kabi ichki yo'llar ham o'z guruhida qoladi.
    // `/admin/course-requests` va `/admin/courses` bir-biriga tushmaydi: 13-belgida
    // '-' va 's' farq qiladi.
    if (group.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))) {
      return group.labelKey;
    }
  }
  return null;
}
