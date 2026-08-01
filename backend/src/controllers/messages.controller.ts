import { Request, Response } from 'express';
import * as messagesService from '../services/messages.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function actorOf(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { userId: req.user.userId, role: req.user.role };
}

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messagesService.listConversations(actorOf(req));
  sendSuccess(res, conversations);
});

export const getConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  // `before` — eski xabarlarni yuklash kursori (oxirgi ko'rilgan xabar vaqti)
  const rawBefore = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
  const before = rawBefore && !Number.isNaN(rawBefore.getTime()) ? rawBefore : undefined;

  const thread = await messagesService.getConversation(req.params.id as string, actorOf(req), before);
  sendSuccess(res, thread);
});

export const startConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const thread = await messagesService.startConversation(actorOf(req), req.body);
  sendSuccess(res, thread, 201);
});

export const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesService.sendMessage(req.params.id as string, actorOf(req), req.body.body);
  sendSuccess(res, message, 201);
});

export const markConversationReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await messagesService.markConversationRead(req.params.id as string, actorOf(req));
  sendSuccess(res, result);
});

export const unreadCountHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await messagesService.getUnreadCount(actorOf(req));
  sendSuccess(res, result);
});

export const listContactsHandler = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const contacts = await messagesService.listContacts(actorOf(req), search || undefined);
  sendSuccess(res, contacts);
});
