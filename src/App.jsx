import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import AttendanceHistory from './pages/teacher/AttendanceHistory';
import StudentDashboard from './pages/student/StudentDashboard';
import ReportsAnalytics from './pages/reports/ReportsAnalytics';
import UserProfile from './pages/profile/UserProfile';
import Settings from './pages/settings/Settings';

// Helper component to redirect root "/" to user's authorized dashboard
function RoleBasedRedirect() {
  const { userRole, currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
  if (userRole === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Dashboard Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Root Redirect */}
            <Route index element={<RoleBasedRedirect />} />

            {/* Admin Only Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TeacherManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/classes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClassManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/subjects"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SubjectManagement />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="teacher"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="teacher/mark"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <MarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="teacher/history"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <AttendanceHistory />
                </ProtectedRoute>
              }
            />

            {/* Student Route */}
            <Route
              path="student"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Across Roles */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <ReportsAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
