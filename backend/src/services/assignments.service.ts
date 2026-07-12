import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { Actor, canManageCourse } from '../utils/mentorAccess';
import { audienceRecipientIds, filterEnrolledStudentIds } from '../utils/courseAudience';
import { excerpt, notify } from './notifications.service';

const assignmentInclude = {
  course: { select: { id: true, title: true, slug: true, color: true, bg: true, border: true, iconKey: true } },
  mentor: { select: { id: true, name: true, photoUrl: true } },
} satisfies Prisma.AssignmentInclude;

const submissionUserSelect = { select: { id: true, name: true, email: true, avatarUrl: true } };

interface CreateAssignmentInput {
  courseId: string;
  title: string;
  description: string;
  linkUrl?: string | null;
  dueAt?: Date | null;
  targetStudentIds?: string[];
}

type UpdateAssignmentInput = Partial<Omit<CreateAssignmentInput, 'courseId'>>;

interface SubmitInput {
  content: string;
  linkUrl?: string | null;
  fileUrl?: string | null;
}

interface ReviewInput {
  status: 'ACCEPTED' | 'RETURNED';
  grade?: number | null;
  feedback?: string | null;
}

// MENTOR roli uchun user hisobiga bog'langan mentor profilini topadi
async function getOwnMentor(userId: string) {
  const mentor = await prisma.mentor.findUnique({ where: { userId } });
  if (!mentor) {
    throw ApiError.forbidden(
      "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling.",
      'MENTOR_NOT_LINKED'
    );
  }
  return mentor;
}

export async function createAssignment(input: CreateAssignmentInput, actor: Actor) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  let mentorId: string;
  if (actor.role === 'ADMIN') {
    if (!course.mentorId) {
      throw ApiError.conflict('Bu kursga mentor biriktirilmagan', 'COURSE_HAS_NO_MENTOR');
    }
    mentorId = course.mentorId;
  } else {
    const mentor = await getOwnMentor(actor.userId);
    if (course.mentorId !== mentor.id) {
      throw ApiError.forbidden('Bu kurs sizga biriktirilmagan');
    }
    mentorId = mentor.id;
  }

  const targetStudentIds = await filterEnrolledStudentIds(input.courseId, input.targetStudentIds ?? []);

  const assignment = await prisma.assignment.create({
    data: { ...input, mentorId, targetStudentIds },
    include: { ...assignmentInclude, submissions: { include: { user: submissionUserSelect } } },
  });

  const recipientIds = await audienceRecipientIds(input.courseId, targetStudentIds);
  await notify(recipientIds, {
    type: 'NEW_ASSIGNMENT',
    title: `Yangi topshiriq: ${assignment.title}`,
    body: `${toUzText(course.title)}${assignment.dueAt ? ` — muddat: ${new Date(assignment.dueAt).toLocaleString('uz-UZ')}` : ''}`,
    link: '/student/assignments',
  });

  return assignment;
}

// Mentor: o'z topshiriqlari (javoblar bilan); Admin: hammasi
export async function listManagedAssignments(actor: Actor, locale: SupportedLocale) {
  const where: Prisma.AssignmentWhereInput =
    actor.role === 'ADMIN' ? {} : { mentorId: (await getOwnMentor(actor.userId)).id };

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      ...assignmentInclude,
      submissions: {
        orderBy: { submittedAt: 'desc' },
        include: { user: submissionUserSelect },
      },
    },
  });
  // Kurs sarlavhasi Json — mentor tiliga tekislanadi (topshiriq matni oddiy String)
  return resolveLocaleDeep(assignments, locale);
}

async function getOwnedAssignment(id: string, actor: Actor) {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    throw ApiError.notFound('Topshiriq topilmadi');
  }
  if (actor.role !== 'ADMIN') {
    const mentor = await getOwnMentor(actor.userId);
    if (assignment.mentorId !== mentor.id) {
      throw ApiError.forbidden('Bu topshiriq sizga tegishli emas');
    }
  }
  return assignment;
}

export async function updateAssignment(id: string, input: UpdateAssignmentInput, actor: Actor) {
  const assignment = await getOwnedAssignment(id, actor);
  const data: Prisma.AssignmentUpdateInput = { ...input };
  if (input.targetStudentIds !== undefined) {
    data.targetStudentIds = await filterEnrolledStudentIds(assignment.courseId, input.targetStudentIds);
  }
  return prisma.assignment.update({
    where: { id },
    data,
    include: { ...assignmentInclude, submissions: { orderBy: { submittedAt: 'desc' }, include: { user: submissionUserSelect } } },
  });
}

