import { Request, Response } from 'express';
import * as curriculumService from '../services/curriculum.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function actorOf(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { userId: req.user.userId, role: req.user.role };
}

export const createModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const module = await curriculumService.createModule(req.body, actorOf(req));
  sendSuccess(res, module, 201);
});

export const updateModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const module = await curriculumService.updateModule(req.params.id as string, req.body, actorOf(req));
  sendSuccess(res, module);
});

export const deleteModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  await curriculumService.deleteModule(req.params.id as string, actorOf(req));
  sendSuccess(res, { deleted: true });
});

export const createLessonHandler = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await curriculumService.createLesson(req.params.id as string, req.body, actorOf(req));
  sendSuccess(res, lesson, 201);
});

export const updateLessonHandler = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await curriculumService.updateLesson(req.params.id as string, req.body, actorOf(req));
  sendSuccess(res, lesson);
});

export const deleteLessonHandler = asyncHandler(async (req: Request, res: Response) => {
  await curriculumService.deleteLesson(req.params.id as string, actorOf(req));
  sendSuccess(res, { deleted: true });
});
