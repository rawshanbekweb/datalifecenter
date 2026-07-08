import { Router } from 'express';
import {
  createProjectHandler,
  deleteProjectHandler,
  listProjectsAdminHandler,
  listProjectsHandler,
  updateProjectHandler,
} from '../controllers/projects.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createProjectSchema, updateProjectSchema } from '../validators/projects.validator';

const router = Router();

router.get('/', listProjectsHandler);
router.get('/admin', authenticate, authorize('ADMIN'), listProjectsAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createProjectSchema), createProjectHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateProjectSchema), updateProjectHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProjectHandler);

export default router;
