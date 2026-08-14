import { Request, Response } from 'express';
import * as courseRequestsService from '../services/courseRequests.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function actorOf(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { userId: req.user.userId, role: req.user.role };
}

// Formadagi to'ldirilmagan maydon bo'sh satr bo'lib keladi — bazada null bo'lsin
const orNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const createCourseRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const request = await courseRequestsService.createCourseRequest(
    {
      courseId: req.body.courseId,
      format: req.body.format,
      name: req.body.name,
      phone: req.body.phone,
      email: orNull(req.body.email),
      note: orNull(req.body.note),
    },
    // Marshrutda `authenticate` turadi — bu yerga faqat kirgan foydalanuvchi
    // yetib keladi, shuning uchun userId har doim bor
    req.user!.userId,
    req.locale,
  );
  sendSuccess(res, request, 201);
});

export const listMyCourseRequestsHandler = asyncHandler(async (req: Request, res: Response) => {
  const requests = await courseRequestsService.listMyCourseRequests(actorOf(req).userId, req.locale);
  sendSuccess(res, requests);
});

export const listCourseRequestsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as {
    status?: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'REJECTED';
    format?: 'ONLINE' | 'OFFLINE';
    search?: string;
    page: number;
    limit: number;
  };
  const result = await courseRequestsService.listCourseRequestsAdmin(filters, req.locale);
  sendSuccess(res, result);
});

export const updateCourseRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const request = await courseRequestsService.updateCourseRequestAdmin(
    req.params.id as string,
    { status: req.body.status, reply: req.body.reply },
    actorOf(req),
    req.locale,
  );
  sendSuccess(res, request);
});

export const enrollFromRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const request = await courseRequestsService.enrollFromRequest(req.params.id as string, req.locale);
  sendSuccess(res, request);
});

export const deleteCourseRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await courseRequestsService.deleteCourseRequest(req.params.id as string);
  sendSuccess(res, { deleted: true });
});

export const deleteCourseRequestsHandler = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await courseRequestsService.deleteCourseRequests(req.body.ids);
  sendSuccess(res, { deleted });
});
