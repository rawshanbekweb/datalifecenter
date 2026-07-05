import { Router } from 'express';
import { listUsersHandler, updateUserRoleHandler } from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { listUsersQuerySchema, updateUserRoleSchema } from '../validators/users.validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', validateQuery(listUsersQuerySchema), listUsersHandler);
router.patch('/:id/role', validateBody(updateUserRoleSchema), updateUserRoleHandler);

export default router;
