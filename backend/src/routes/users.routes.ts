import { Router } from 'express';
import {
  listUsersHandler,
  updateUserRoleHandler,
  setUserBlockedHandler,
  deleteUserHandler,
  resetUserPasswordHandler,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { listUsersQuerySchema, updateUserRoleSchema, setUserBlockedSchema } from '../validators/users.validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', validateQuery(listUsersQuerySchema), listUsersHandler);
router.patch('/:id/role', validateBody(updateUserRoleSchema), updateUserRoleHandler);
router.patch('/:id/block', validateBody(setUserBlockedSchema), setUserBlockedHandler);
router.post('/:id/reset-password', resetUserPasswordHandler);
router.delete('/:id', deleteUserHandler);

export default router;
