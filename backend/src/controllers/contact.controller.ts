import { Request, Response } from 'express';
import * as contactService from '../services/contact.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const createContactMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await contactService.createContactMessage(req.body);
  sendSuccess(res, message, 201);
});

export const listContactMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as {
    status?: 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';
    page: number;
    limit: number;
  };
  const messages = await contactService.listContactMessages(filters);
  sendSuccess(res, messages);
});

export const updateContactMessageStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await contactService.updateContactMessageStatus(req.params.id as string, req.body.status);
  sendSuccess(res, message);
});
