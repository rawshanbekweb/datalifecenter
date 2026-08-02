import { ConversationKind, Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { isUniqueViolation } from '../utils/prismaErrors';
import { Actor } from '../utils/mentorAccess';
import { excerpt, notifyMerged } from './notifications.service';

/**
 * Rollar aro yozishma: talaba ↔ mentor, har kim ↔ administratsiya.
 *
 * UCHTA ONGLI QAROR:
 *
 * 1. **Suhbat juftlik bo'yicha yagona** (`pairKey`). Ticket/mavzu tizimi
 *    emas — odam bir kishiga yozganda "qaysi mavzuda?" deb so'ralmaydi,
 *    shunchaki o'sha yozishma ochiladi. Kalit bazada noyob, shuning uchun
 *    ikkita parallel so'rov ham bitta suhbatga tushadi.
 *
 * 2. **Administratsiya — bitta kanal, ko'p admin.** Aniq adminga
 *    biriktirilsa, o'sha admin ta'tilda bo'lganda xabar javobsiz qolardi.
 *    Shu sabab ADMIN turidagi suhbatni HAR QANDAY admin ko'radi va javob
 *    bera oladi; javob bergani xabarda ismi bilan ko'rinadi.
 *
 * 3. **Kim kimga yoza olishi cheklangan.** Talaba faqat O'Z kursi mentoriga
 *    va administratsiyaga yoza oladi; mentor faqat o'z o'quvchilariga.
 *    Aks holda platforma notanish odamlarga xabar yuborish vositasiga
 *    aylanardi (spam).
 */

// Bitta so'rovda qaytariladigan xabarlar soni (eski xabarlar `before` kursori bilan)
const MESSAGES_PAGE_SIZE = 40;
// Suhbatlar ro'yxati chegarasi — real hayotda bundan ko'p faol yozishma bo'lmaydi
const CONVERSATIONS_LIMIT = 60;

const userCard = { id: true, name: true, avatarUrl: true, focusX: true, focusY: true, role: true } satisfies Prisma.UserSelect;

type UserCard = { id: string; name: string; avatarUrl: string | null; focusX: number; focusY: number; role: Role };

function directPairKey(a: string, b: string): string {
  return `direct:${[a, b].sort().join(':')}`;
}

function adminPairKey(userId: string): string {
  return `admin:${userId}`;
}

/** Rolga qarab kabinetdagi xabarlar sahifasi — bildirishnoma havolasi uchun. */
function messagesLinkFor(role: Role): string {
  if (role === 'ADMIN') return '/admin/chat';
  if (role === 'MENTOR') return '/mentor/messages';
  return '/student/messages';
}

// ---------- Ruxsat qoidalari ----------

/** Talaba shu mentorning kursiga yozilganmi (faol yoki tugatgan). */
async function studentSharesCourseWithMentor(studentId: string, mentorUserId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: studentId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      course: { mentor: { userId: mentorUserId } },
    },
    select: { id: true },
  });
  return !!enrollment;
}

/**
 * `actor` `recipient`ga yoza oladimi. Yozolmasa 403 otadi.
 *
 * Adminga yozish bu yerdan o'tmaydi — u alohida ADMIN kanali orqali
 * ketadi (`openAdminConversation`).
 */
async function assertCanWriteTo(actor: Actor, recipient: UserCard): Promise<void> {
  if (recipient.id === actor.userId) {
    throw ApiError.badRequest("O'zingizga xabar yoza olmaysiz", 'SELF_MESSAGE');
  }
  // Admin hammaga yoza oladi — u platformaning javobgar tomoni
  if (actor.role === 'ADMIN') return;

  if (actor.role === 'STUDENT') {
    if (recipient.role !== 'MENTOR' || !(await studentSharesCourseWithMentor(actor.userId, recipient.id))) {
      throw ApiError.forbidden('Faqat o‘zingiz yozilgan kurs mentoriga yoza olasiz', 'MESSAGE_NOT_ALLOWED');
    }
    return;
  }

  if (actor.role === 'MENTOR') {
    if (recipient.role !== 'STUDENT' || !(await studentSharesCourseWithMentor(recipient.id, actor.userId))) {
      throw ApiError.forbidden('Faqat o‘z kursingizdagi o‘quvchiga yoza olasiz', 'MESSAGE_NOT_ALLOWED');
    }
    return;
  }

  throw ApiError.forbidden('Xabar yuborishga ruxsat yo‘q', 'MESSAGE_NOT_ALLOWED');
}

