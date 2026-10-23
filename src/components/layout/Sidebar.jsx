import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  CalendarCheck,
  History,
  BarChart3,
  User,
  Settings,
  LogOut,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const {
    currentUser,
    userRole,
    userProfile,
    logout,
    switchDemoRole,
    isFirebaseConfigured
  } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation items based on role
  const getNavLinks = () => {
    if (userRole === 'admin') {
      return [
        { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Student Management', path: '/admin/students', icon: Users },
        { label: 'Teacher Management', path: '/admin/teachers', icon: GraduationCap },
        { label: 'Class Management', path: '/admin/classes', icon: Layers },
        { label: 'Subject Management', path: '/admin/subjects', icon: BookOpen },
        { label: 'Mark Attendance', path: '/teacher/mark', icon: CalendarCheck },
        { label: 'Attendance History', path: '/teacher/history', icon: History },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'User Profile', path: '/profile', icon: User },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ];
    }

    if (userRole === 'teacher') {
      return [
        { label: 'Teacher Dashboard', path: '/teacher', icon: LayoutDashboard },
        { label: 'Mark Attendance', path: '/teacher/mark', icon: CalendarCheck },
        { label: 'Attendance History', path: '/teacher/history', icon: History },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'Class Students', path: '/admin/students', icon: Users },
        { label: 'User Profile', path: '/profile', icon: User },
      ];
    }

    // Student
    return [
      { label: 'Student Dashboard', path: '/student', icon: LayoutDashboard },
      { label: 'Attendance History', path: '/teacher/history', icon: History },
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { label: 'User Profile', path: '/profile', icon: User },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Cloud Attendance</h1>
              <p className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate">
              {userProfile?.displayName || currentUser?.email || 'User'}
            </h4>
            <div className="mt-0.5">
              <RoleBadge role={userRole} />
            </div>
          </div>
        </div>

        {/* Quick Demo Role Switcher (For Evaluation convenience) */}
        {!isFirebaseConfigured && (
        <div className="px-4 py-2 mx-3 mb-2 bg-indigo-50/70 border border-indigo-100 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Demo Switcher
            </span>
            <span className="text-[10px] text-indigo-500 font-normal">Instant Access</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => { switchDemoRole('admin'); navigate('/admin'); }}
              className={`px-1.5 py-1 text-[10px] rounded-lg font-medium transition-all ${
                userRole === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-800 hover:bg-indigo-100/60'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('teacher'); navigate('/teacher'); }}
              className={`px-1.5 py-1 text-[10px] rounded-lg font-medium transition-all ${
                userRole === 'teacher' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-800 hover:bg-indigo-100/60'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('student'); navigate('/student'); }}
              className={`px-1.5 py-1 text-[10px] rounded-lg font-medium transition-all ${
                userRole === 'student' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-800 hover:bg-indigo-100/60'
              }`}
            >
              Student
            </button>
          </div>
        </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
          {navLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              </NavLink>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
