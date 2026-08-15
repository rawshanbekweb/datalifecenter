import { Router } from 'express';
import {
  addGroupMemberHandler,
  createCourseGroupHandler,
  deleteCourseGroupHandler,
  getCourseGroupHandler,
  listCourseGroupsHandler,
  listMyCourseGroupsHandler,
  removeGroupMemberHandler,
  updateCourseGroupHandler,
} from '../controllers/courseGroups.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  createCourseGroupSchema,
  listCourseGroupsQuerySchema,
  setEnrollmentGroupSchema,
  updateCourseGroupSchema,
} from '../validators/courseGroups.validator';

const router = Router();

router.use(authenticate);

// O'quvchining o'z guruhlari — kabinetdagi jadval kartasi
router.get('/mine', listMyCourseGroupsHandler);
// Ro'yxatni admin ham, mentor ham oladi; mentor faqat o'z kurslarinikini
// ko'radi (courseGroups.service.ts: visibilityFilter)
router.get('/', authorize('MENTOR', 'ADMIN'), validateQuery(listCourseGroupsQuerySchema), listCourseGroupsHandler);
// Eslatma: '/:id' aniq yo'llardan KEYIN turishi shart
router.get('/:id', authorize('MENTOR', 'ADMIN'), getCourseGroupHandler);

// Yozish amallari faqat adminda — sabab servis izohida
router.post('/', authorize('ADMIN'), validateBody(createCourseGroupSchema), createCourseGroupHandler);
router.patch('/:id', authorize('ADMIN'), validateBody(updateCourseGroupSchema), updateCourseGroupHandler);
router.delete('/:id', authorize('ADMIN'), deleteCourseGroupHandler);

router.post('/:id/members', authorize('ADMIN'), validateBody(setEnrollmentGroupSchema), addGroupMemberHandler);
router.delete('/:id/members/:enrollmentId', authorize('ADMIN'), removeGroupMemberHandler);

export default router;