/**
 * ADMIN turidagi suhbatlarda har bir adminning ishtirokchi yozuvi bo'lishini
 * ta'minlaydi.
 *
 * O'qilmagan xabarlar hisobi `lastReadAt` ustuniga tayanadi — yozuvsiz admin
 * uchun uni hisoblab bo'lmaydi. Yangi admin qo'shilganda esa uni barcha eski
 * suhbatlarga qo'lda yozib chiqish kerak bo'lardi; shu sabab yozuvlar
 * kerak bo'lgan payt — ro'yxat ochilganda — yaratiladi.
 */
async function ensureAdminParticipation(userId: string): Promise<void> {
  const adminConversations = await prisma.conversation.findMany({
    where: { kind: 'ADMIN', participants: { none: { userId } } },
    select: { id: true },
    take: 500,
  });
  if (!adminConversations.length) return;
  await prisma.conversationParticipant.createMany({
    data: adminConversations.map((c) => ({ conversationId: c.id, userId })),
    skipDuplicates: true,
  });
}

/** Suhbatni topadi va `actor` unga kira olishini tekshiradi. */
async function loadAccessibleConversation(conversationId: string, actor: Actor) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { include: { user: { select: userCard } } } },
  });
  if (!conversation) {
    throw ApiError.notFound('Suhbat topilmadi');
  }

  const isParticipant = conversation.participants.some((p) => p.userId === actor.userId);
  // Administratsiya kanalini har qanday admin ochadi — ishtirokchi yozuvi
  // hali bo'lmasa ham (u shu yerda yaratiladi)
  const isAdminChannel = conversation.kind === 'ADMIN' && actor.role === 'ADMIN';
  if (!isParticipant && !isAdminChannel) {
    throw ApiError.forbidden('Bu suhbat sizga tegishli emas', 'CONVERSATION_FORBIDDEN');
  }
  if (!isParticipant && isAdminChannel) {
    await prisma.conversationParticipant.createMany({
      data: [{ conversationId, userId: actor.userId }],
      skipDuplicates: true,
    });
  }

  return conversation;
}

// ---------- O'qilmaganlar ----------

interface UnreadRow {
  conversationId: string;
  count: number;
}

/**
 * Har bir suhbat uchun o'qilmagan xabarlar soni — bitta so'rovda.
 *
 * Har suhbat uchun alohida `count()` yuborilsa ro'yxatning har ochilishi
 * o'nlab so'rovga aylanardi; bu yerda shart har bir ishtirokchining O'Z
 * `lastReadAt` qiymatiga bog'liq, shuning uchun `groupBy` yetmaydi.
 */
async function unreadCountsByConversation(userId: string): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<UnreadRow[]>`
    SELECT m."conversationId" AS "conversationId", COUNT(*)::int AS "count"
    FROM "Message" m
    JOIN "ConversationParticipant" p
      ON p."conversationId" = m."conversationId" AND p."userId" = ${userId}
    WHERE m."senderId" <> ${userId}
      AND (p."lastReadAt" IS NULL OR m."createdAt" > p."lastReadAt")
    GROUP BY m."conversationId"
  `;
  return new Map(rows.map((r) => [r.conversationId, Number(r.count)]));
}

export async function getUnreadCount(actor: Actor): Promise<{ unreadCount: number }> {
  if (actor.role === 'ADMIN') await ensureAdminParticipation(actor.userId);
  const counts = await unreadCountsByConversation(actor.userId);
  let total = 0;
  for (const value of counts.values()) total += value;
  return { unreadCount: total };
}

