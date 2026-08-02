import { Department, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';
import { slugify } from '../utils/slugify';

// /team/<slug> ommaviy sahifasi kabinet yo'llari bilan bitta manzil fazosida
// yashaydi (router.tsx). Bu so'zlar slug sifatida olinsa, a'zoning sahifasi
// o'rniga kabinet ochilib qolardi — shuning uchun ular band hisoblanadi.
const RESERVED_SLUGS = new Set(['admin', 'me', 'new', 'edit', 'profile', 'directory', 'team']);

// Ommaviy ro'yxatda va a'zo sahifasida ko'rinadigan loyihalar
const projectSelect = {
  project: {
    select: { id: true, title: true, category: true, screenshotUrl: true, liveUrl: true, published: true },
  },
  role: true,
  order: true,
} satisfies Prisma.TeamMemberProjectSelect;

const publicInclude = {
  projects: {
    where: { project: { published: true } },
    orderBy: { order: 'asc' },
    select: projectSelect,
  },
  mentor: { select: { id: true, specialty: true } },
} satisfies Prisma.TeamMemberInclude;

export async function listTeam(locale: SupportedLocale) {
  const members = await prisma.teamMember.findMany({
    where: { published: true },
    orderBy: [{ leadership: 'desc' }, { featured: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    include: publicInclude,
  });
  return resolveLocaleDeep(members, locale);
}

export async function getTeamMemberBySlug(slug: string, locale: SupportedLocale) {
  const member = await prisma.teamMember.findFirst({
    where: { slug, published: true },
    include: {
      ...publicInclude,
      mentor: {
        select: {
          id: true,
          specialty: true,
          courses: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  if (!member) {
    throw ApiError.notFound('Jamoa a\'zosi topilmadi');
  }

  return resolveLocaleDeep(member, locale);
}

// Admin tahrirlash paneli uchun — xom {uz,ru,kaa,en} obyektini qaytaradi
export async function listTeamAdmin() {
  return prisma.teamMember.findMany({
    orderBy: [{ leadership: 'desc' }, { featured: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    include: {
      projects: { orderBy: { order: 'asc' }, select: { projectId: true, role: true, order: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
      mentor: { select: { id: true, name: true } },
    },
  });
}

// Tranzaksiya ichidan ham chaqiriladi (users.service.ts — rol TEAM'ga
// o'zgarganda profil ochish), shuning uchun klient parametr sifatida olinadi.
type TeamClient = Pick<Prisma.TransactionClient, 'teamMember'>;

export async function uniqueTeamSlug(
  client: TeamClient,
  name: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(name) || 'member';
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-1` : base;
  let suffix = 1;
  while (true) {
    const existing = await client.teamMember.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

const uniqueSlug = (name: string, excludeId?: string): Promise<string> =>
  uniqueTeamSlug(prisma, name, excludeId);

export interface TeamProjectLink {
  projectId: string;
  role?: LocalizedString | null;
  order?: number;
}

export interface TeamMemberInput {
  name: string;
  position: LocalizedString;
  bio: LocalizedString;
  department: Department;
  leadership: boolean;
  photoUrl?: string;
  // Rasm kadrga kesilganda markazda qoladigan nuqta (foizda)
  focusX?: number;
  focusY?: number;
  skills: string[];
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;
  joinedAt?: string | null;
  order: number;
  featured: boolean;
  published: boolean;
  userId?: string | null;
  mentorId?: string | null;
  projects?: TeamProjectLink[];
}

// userId/mentorId — @unique, ya'ni bitta akkaunt faqat bitta jamoa a'zosiga
// tegishli. Prisma xatosini kutmasdan tushunarli xabar qaytaramiz.
async function assertLinkable(
  field: 'userId' | 'mentorId',
  value: string,
  excludeId?: string
): Promise<void> {
  if (field === 'userId') {
    const user = await prisma.user.findUnique({ where: { id: value } });
    if (!user) throw ApiError.notFound("Bog'lanadigan foydalanuvchi topilmadi");
  } else {
    const mentor = await prisma.mentor.findUnique({ where: { id: value } });
    if (!mentor) throw ApiError.notFound("Bog'lanadigan mentor topilmadi");
  }

  const linked = await prisma.teamMember.findUnique({
    where: field === 'userId' ? { userId: value } : { mentorId: value },
  });
  if (linked && linked.id !== excludeId) {
    throw ApiError.conflict(
      field === 'userId'
        ? "Bu foydalanuvchi allaqachon boshqa jamoa a'zosiga bog'langan"
        : "Bu mentor allaqachon boshqa jamoa a'zosiga bog'langan",
      field === 'userId' ? 'USER_ALREADY_LINKED' : 'MENTOR_ALREADY_LINKED'
    );
  }
}

// Berilgan loyiha id'lari haqiqatan mavjudligini tekshiradi — noto'g'ri id
// bo'lsa create/update yarim bajarilib qolmasligi uchun oldindan.
async function assertProjectsExist(links: TeamProjectLink[]): Promise<void> {
  if (!links.length) return;
  const ids = [...new Set(links.map((l) => l.projectId))];
  const found = await prisma.project.count({ where: { id: { in: ids } } });
  if (found !== ids.length) {
    throw ApiError.badRequest('Tanlangan loyihalardan biri topilmadi', 'PROJECT_NOT_FOUND');
  }
}

function toProjectRows(links: TeamProjectLink[]): Prisma.TeamMemberProjectCreateManyTeamMemberInput[] {
  return links.map((l, i) => ({
    projectId: l.projectId,
    role: toJsonInput(l.role) ?? Prisma.JsonNull,
    order: l.order ?? i,
  }));
}

// `projects` va bog'lanish maydonlari alohida ishlanadi — qolgani to'g'ridan-to'g'ri ustunlar
function toColumnData(input: Partial<TeamMemberInput>) {
  const { projects: _projects, joinedAt, position, bio, ...rest } = input;
  return {
    ...rest,
    ...(position ? { position } : {}),
    ...(bio ? { bio } : {}),
    ...(joinedAt !== undefined ? { joinedAt: joinedAt ? new Date(joinedAt) : null } : {}),
  };
}

export async function createTeamMember(input: TeamMemberInput) {
  if (input.userId) await assertLinkable('userId', input.userId);
  if (input.mentorId) await assertLinkable('mentorId', input.mentorId);
  const links = input.projects ?? [];
  await assertProjectsExist(links);

  const slug = await uniqueSlug(input.name);
  return prisma.teamMember.create({
    data: {
      ...toColumnData(input),
      slug,
      ...(links.length ? { projects: { createMany: { data: toProjectRows(links) } } } : {}),
    } as Prisma.TeamMemberUncheckedCreateInput,
  });
}

export async function updateTeamMember(id: string, input: Partial<TeamMemberInput>) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    throw ApiError.notFound('Jamoa a\'zosi topilmadi');
  }
  if (input.userId) await assertLinkable('userId', input.userId, id);
  if (input.mentorId) await assertLinkable('mentorId', input.mentorId, id);
  if (input.projects) await assertProjectsExist(input.projects);

  // Ism o'zgarsa slug ham yangilanadi — eski havolalar buziladi, lekin manzil
  // ma'noli qoladi (blog maqolalari bilan bir xil yondashuv).
  const slug = input.name && input.name !== member.name ? await uniqueSlug(input.name, id) : undefined;

  return prisma.$transaction(async (tx) => {
    if (input.projects) {
      await tx.teamMemberProject.deleteMany({ where: { teamMemberId: id } });
      if (input.projects.length) {
        await tx.teamMemberProject.createMany({
          data: toProjectRows(input.projects).map((row) => ({ ...row, teamMemberId: id })),
        });
      }
    }
    return tx.teamMember.update({
      where: { id },
      data: { ...toColumnData(input), ...(slug ? { slug } : {}) } as Prisma.TeamMemberUncheckedUpdateInput,
    });
  });
}

export async function deleteTeamMember(id: string) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    throw ApiError.notFound('Jamoa a\'zosi topilmadi');
  }
  // TeamMemberProject onDelete: Cascade — bog'lanishlar o'zi tozalanadi
  await prisma.teamMember.delete({ where: { id } });
}

// A'zo o'z profilini ko'radi
export async function getTeamMemberMe(userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId },
    include: {
      projects: { orderBy: { order: 'asc' }, select: projectSelect },
      mentor: { select: { id: true, name: true } },
    },
  });
  if (!member) {
    throw ApiError.forbidden(
      "Akkauntingiz jamoa profiliga bog'lanmagan — administratorga murojaat qiling",
      'TEAM_PROFILE_NOT_LINKED'
    );
  }
  return member;
}

// A'zo o'z profilini tahrirlaydi. Ataylab cheklangan ro'yxat: department,
// leadership, order, featured, published, slug va bog'lanishlar faqat adminda —
// aks holda xodim o'zini "rahbariyat"ga ko'chirib qo'ya olardi.
export type TeamMemberSelfInput = Partial<
  Pick<
    TeamMemberInput,
    'name' | 'position' | 'bio' | 'photoUrl' | 'focusX' | 'focusY' | 'skills' | 'email' | 'phone' | 'linkedinUrl' | 'githubUrl' | 'telegramUrl' | 'websiteUrl'
  >
>;

export async function updateTeamMemberMe(userId: string, input: TeamMemberSelfInput) {
  const member = await getTeamMemberMe(userId);
  // Admin tahriri bilan bir xil qoida — ism o'zgarsa /team/<slug> ham yangilanadi
  const slug = input.name && input.name !== member.name ? await uniqueSlug(input.name, member.id) : undefined;
  return prisma.teamMember.update({
    where: { id: member.id },
    data: { ...toColumnData(input), ...(slug ? { slug } : {}) } as Prisma.TeamMemberUncheckedUpdateInput,
  });
}
