import { Request, Response } from 'express';
import * as blogService from '../services/blog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listBlogPostsHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as unknown as { category?: string; page: number; limit: number };
  const result = await blogService.listBlogPosts(filters);
  sendSuccess(res, result);
});

export const getBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getBlogPostBySlug(req.params.slug as string);
  sendSuccess(res, post);
});

export const listBlogPostsAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await blogService.listBlogPostsAdmin();
  sendSuccess(res, posts);
});

export const getBlogPostAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getBlogPostByIdAdmin(req.params.id as string);
  sendSuccess(res, post);
});

export const createBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.createBlogPost(req.body);
  sendSuccess(res, post, 201);
});

export const updateBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.updateBlogPost(req.params.id as string, req.body);
  sendSuccess(res, post);
});

export const deleteBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deleteBlogPost(req.params.id as string);
  sendSuccess(res, { message: "Maqola o'chirildi" });
});