// ---------- Suhbatlar ----------

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  /** DIRECT'da suhbatdosh; ADMIN kanalida — kanalni boshlagan foydalanuvchi */
  otherUser: UserCard | null;
  lastMessage: { body: string; createdAt: Date; senderId: string } | null;
  lastMessageAt: Date;
  unreadCount: number;
}

function summarize(
  conversation: {
    id: string;
    kind: ConversationKind;
    lastMessageAt: Date;
    participants: { userId: string; user: UserCard }[];
    messages: { body: string; createdAt: Date; senderId: string }[];
  },
  actor: Actor,
  unread: Map<string, number>,
): ConversationSummary {
  // ADMIN kanalida "suhbatdosh" — adminlar uchun murojaat qilgan odam,
  // murojaat qiluvchi uchun esa hech kim (u "Administratsiya"ni ko'radi)
  const otherUser =
    conversation.kind === 'ADMIN'
      ? conversation.participants.find((p) => p.user.role !== 'ADMIN')?.user ?? null
      : conversation.participants.find((p) => p.userId !== actor.userId)?.user ?? null;

  return {
    id: conversation.id,
    kind: conversation.kind,
    otherUser: conversation.kind === 'ADMIN' && actor.role !== 'ADMIN' ? null : otherUser,
    lastMessage: conversation.messages[0] ?? null,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: unread.get(conversation.id) ?? 0,
  };
}

export async function listConversations(actor: Actor): Promise<ConversationSummary[]> {
  if (actor.role === 'ADMIN') await ensureAdminParticipation(actor.userId);

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: actor.userId } } },
    orderBy: { lastMessageAt: 'desc' },
    take: CONVERSATIONS_LIMIT,
    include: {
      participants: { include: { user: { select: userCard } } },
      // Ro'yxatda faqat oxirgi xabar ko'rinadi
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true } },
    },
  });

  const unread = await unreadCountsByConversation(actor.userId);
  return conversations.map((c) => summarize(c, actor, unread));
}

export interface ConversationThread extends ConversationSummary {
  messages: { id: string; senderId: string; body: string; createdAt: Date; sender: UserCard }[];
  /** Yana eski xabarlar bormi (`before` kursori bilan yuklanadi) */
  hasMore: boolean;
}

