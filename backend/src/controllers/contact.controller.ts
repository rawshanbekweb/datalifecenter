import { Request, Response } from 'express';
import * as contactService from '../services/contact.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const createContactMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await contactService.createContactMessage(req.body);
  sendSuccess(res, message, 201);
});

export const listContactMessagesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const messages = await contactService.listContactMessages();
  sendSuccess(res, messages);
});

export const updateContactMessageStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await contactService.updateContactMessageStatus(req.params.id as string, req.body.status);
  sendSuccess(res, message);
});
