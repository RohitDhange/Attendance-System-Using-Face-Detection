import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AddUserPage } from './pages/admin/AddUserPage';
import { FaceRegistrationPage } from './pages/admin/FaceRegistrationPage';
import { FaceManagementPage } from './pages/admin/FaceManagementPage';
import { AttendanceManagementPage } from './pages/admin/AttendanceManagementPage';
import { AttendanceReportsPage } from './pages/admin/AttendanceReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// User Portal Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { MarkAttendancePage } from './pages/user/MarkAttendancePage';
import { UserAttendanceHistoryPage } from './pages/user/UserAttendanceHistoryPage';
import { UserProfilePage } from './pages/user/UserProfilePage';

const RootRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/user/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Admin Portal Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/add" element={<AddUserPage />} />
              <Route path="face-registration" element={<FaceRegistrationPage />} />
              <Route path="face-management" element={<FaceManagementPage />} />
              <Route path="attendance" element={<AttendanceManagementPage />} />
              <Route path="reports" element={<AttendanceReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Student Portal Protected Routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRole="USER">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/user/dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="mark-attendance" element={<MarkAttendancePage />} />
              <Route path="history" element={<UserAttendanceHistoryPage />} />
              <Route path="profile" element={<UserProfilePage />} />
            </Route>

            {/* Default & Fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;