export async function getConversation(
  conversationId: string,
  actor: Actor,
  before?: Date,
): Promise<ConversationThread> {
  const conversation = await loadAccessibleConversation(conversationId, actor);

  const messages = await prisma.message.findMany({
    where: { conversationId, ...(before ? { createdAt: { lt: before } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: MESSAGES_PAGE_SIZE + 1,
    include: { sender: { select: userCard } },
  });
  const hasMore = messages.length > MESSAGES_PAGE_SIZE;
  if (hasMore) messages.pop();

  const unread = await unreadCountsByConversation(actor.userId);
  const summary = summarize(
    { ...conversation, messages: messages.slice(0, 1) },
    actor,
    unread,
  );

  return {
    ...summary,
    // Mijozga eskidan yangiga qarab beriladi — chat shu tartibda chiziladi
    messages: messages.reverse(),
    hasMore,
  };
}

/**
 * Suhbatni ochadi (bo'lmasa yaratadi). Bir xil juftlik uchun har doim
 * bitta yozuv qaytadi — `pairKey` noyob.
 */
async function openConversation(
  kind: ConversationKind,
  pairKey: string,
  participantIds: string[],
): Promise<{ id: string }> {
  const existing = await prisma.conversation.findUnique({ where: { pairKey }, select: { id: true } });
  if (existing) return existing;

  try {
    return await prisma.conversation.create({
      data: {
        kind,
        pairKey,
        participants: { create: participantIds.map((userId) => ({ userId })) },
      },
      select: { id: true },
    });
  } catch (err) {
    // Parallel ikkinchi so'rov bizdan oldin yaratib ulgurgan — o'shanisini olamiz
    if (isUniqueViolation(err)) {
      const found = await prisma.conversation.findUnique({ where: { pairKey }, select: { id: true } });
      if (found) return found;
    }
    throw err;
  }
}

async function adminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isBlocked: false },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

/** Foydalanuvchining administratsiya bilan kanalini ochadi. */
async function openAdminConversation(actor: Actor): Promise<{ id: string }> {
  if (actor.role === 'ADMIN') {
    throw ApiError.badRequest('Admin administratsiyaga yoza olmaydi', 'SELF_MESSAGE');
  }
  const admins = await adminUserIds();
  return openConversation('ADMIN', adminPairKey(actor.userId), [actor.userId, ...admins]);
}

export interface StartConversationInput {
  /** Aniq foydalanuvchiga yozish */
  recipientId?: string;
  /** Administratsiyaga yozish (recipientId o'rniga) */
  toAdmin?: boolean;
  body: string;
}

export async function startConversation(actor: Actor, input: StartConversationInput): Promise<ConversationThread> {
  let conversationId: string;

  if (input.toAdmin) {
    conversationId = (await openAdminConversation(actor)).id;
  } else {
    if (!input.recipientId) {
      throw ApiError.badRequest('Qabul qiluvchi ko‘rsatilmadi', 'RECIPIENT_REQUIRED');
    }
    const recipient = await prisma.user.findFirst({
      where: { id: input.recipientId, isBlocked: false },
      select: userCard,
    });
    if (!recipient) {
      throw ApiError.notFound('Foydalanuvchi topilmadi');
    }
    // Adminga yozish umumiy administratsiya kanaliga tushadi — aks holda
    // javob bergan admin ta'tilga chiqsa yozishma o'lik qolardi.
    // ISTISNO: adminning O'ZI hamkasbiga yozsa, bu oddiy shaxsiy yozishma
    // (aks holda u o'ziga tegishli kanalni ochishga urinib xato olardi).
    if (recipient.role === 'ADMIN' && actor.role !== 'ADMIN') {
      conversationId = (await openAdminConversation(actor)).id;
    } else {
      await assertCanWriteTo(actor, recipient);
      conversationId = (await openConversation('DIRECT', directPairKey(actor.userId, recipient.id), [
        actor.userId,
        recipient.id,
      ])).id;
    }
  }

  await sendMessage(conversationId, actor, input.body);
  return getConversation(conversationId, actor);
}

export async function sendMessage(conversationId: string, actor: Actor, body: string) {
  const conversation = await loadAccessibleConversation(conversationId, actor);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: actor.userId, body },
      include: { sender: { select: userCard } },
    }),
    prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    // Yuboruvchi uchun o'z xabari darhol "o'qilgan"
    prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: actor.userId },
      data: { lastReadAt: new Date() },
    }),
  ]);

  await notifyRecipients(conversation, actor, body, message.sender.name);
  return message;
}

/** Suhbatdagi qolgan ishtirokchilarga bildirishnoma (SSE orqali jonli yetadi). */
async function notifyRecipients(
  conversation: { id: string; kind: ConversationKind; participants: { userId: string; user: UserCard }[] },
  actor: Actor,
  body: string,
  senderName: string,
): Promise<void> {
  const byRole = new Map<Role, string[]>();
  const add = (role: Role, userId: string): void => {
    const list = byRole.get(role) ?? [];
    list.push(userId);
    byRole.set(role, list);
  };

  if (conversation.kind === 'ADMIN' && actor.role !== 'ADMIN') {
    // Murojaat butun administratsiyaga: ishtirokchi yozuvi hali yo'q yangi
    // adminlar ham xabardor bo'lishi kerak, shuning uchun ro'yxat bazadan
    for (const adminId of await adminUserIds()) add('ADMIN', adminId);
  } else {
    // Administratsiya kanalida admin javob berganda boshqa adminlarga
    // bildirishnoma yuborilmaydi — bu ular uchun shovqin, murojaat esa
    // ro'yxatda baribir ko'rinadi
    const recipients = conversation.participants.filter(
      (p) => p.userId !== actor.userId && !(conversation.kind === 'ADMIN' && p.user.role === 'ADMIN'),
    );
    for (const participant of recipients) add(participant.user.role, participant.userId);
  }

  // notifyMerged: bitta suhbat — bitta o'qilmagan bildirishnoma. Har xabar
  // uchun yangi yozuv qo'shilsa, faol yozishma qo'ng'iroqdagi qolgan
  // bildirishnomalarni ko'mib tashlardi.
  await Promise.all(
    [...byRole.entries()].map(([role, userIds]) =>
      notifyMerged(userIds, {
        type: 'NEW_MESSAGE',
        title: `Yangi xabar: ${senderName}`,
        body: excerpt(body),
        link: `${messagesLinkFor(role)}?c=${conversation.id}`,
      }),
    ),
  );
}

