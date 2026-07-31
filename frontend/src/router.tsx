/* oxlint-disable react/only-export-components -- route jadvali komponent emas, fast-refresh shart emas */
import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RouteErrorPage from './pages/RouteErrorPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleHomeRedirect from './components/common/RoleHomeRedirect'
import { lazyWithRetry } from './utils/lazyWithRetry'

// Og'ir sahifalar (kabinetlar, learn, admin) faqat kerak bo'lganda yuklanadi —
// oddiy mehmon admin-panel kodini yuklab olmaydi (bundle 3 barobar yengil)
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'))
const CoursesPage = lazyWithRetry(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazyWithRetry(() => import('./pages/CourseDetailPage'))
const MentorsPage = lazyWithRetry(() => import('./pages/MentorsPage'))
const PartnersPage = lazyWithRetry(() => import('./pages/PartnersPage'))
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'))
const BlogDetailPage = lazyWithRetry(() => import('./pages/BlogDetailPage'))
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'))
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'))
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazyWithRetry(() => import('./pages/VerifyEmailPage'))
const VerifyCertificatePage = lazyWithRetry(() => import('./pages/VerifyCertificatePage'))
const LearnPage = lazyWithRetry(() => import('./pages/LearnPage'))
const LiveSessionPage = lazyWithRetry(() => import('./pages/LiveSessionPage'))

const StudentLayout = lazyWithRetry(() => import('./layouts/StudentLayout'))
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'))
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'))
const StudentSessionsPage = lazyWithRetry(() => import('./pages/student/StudentSessionsPage'))
const StudentAssignmentsPage = lazyWithRetry(() => import('./pages/student/StudentAssignmentsPage'))
const SubscriptionPage = lazyWithRetry(() => import('./pages/SubscriptionPage'))
const StudentCertificatesPage = lazyWithRetry(() => import('./pages/student/StudentCertificatesPage'))

const MentorLayout = lazyWithRetry(() => import('./layouts/MentorLayout'))
const MentorHomePage = lazyWithRetry(() => import('./pages/mentor/MentorHomePage'))
const MentorStudentsPage = lazyWithRetry(() => import('./pages/mentor/MentorStudentsPage'))
const MentorSessionsPage = lazyWithRetry(() => import('./pages/mentor/MentorSessionsPage'))
const MentorCoursesPage = lazyWithRetry(() => import('./pages/mentor/MentorCoursesPage'))
const MentorCurriculumPage = lazyWithRetry(() => import('./pages/mentor/MentorCurriculumPage'))
const MentorProfilePage = lazyWithRetry(() => import('./pages/mentor/MentorProfilePage'))
const MentorQuestionsPage = lazyWithRetry(() => import('./pages/mentor/MentorQuestionsPage'))
const MentorAssignmentsPage = lazyWithRetry(() => import('./pages/mentor/MentorAssignmentsPage'))
const MentorRequestsPage = lazyWithRetry(() => import('./pages/mentor/MentorRequestsPage'))

const AdminLayout = lazyWithRetry(() => import('./layouts/AdminLayout'))
const AdminDashboardPage = lazyWithRetry(() => import('./pages/admin/AdminDashboardPage'))
const AdminEnrollmentsPage = lazyWithRetry(() => import('./pages/admin/AdminEnrollmentsPage'))
const AdminSubscriptionsPage = lazyWithRetry(() => import('./pages/admin/AdminSubscriptionsPage'))
const AdminUsersPage = lazyWithRetry(() => import('./pages/admin/AdminUsersPage'))
const AdminMessagesPage = lazyWithRetry(() => import('./pages/admin/AdminMessagesPage'))
const AdminAnnouncementsPage = lazyWithRetry(() => import('./pages/admin/AdminAnnouncementsPage'))
const AdminCoursesPage = lazyWithRetry(() => import('./pages/admin/AdminCoursesPage'))
const AdminCurriculumPage = lazyWithRetry(() => import('./pages/admin/AdminCurriculumPage'))
const AdminMentorsPage = lazyWithRetry(() => import('./pages/admin/AdminMentorsPage'))
const AdminMentorRequestsPage = lazyWithRetry(() => import('./pages/admin/AdminMentorRequestsPage'))
const AdminPartnersPage = lazyWithRetry(() => import('./pages/admin/AdminPartnersPage'))
const AdminBlogPage = lazyWithRetry(() => import('./pages/admin/AdminBlogPage'))
const AdminSiteSettingsPage = lazyWithRetry(() => import('./pages/admin/AdminSiteSettingsPage'))
const AdminTestimonialsPage = lazyWithRetry(() => import('./pages/admin/AdminTestimonialsPage'))
const AdminCourseReviewsPage = lazyWithRetry(() => import('./pages/admin/AdminCourseReviewsPage'))
const AdminProjectsPage = lazyWithRetry(() => import('./pages/admin/AdminProjectsPage'))

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
      { path: 'live/:id', element: <ProtectedRoute>{s(<LiveSessionPage />)}</ProtectedRoute> },
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
      { path: 'assignments', element: s(<StudentAssignmentsPage />) },
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
      { path: 'assignments', element: s(<MentorAssignmentsPage />) },
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
