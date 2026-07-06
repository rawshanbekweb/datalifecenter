import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import MentorLayout from './layouts/MentorLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import MentorsPage from './pages/MentorsPage'
import PartnersPage from './pages/PartnersPage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import MentorHomePage from './pages/mentor/MentorHomePage'
import MentorStudentsPage from './pages/mentor/MentorStudentsPage'
import MentorSessionsPage from './pages/mentor/MentorSessionsPage'
import LearnPage from './pages/LearnPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminEnrollmentsPage from './pages/admin/AdminEnrollmentsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminMessagesPage from './pages/admin/AdminMessagesPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCurriculumPage from './pages/admin/AdminCurriculumPage'
import AdminMentorsPage from './pages/admin/AdminMentorsPage'
import AdminPartnersPage from './pages/admin/AdminPartnersPage'
import AdminBlogPage from './pages/admin/AdminBlogPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/common/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'mentors', element: <MentorsPage /> },
      { path: 'partners', element: <PartnersPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/:slug', element: <BlogDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'learn/:slug', element: <ProtectedRoute><LearnPage /></ProtectedRoute> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/mentor',
    element: <ProtectedRoute role={['MENTOR', 'ADMIN']}><MentorLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <MentorHomePage /> },
      { path: 'students', element: <MentorStudentsPage /> },
      { path: 'sessions', element: <MentorSessionsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'enrollments', element: <AdminEnrollmentsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'messages', element: <AdminMessagesPage /> },
      { path: 'courses', element: <AdminCoursesPage /> },
      { path: 'courses/:id/curriculum', element: <AdminCurriculumPage /> },
      { path: 'mentors', element: <AdminMentorsPage /> },
      { path: 'partners', element: <AdminPartnersPage /> },
      { path: 'blog', element: <AdminBlogPage /> },
    ],
  },
])