export async function markConversationRead(conversationId: string, actor: Actor): Promise<{ read: boolean }> {
  await loadAccessibleConversation(conversationId, actor);
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: actor.userId },
    data: { lastReadAt: new Date() },
  });
  return { read: true };
}

// ---------- Kimga yozish mumkin ----------

export interface ContactCard extends UserCard {
  /** Nima uchun ro'yxatda — kurs nomi (mavjud bo'lsa) */
  context?: string | null;
}

/**
 * Foydalanuvchi yoza oladigan odamlar ro'yxati.
 *
 * Bu ro'yxat `assertCanWriteTo` qoidalari bilan bir xil bo'lishi SHART —
 * aks holda UI'da ko'ringan odamga yozib bo'lmasdi.
 */
export async function listContacts(actor: Actor, search?: string): Promise<ContactCard[]> {
  if (actor.role === 'ADMIN') {
    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
        id: { not: actor.userId },
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
          : {}),
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      take: 50,
      select: userCard,
    });
    return users;
  }

  if (actor.role === 'MENTOR') {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        course: { mentor: { userId: actor.userId } },
        user: { isBlocked: false, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) },
      },
      select: { user: { select: userCard }, course: { select: { title: true } } },
      take: 200,
    });
    return dedupeContacts(enrollments.map((e) => ({ ...e.user, context: uzTitle(e.course.title) })));
  }

  // Talaba — o'zi yozilgan kurslarning mentorlari
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: actor.userId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      course: { mentor: { userId: { not: null } } },
    },
    select: {
      course: { select: { title: true, mentor: { select: { user: { select: userCard } } } } },
    },
    take: 100,
  });

  const contacts: ContactCard[] = [];
  for (const enrollment of enrollments) {
    const user = enrollment.course.mentor?.user;
    // Mentor profili bor, lekin unga user hisobi bog'lanmagan bo'lishi
    // mumkin (admin qo'lda kiritgan mentor) — bunday mentorga yozib bo'lmaydi
    if (user) contacts.push({ ...user, context: uzTitle(enrollment.course.title) });
  }

  return dedupeContacts(contacts);
}

/** Bir odam bir necha kursda uchraydi — ro'yxatda bir marta ko'rinishi kerak. */
function dedupeContacts(list: ContactCard[]): ContactCard[] {
  const byId = new Map<string, ContactCard>();
  for (const contact of list) {
    if (!byId.has(contact.id)) byId.set(contact.id, contact);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Kurs nomi ko'p tilli Json — kontakt ro'yxatida qisqa izoh sifatida
// o'zbekcha varianti yetarli (bu texnik ko'rsatma, kontent emas)
function uzTitle(value: unknown): string | null {
  if (value && typeof value === 'object' && 'uz' in value) {
    const uz = (value as { uz?: unknown }).uz;
    return typeof uz === 'string' ? uz : null;
  }
  return typeof value === 'string' ? value : null;
}

/**
 * Boshqa modullar uchun: foydalanuvchiga administratsiya nomidan xabar
 * yozadi (masalan admin kurs so'roviga javob berganda).
 */
export async function sendAdminMessageTo(userId: string, adminActor: Actor, body: string): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target || target.role === 'ADMIN') return;

  const admins = await adminUserIds();
  const conversation = await openConversation('ADMIN', adminPairKey(userId), [userId, ...admins]);
  await sendMessage(conversation.id, adminActor, body);
}
