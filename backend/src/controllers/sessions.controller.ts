import { Request, Response } from 'express';
import * as sessionsService from '../services/sessions.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const createSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const session = await sessionsService.createSession(req.body, req.user);
  sendSuccess(res, session, 201);
});

export const listMySessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const sessions = await sessionsService.listMySessions(req.user.userId);
  sendSuccess(res, sessions);
});

export const listManagedSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const sessions = await sessionsService.listManagedSessions(req.user);
  sendSuccess(res, sessions);
});

export const updateSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const session = await sessionsService.updateSession(req.params.id as string, req.body, req.user);
  sendSuccess(res, session);
});

export const deleteSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await sessionsService.deleteSession(req.params.id as string, req.user);
  sendSuccess(res, { deleted: true });
});
