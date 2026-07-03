import { Router } from 'express';
import authRoutes from './auth.routes';
import contactRoutes from './contact.routes';
import coursesRoutes from './courses.routes';
import mentorsRoutes from './mentors.routes';
import partnersRoutes from './partners.routes';
import enrollmentsRoutes from './enrollments.routes';
import blogRoutes from './blog.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/courses', coursesRoutes);
router.use('/mentors', mentorsRoutes);
router.use('/partners', partnersRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/blog', blogRoutes);

export default router;
