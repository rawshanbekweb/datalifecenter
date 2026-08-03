import { Request, Response } from 'express';
import * as momentsService from '../services/moments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listMomentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const moments = await momentsService.listMoments(req.locale);
  sendSuccess(res, moments);
});

export const listMomentsAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const moments = await momentsService.listMomentsAdmin();
  sendSuccess(res, moments);
});

export const createMomentHandler = asyncHandler(async (req: Request, res: Response) => {
  const moment = await momentsService.createMoment(req.body);
  sendSuccess(res, moment, 201);
});

export const updateMomentHandler = asyncHandler(async (req: Request, res: Response) => {
  const moment = await momentsService.updateMoment(req.params.id as string, req.body);
  sendSuccess(res, moment);
});

export const deleteMomentHandler = asyncHandler(async (req: Request, res: Response) => {
  await momentsService.deleteMoment(req.params.id as string);
  sendSuccess(res, { message: "Voqea o'chirildi" });
});
