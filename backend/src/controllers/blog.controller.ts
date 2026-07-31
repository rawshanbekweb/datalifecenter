import { Request, Response } from 'express';
import * as blogService from '../services/blog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listBlogPostsHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as unknown as { category?: string; page: number; limit: number };
  const result = await blogService.listBlogPosts(filters, req.locale);
  sendSuccess(res, result);
});

/**
 * Ko'rishlar soni bu yerda OSHIRILMAYDI.
 *
 * Ilgari shu handler `bv_<id>` cookie'si bilan hisoblardi. Ikkita muammo bor edi:
 *  1. Krossdomen cookie Safari'da bloklanadi — o'sha brauzerlarda har
 *     yangilashda hisob oshib ketardi.
 *  2. Hisoblash GET ichida bo'lgani uchun bu endpointni keshlab bo'lmasdi.
 *
 * Endi mijoz sahifa ochilgach `POST /api/engagement/blog/:id/view` yuboradi,
 * dublikat esa `deviceId` bo'yicha bazada tekshiriladi.
 */
export const getBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getBlogPostBySlug(req.params.slug as string, req.locale);
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
