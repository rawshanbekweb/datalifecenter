/* oxlint-disable react/only-export-components -- route jadvali komponent emas, fast-refresh shart emas */
import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RouteErrorPage from './pages/RouteErrorPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleHomeRedirect from './components/common/RoleHomeRedirect'

// Og'ir sahifalar (kabinetlar, learn, admin) faqat kerak bo'lganda yuklanadi —
// oddiy mehmon admin-panel kodini yuklab olmaydi (bundle 3 barobar yengil)
const AboutPage = lazy(() => import('./pages/AboutPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const MentorsPage = lazy(() => import('./pages/MentorsPage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const VerifyCertificatePage = lazy(() => import('./pages/VerifyCertificatePage'))
const LearnPage = lazy(() => import('./pages/LearnPage'))

const StudentLayout = lazy(() => import('./layouts/StudentLayout'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const StudentSessionsPage = lazy(() => import('./pages/student/StudentSessionsPage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const StudentCertificatesPage = lazy(() => import('./pages/student/StudentCertificatesPage'))

const MentorLayout = lazy(() => import('./layouts/MentorLayout'))
const MentorHomePage = lazy(() => import('./pages/mentor/MentorHomePage'))
const MentorStudentsPage = lazy(() => import('./pages/mentor/MentorStudentsPage'))
const MentorSessionsPage = lazy(() => import('./pages/mentor/MentorSessionsPage'))
const MentorCoursesPage = lazy(() => import('./pages/mentor/MentorCoursesPage'))
const MentorCurriculumPage = lazy(() => import('./pages/mentor/MentorCurriculumPage'))
const MentorProfilePage = lazy(() => import('./pages/mentor/MentorProfilePage'))
const MentorQuestionsPage = lazy(() => import('./pages/mentor/MentorQuestionsPage'))
const MentorRequestsPage = lazy(() => import('./pages/mentor/MentorRequestsPage'))

const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminEnrollmentsPage = lazy(() => import('./pages/admin/AdminEnrollmentsPage'))
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage'))
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'))
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'))
const AdminCurriculumPage = lazy(() => import('./pages/admin/AdminCurriculumPage'))
const AdminMentorsPage = lazy(() => import('./pages/admin/AdminMentorsPage'))
const AdminMentorRequestsPage = lazy(() => import('./pages/admin/AdminMentorRequestsPage'))
const AdminPartnersPage = lazy(() => import('./pages/admin/AdminPartnersPage'))
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'))
const AdminSiteSettingsPage = lazy(() => import('./pages/admin/AdminSiteSettingsPage'))
const AdminTestimonialsPage = lazy(() => import('./pages/admin/AdminTestimonialsPage'))
const AdminCourseReviewsPage = lazy(() => import('./pages/admin/AdminCourseReviewsPage'))
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'))

function PageFallback(): React.ReactElement {
  return (
    <section style={{ padding: '200px 24px 80px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
      Yuklanmoqda...
    </section>
  )
}

// lazy sahifani Suspense bilan o'raydi
function s(el: React.ReactElement): React.ReactElement {
  return <Suspense fallback={<PageFallback />}>{el}</Suspense>
}

// `basename` orqali /ru, /kaa, /en prefikslar avtomatik qo'shiladi/olib
// tashlanadi — quyidagi route'lar hech qachon locale prefiksini bilishi shart emas.
export function createAppRouter(basename: string) {
  return createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: s(<AboutPage />) },
      { path: 'courses', element: s(<CoursesPage />) },
      { path: 'courses/:slug', element: s(<CourseDetailPage />) },
      { path: 'mentors', element: s(<MentorsPage />) },
      { path: 'partners', element: s(<PartnersPage />) },
      { path: 'blog', element: s(<BlogPage />) },
      { path: 'blog/:slug', element: s(<BlogDetailPage />) },
      { path: 'contact', element: s(<ContactPage />) },
      { path: 'login', element: s(<LoginPage />) },
      { path: 'register', element: s(<RegisterPage />) },
      { path: 'forgot-password', element: s(<ForgotPasswordPage />) },
      { path: 'reset-password', element: s(<ResetPasswordPage />) },
      { path: 'verify-email', element: s(<VerifyEmailPage />) },
      { path: 'verify-certificate', element: s(<VerifyCertificatePage />) },
      { path: 'dashboard', element: <RoleHomeRedirect /> },
      { path: 'profile', element: <Navigate to="/student/profile" replace /> },
      { path: 'learn/:slug', element: <ProtectedRoute>{s(<LearnPage />)}</ProtectedRoute> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute>{s(<StudentLayout />)}</ProtectedRoute>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: s(<DashboardPage />) },
      { path: 'sessions', element: s(<StudentSessionsPage />) },
      { path: 'subscription', element: s(<SubscriptionPage />) },
      { path: 'certificates', element: s(<StudentCertificatesPage />) },
      { path: 'profile', element: s(<ProfilePage />) },
    ],
  },
  {
    path: '/mentor',
    element: <ProtectedRoute role={['MENTOR', 'ADMIN']}>{s(<MentorLayout />)}</ProtectedRoute>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: s(<MentorHomePage />) },
      { path: 'courses', element: s(<MentorCoursesPage />) },
      { path: 'courses/:id/curriculum', element: s(<MentorCurriculumPage />) },
      { path: 'students', element: s(<MentorStudentsPage />) },
      { path: 'sessions', element: s(<MentorSessionsPage />) },
      { path: 'questions', element: s(<MentorQuestionsPage />) },
      { path: 'requests', element: s(<MentorRequestsPage />) },
      { path: 'profile', element: s(<MentorProfilePage />) },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute role="ADMIN">{s(<AdminLayout />)}</ProtectedRoute>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: s(<AdminDashboardPage />) },
      { path: 'enrollments', element: s(<AdminEnrollmentsPage />) },
      { path: 'subscriptions', element: s(<AdminSubscriptionsPage />) },
      { path: 'users', element: s(<AdminUsersPage />) },
      { path: 'messages', element: s(<AdminMessagesPage />) },
      { path: 'announcements', element: s(<AdminAnnouncementsPage />) },
      { path: 'courses', element: s(<AdminCoursesPage />) },
      { path: 'courses/:id/curriculum', element: s(<AdminCurriculumPage />) },
      { path: 'mentors', element: s(<AdminMentorsPage />) },
      { path: 'mentor-requests', element: s(<AdminMentorRequestsPage />) },
      { path: 'partners', element: s(<AdminPartnersPage />) },
      { path: 'blog', element: s(<AdminBlogPage />) },
      { path: 'site-settings', element: s(<AdminSiteSettingsPage />) },
      { path: 'testimonials', element: s(<AdminTestimonialsPage />) },
      { path: 'course-reviews', element: s(<AdminCourseReviewsPage />) },
      { path: 'projects', element: s(<AdminProjectsPage />) },
    ],
  },
  ], { basename })
}
