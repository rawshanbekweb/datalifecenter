import { Request, Response } from 'express';
import * as questionsService from '../services/questions.service';
import * as mentorRequestsService from '../services/mentorRequests.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function actorOf(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { userId: req.user.userId, role: req.user.role };
}

// ---------- Dars savol-javoblari ----------

export const createQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const question = await questionsService.createQuestion(actorOf(req), req.body);
  sendSuccess(res, question, 201);
});

export const listLessonQuestionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const questions = await questionsService.listLessonQuestions(req.params.lessonId as string, actorOf(req));
  sendSuccess(res, questions);
});

export const listMentorQuestionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const questions = await questionsService.listMentorQuestions(actorOf(req).userId, req.locale);
  sendSuccess(res, questions);
});

export const answerQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const question = await questionsService.answerQuestion(req.params.id as string, req.body.answer, actorOf(req));
  sendSuccess(res, question);
});

// ---------- Mentor so'rovlari ----------

export const createMentorRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const request = await mentorRequestsService.createRequest(actorOf(req).userId, req.body);
  sendSuccess(res, request, 201);
});

export const listMyMentorRequestsHandler = asyncHandler(async (req: Request, res: Response) => {
  const requests = await mentorRequestsService.listMyRequests(actorOf(req).userId);
  sendSuccess(res, requests);
});

export const listAllMentorRequestsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const requests = await mentorRequestsService.listAllRequests();
  sendSuccess(res, requests);
});

export const updateMentorRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const request = await mentorRequestsService.updateRequest(req.params.id as string, req.body);
  sendSuccess(res, request);
});
