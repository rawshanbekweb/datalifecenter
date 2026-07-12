import { Request, Response } from 'express';
import * as assignmentsService from '../services/assignments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function actorOf(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { userId: req.user.userId, role: req.user.role };
}

export const createAssignmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.createAssignment(req.body, actorOf(req));
  sendSuccess(res, assignment, 201);
});

export const listManagedAssignmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentsService.listManagedAssignments(actorOf(req), req.locale);
  sendSuccess(res, assignments);
});

export const updateAssignmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.updateAssignment(req.params.id as string, req.body, actorOf(req));
  sendSuccess(res, assignment);
});

export const deleteAssignmentHandler = asyncHandler(async (req: Request, res: Response) => {
  await assignmentsService.deleteAssignment(req.params.id as string, actorOf(req));
  sendSuccess(res, { deleted: true });
});

export const listMyAssignmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentsService.listMyAssignments(actorOf(req).userId, req.locale);
  sendSuccess(res, assignments);
});

export const submitAssignmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const submission = await assignmentsService.submitAssignment(req.params.id as string, actorOf(req), req.body);
  sendSuccess(res, submission, 201);
});

export const reviewSubmissionHandler = asyncHandler(async (req: Request, res: Response) => {
  const submission = await assignmentsService.reviewSubmission(req.params.id as string, req.body, actorOf(req));
  sendSuccess(res, submission);
});
