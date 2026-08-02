import { Request, Response } from 'express';
import * as teamService from '../services/team.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listTeamHandler = asyncHandler(async (req: Request, res: Response) => {
  const members = await teamService.listTeam(req.locale);
  sendSuccess(res, members);
});

export const listTeamAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const members = await teamService.listTeamAdmin();
  sendSuccess(res, members);
});

export const getTeamMemberMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const member = await teamService.getTeamMemberMe(req.user.userId);
  sendSuccess(res, member);
});

export const updateTeamMemberMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const member = await teamService.updateTeamMemberMe(req.user.userId, req.body);
  sendSuccess(res, member);
});

export const getTeamMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const member = await teamService.getTeamMemberBySlug(req.params.slug as string, req.locale);
  sendSuccess(res, member);
});

export const createTeamMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const member = await teamService.createTeamMember(req.body);
  sendSuccess(res, member, 201);
});

export const updateTeamMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const member = await teamService.updateTeamMember(req.params.id as string, req.body);
  sendSuccess(res, member);
});

export const deleteTeamMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  await teamService.deleteTeamMember(req.params.id as string);
  sendSuccess(res, { message: "Jamoa a'zosi o'chirildi" });
});
