import { Request, Response } from 'express';
import * as groupsService from '../services/courseGroups.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listCourseGroupsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const groups = await groupsService.listCourseGroups(req.validatedQuery ?? {}, req.user, req.locale);
  sendSuccess(res, groups);
});

export const listMyCourseGroupsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const groups = await groupsService.listMyCourseGroups(req.user.userId, req.locale);
  sendSuccess(res, groups);
});

export const getCourseGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const group = await groupsService.getCourseGroup(req.params.id as string, req.user, req.locale);
  sendSuccess(res, group);
});

export const createCourseGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupsService.createCourseGroup(req.body, req.locale);
  sendSuccess(res, group, 201);
});

export const updateCourseGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupsService.updateCourseGroup(req.params.id as string, req.body, req.locale);
  sendSuccess(res, group);
});

export const deleteCourseGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  await groupsService.deleteCourseGroup(req.params.id as string);
  sendSuccess(res, { deleted: true });
});

export const addGroupMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await groupsService.setEnrollmentGroup(req.body.enrollmentId, req.params.id as string, req.locale);
  sendSuccess(res, updated);
});

export const removeGroupMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await groupsService.setEnrollmentGroup(req.params.enrollmentId as string, null, req.locale);
  sendSuccess(res, updated);
});
