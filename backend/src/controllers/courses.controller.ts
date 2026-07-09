import { Request, Response } from 'express';
import * as coursesService from '../services/courses.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listCoursesHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as unknown as {
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    isFree?: 'true' | 'false';
    search?: string;
    page: number;
    limit: number;
  };
  const result = await coursesService.listCourses(filters, req.locale);
  sendSuccess(res, result);
});

export const getCourseHandler = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.getCourseBySlug(req.params.slug as string, req.locale);
  sendSuccess(res, course);
});

export const getCourseLearnHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await coursesService.getCourseForLearning(
    req.params.slug as string,
    req.user.userId,
    req.user.role,
    req.locale
  );
  sendSuccess(res, result);
});

export const listCoursesAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await coursesService.listCoursesAdmin();
  sendSuccess(res, courses);
});

export const getCourseAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.getCourseByIdAdmin(req.params.id as string);
  sendSuccess(res, course);
});

export const createCourseHandler = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.createCourse(req.body);
  sendSuccess(res, course, 201);
});

export const updateCourseHandler = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.updateCourse(req.params.id as string, req.body);
  sendSuccess(res, course);
});

export const deleteCourseHandler = asyncHandler(async (req: Request, res: Response) => {
  await coursesService.deleteCourse(req.params.id as string);
  sendSuccess(res, { message: "Kurs o'chirildi" });
});