export async function deleteAssignment(id: string, actor: Actor) {
  await getOwnedAssignment(id, actor);
  await prisma.assignment.delete({ where: { id } });
}

// Talaba: o'ziga mo'ljallangan topshiriqlar + o'z javobi (bo'lsa)
export async function listMyAssignments(userId: string, locale: SupportedLocale) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courseIds },
      // Auditoriya tanlanmagan (bo'sh massiv) — hammaga; tanlangan bo'lsa faqat o'sha userId'larga
      OR: [{ targetStudentIds: { isEmpty: true } }, { targetStudentIds: { has: userId } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      ...assignmentInclude,
      submissions: { where: { userId }, include: { user: submissionUserSelect } },
    },
  });

  // Frontendga qulay shakl: submissions massivi o'rniga bitta mySubmission
  const shaped = assignments.map(({ submissions, targetStudentIds: _t, ...a }) => ({
    ...a,
    mySubmission: submissions[0] ?? null,
  }));
  return resolveLocaleDeep(shaped, locale);
}

export async function submitAssignment(assignmentId: string, actor: Actor, input: SubmitInput) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      courseId: true,
      targetStudentIds: true,
      course: { select: { title: true } },
      mentor: { select: { userId: true } },
    },
  });
  if (!assignment) {
    throw ApiError.notFound('Topshiriq topilmadi');
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: actor.userId, courseId: assignment.courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { id: true },
  });
  const inAudience =
    assignment.targetStudentIds.length === 0 || assignment.targetStudentIds.includes(actor.userId);
  if (!enrollment || !inAudience) {
    throw ApiError.forbidden('Bu topshiriq sizga mo‘ljallanmagan', 'ASSIGNMENT_FORBIDDEN');
  }

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId: actor.userId } },
  });
  if (existing?.status === 'ACCEPTED') {
    throw ApiError.conflict('Bu topshiriq allaqachon qabul qilingan', 'SUBMISSION_ALREADY_ACCEPTED');
  }

  // Qayta topshirilganda oldingi baho/izoh tozalanadi — mentor yangi javobni ko'radi
  const data = {
    content: input.content,
    linkUrl: input.linkUrl ?? null,
    fileUrl: input.fileUrl ?? null,
    status: 'SUBMITTED' as const,
    grade: null,
    feedback: null,
    reviewedAt: null,
    submittedAt: new Date(),
  };
  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId: actor.userId } },
    create: { assignmentId, userId: actor.userId, ...data },
    update: data,
    include: { user: submissionUserSelect },
  });

  const mentorUserId = assignment.mentor.userId;
  if (mentorUserId && mentorUserId !== actor.userId) {
    await notify(mentorUserId, {
      type: 'ASSIGNMENT_SUBMITTED',
      title: `${existing ? 'Topshiriq qayta yuborildi' : 'Topshiriq yuborildi'}: ${assignment.title}`,
      body: `${submission.user.name} — ${toUzText(assignment.course.title)}`,
      link: '/mentor/assignments',
    });
  }

  return submission;
}

export async function reviewSubmission(id: string, input: ReviewInput, actor: Actor) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      assignment: {
        select: { title: true, course: { select: { title: true, mentor: { select: { userId: true } } } } },
      },
    },
  });
  if (!submission) {
    throw ApiError.notFound('Javob topilmadi');
  }
  if (!canManageCourse(actor, submission.assignment.course.mentor?.userId)) {
    throw ApiError.forbidden('Bu javob sizning kursingizga tegishli emas');
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id },
    data: {
      status: input.status,
      grade: input.grade ?? null,
      feedback: input.feedback ?? null,
      reviewedAt: new Date(),
    },
    include: { user: submissionUserSelect },
  });

  if (submission.userId !== actor.userId) {
    const verdict = input.status === 'ACCEPTED' ? 'qabul qilindi' : 'qayta ishlashga qaytarildi';
    await notify(submission.userId, {
      type: 'ASSIGNMENT_REVIEWED',
      title: `Topshiriq ${verdict}: ${submission.assignment.title}`,
      body: input.feedback ? excerpt(input.feedback) : null,
      link: '/student/assignments',
    });
  }

  return updated;
}
