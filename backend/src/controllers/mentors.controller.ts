import { Request, Response } from 'express';
import * as mentorsService from '../services/mentors.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const mentorDashboardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dashboard = await mentorsService.getMentorDashboard(req.user.userId);
  sendSuccess(res, dashboard);
});

export const mentorStudentsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const students = await mentorsService.getMentorStudents(req.user.userId);
  sendSuccess(res, students);
});

export const listMentorsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const mentors = await mentorsService.listMentors();
  sendSuccess(res, mentors);
});

export const getMentorHandler = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorsService.getMentorById(req.params.id as string);
  sendSuccess(res, mentor);
});

export const createMentorHandler = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorsService.createMentor(req.body);
  sendSuccess(res, mentor, 201);
});

export const updateMentorHandler = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorsService.updateMentor(req.params.id as string, req.body);
  sendSuccess(res, mentor);
});

export const deleteMentorHandler = asyncHandler(async (req: Request, res: Response) => {
  await mentorsService.deleteMentor(req.params.id as string);
  sendSuccess(res, { message: "Mentor o'chirildi" });
});
