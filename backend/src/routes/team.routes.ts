import { Router } from 'express';
import {
  createTeamMemberHandler,
  deleteTeamMemberHandler,
  getTeamMemberHandler,
  getTeamMemberMeHandler,
  listTeamAdminHandler,
  listTeamHandler,
  updateTeamMemberHandler,
  updateTeamMemberMeHandler,
} from '../controllers/team.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { publicCache } from '../middleware/publicCache';
import { validateBody } from '../middleware/validateRequest';
import {
  createTeamMemberSchema,
  updateTeamMemberMeSchema,
  updateTeamMemberSchema,
} from '../validators/team.validator';

const router = Router();

router.get('/', publicCache(120), listTeamHandler);
// Kabinet: a'zoning o'zi. MENTOR/ADMIN ham kiradi — mentor ayni paytda jamoa
// a'zosi bo'lishi mumkin. Profil bog'lanmagan bo'lsa servis TEAM_PROFILE_NOT_LINKED beradi.
router.get('/me', authenticate, authorize('TEAM', 'MENTOR', 'ADMIN'), getTeamMemberMeHandler);
router.patch('/me', authenticate, authorize('TEAM', 'MENTOR', 'ADMIN'), validateBody(updateTeamMemberMeSchema), updateTeamMemberMeHandler);
// Admin tahrirlash paneli — xom (barcha til) ma'lumot, /:slug dan OLDIN ro'yxatga olinishi shart
router.get('/admin', authenticate, authorize('ADMIN'), listTeamAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createTeamMemberSchema), createTeamMemberHandler);
router.get('/:slug', getTeamMemberHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateTeamMemberSchema), updateTeamMemberHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTeamMemberHandler);

export default router;
