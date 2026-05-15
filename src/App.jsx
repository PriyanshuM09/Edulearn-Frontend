import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import CoursesPage from './pages/public/CoursesPage';
import CourseDetailPage from './pages/public/CourseDetailPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyLearningPage from './pages/student/MyLearningPage';
import ProfilePage from './pages/student/ProfilePage';
import QuizPage from './pages/student/QuizPage';
import QuizResultsPage from './pages/student/QuizResultsPage';
import PaymentPage from './pages/student/PaymentPage';
import SubscriptionPage from './pages/student/SubscriptionPage';
import LearnPage from './pages/student/LearnPage';
import NotificationsPage from './pages/student/NotificationsPage';
import WalletPage from './pages/student/WalletPage';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageCoursesPage from './pages/instructor/ManageCoursesPage';
import CreateCoursePage from './pages/instructor/CreateCoursePage';
import QuizManagerPage from './pages/instructor/QuizManagerPage';
import LessonManagerPage from './pages/instructor/LessonManagerPage';
import InstructorDiscussionPage from './pages/instructor/InstructorDiscussionPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageCoursesAdminPage from './pages/admin/ManageCoursesAdminPage';
import PaymentOverviewPage from './pages/admin/PaymentOverviewPage';
import RefundRequestsPage from './pages/admin/RefundRequestsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />

          {/* ── Student ─────────────────────────────────────────────── */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><MyLearningPage /></ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><ProfilePage /></ProtectedRoute>
          } />
          {/* Assessment */}
          <Route path="/student/quiz/:quizId" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><QuizPage /></ProtectedRoute>
          } />
          <Route path="/student/quiz/:quizId/results" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><QuizResultsPage /></ProtectedRoute>
          } />
          {/* Payment */}
          <Route path="/student/payment/:courseId" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><PaymentPage /></ProtectedRoute>
          } />
          <Route path="/student/subscriptions" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><SubscriptionPage /></ProtectedRoute>
          } />
          <Route path="/student/courses/:courseId/learn" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><LearnPage /></ProtectedRoute>
          } />
          <Route path="/student/notifications" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><NotificationsPage /></ProtectedRoute>
          } />
          <Route path="/student/wallet" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><WalletPage /></ProtectedRoute>
          } />

          {/* ── Instructor ──────────────────────────────────────────── */}
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>
          } />
          <Route path="/instructor/courses" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><ManageCoursesPage /></ProtectedRoute>
          } />
          <Route path="/instructor/courses/create" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><CreateCoursePage /></ProtectedRoute>
          } />
          <Route path="/instructor/courses/:courseId/lessons" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><LessonManagerPage /></ProtectedRoute>
          } />
          <Route path="/instructor/courses/:courseId/discussions" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDiscussionPage /></ProtectedRoute>
          } />
          {/* Assessment */}
          <Route path="/instructor/quizzes" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><QuizManagerPage /></ProtectedRoute>
          } />

          {/* ── Admin ───────────────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><ManageUsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><ManageCoursesAdminPage /></ProtectedRoute>
          } />
          {/* Payment */}
          <Route path="/admin/payments" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><PaymentOverviewPage /></ProtectedRoute>
          } />
          <Route path="/admin/refund-requests" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><RefundRequestsPage /></ProtectedRoute>
          } />

          <Route path="*" element={<div className="text-center p-20 text-2xl">404 Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
