import { Request, Response } from 'express';
import * as testimonialsService from '../services/testimonials.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listTestimonialsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const testimonials = await testimonialsService.listTestimonials();
  sendSuccess(res, testimonials);
});

export const listTestimonialsAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const testimonials = await testimonialsService.listTestimonialsAdmin();
  sendSuccess(res, testimonials);
});

export const createTestimonialHandler = asyncHandler(async (req: Request, res: Response) => {
  const testimonial = await testimonialsService.createTestimonial(req.body);
  sendSuccess(res, testimonial, 201);
});

export const updateTestimonialHandler = asyncHandler(async (req: Request, res: Response) => {
  const testimonial = await testimonialsService.updateTestimonial(req.params.id as string, req.body);
  sendSuccess(res, testimonial);
});

export const deleteTestimonialHandler = asyncHandler(async (req: Request, res: Response) => {
  await testimonialsService.deleteTestimonial(req.params.id as string);
  sendSuccess(res, { message: "Sharh o'chirildi" });
});
