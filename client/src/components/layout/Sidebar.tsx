import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ScanFace,
  Fingerprint,
  CalendarCheck,
  BarChart3,
  Settings,
  History,
  UserCheck,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const adminNav: NavSection[] = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'User & Biometrics',
      items: [
        { label: 'User Directory', path: '/admin/users', icon: Users },
        { label: 'Add New User', path: '/admin/users/add', icon: UserPlus },
        { label: 'Live Face Registration', path: '/admin/face-registration', icon: ScanFace },
        { label: 'Face Database', path: '/admin/face-management', icon: Fingerprint },
      ],
    },
    {
      group: 'Attendance & Reports',
      items: [
        { label: 'Attendance Records', path: '/admin/attendance', icon: CalendarCheck },
        { label: 'Analytics & Reports', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Administration',
      items: [
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const studentNav: NavSection[] = [
    {
      group: 'Student Portal',
      items: [
        { label: 'My Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
        { label: 'Mark Attendance', path: '/user/mark-attendance', icon: UserCheck, highlight: true },
        { label: 'Attendance History', path: '/user/history', icon: History },
        { label: 'My Profile', path: '/user/profile', icon: Users },
      ],
    },
  ];

  const navSections = isAdmin ? adminNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                FaceAttend
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                AI Smart Attendance
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 rounded-lg lg:hidden hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.group}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                            : item.highlight
                            ? 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.highlight && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                          Live
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.fullName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.department || 'Member'}
              </p>
            </div>
            {isAdmin ? (
              <span className="p-1 text-indigo-600 bg-indigo-50 rounded" title="Admin Account">
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="p-1 text-emerald-600 bg-emerald-50 rounded" title="Active Student">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
