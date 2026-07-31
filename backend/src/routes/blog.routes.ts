import { Router } from 'express';
import {
  createBlogPostHandler,
  deleteBlogPostHandler,
  getBlogPostAdminHandler,
  getBlogPostHandler,
  listBlogPostsAdminHandler,
  listBlogPostsHandler,
  updateBlogPostHandler,
} from '../controllers/blog.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { publicCache } from '../middleware/publicCache';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { createBlogPostSchema, listBlogQuerySchema, updateBlogPostSchema } from '../validators/blog.validator';

const router = Router();

router.get('/admin', authenticate, authorize('ADMIN'), listBlogPostsAdminHandler);
router.get('/admin/:id', authenticate, authorize('ADMIN'), getBlogPostAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createBlogPostSchema), createBlogPostHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateBlogPostSchema), updateBlogPostHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBlogPostHandler);

// Faqat ro'yxat keshlanadi — bitta post sahifasi ko'rishlar sonini oshiradi
// (bv_<id> cookie'si bilan), keshlansa hisob umuman ishlamay qolardi.
router.get('/', publicCache(60), validateQuery(listBlogQuerySchema), listBlogPostsHandler);
router.get('/:slug', getBlogPostHandler);

export default router;
