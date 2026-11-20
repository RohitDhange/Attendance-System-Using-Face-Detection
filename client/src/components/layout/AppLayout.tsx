import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const PAGE_METADATA: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': {
    title: 'Dashboard Overview',
    subtitle: 'Real-time attendance metrics, activity stream, and biometric health',
  },
  '/admin/users': {
    title: 'User Management',
    subtitle: 'Manage faculty, staff, and enrolled students directory',
  },
  '/admin/users/add': {
    title: 'Add New User',
    subtitle: 'Register a new student or staff profile in the attendance database',
  },
  '/admin/face-registration': {
    title: 'Biometric Face Registration',
    subtitle: 'Capture live camera feed and generate encrypted 128-d face descriptors',
  },
  '/admin/face-management': {
    title: 'Registered Face Profiles',
    subtitle: 'Search, audit, and manage biometric face embeddings',
  },
  '/admin/attendance': {
    title: 'Attendance Records',
    subtitle: 'Daily check-in logs, verification methods, and status auditing',
  },
  '/admin/reports': {
    title: 'Attendance Analytics & Reports',
    subtitle: 'Department-wise trends, monthly breakdown, and exportable data',
  },
  '/admin/settings': {
    title: 'System Settings',
    subtitle: 'Configure late cutoff times, recognition thresholds, and security logs',
  },
  '/user/dashboard': {
    title: 'Student Dashboard',
    subtitle: 'Daily attendance overview, status, and smart check-in',
  },
  '/user/mark-attendance': {
    title: 'Mark Attendance',
    subtitle: 'Live webcam facial recognition verification',
  },
  '/user/history': {
    title: 'My Attendance History',
    subtitle: 'Past check-in records, status timestamps, and consistency metrics',
  },
  '/user/profile': {
    title: 'My Profile & Security',
    subtitle: 'Account details and biometric face registration status',
  },
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentMeta = PAGE_METADATA[location.pathname] || {
    title: 'FaceAttend',
    subtitle: 'Smart Face Recognition Attendance System',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={currentMeta.title}
          subtitle={currentMeta.subtitle}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

