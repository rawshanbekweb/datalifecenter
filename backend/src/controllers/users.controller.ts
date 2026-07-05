import { Request, Response } from 'express';
import * as usersService from '../services/users.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as {
    role?: 'STUDENT' | 'MENTOR' | 'ADMIN';
    search?: string;
    page: number;
    limit: number;
  };
  const result = await usersService.listUsers(filters);
  sendSuccess(res, result);
});

export const updateUserRoleHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await usersService.updateUserRole(req.params.id as string, req.body.role, req.user.userId);
  sendSuccess(res, user);
});
