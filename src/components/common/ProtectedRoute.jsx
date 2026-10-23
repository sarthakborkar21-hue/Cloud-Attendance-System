import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Verifying Cloud Credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and current user is not authorized
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their respective authorized dashboard
    let defaultPath = '/student';
    if (userRole === 'admin') defaultPath = '/admin';
    else if (userRole === 'teacher') defaultPath = '/teacher';

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your current role (<span className="capitalize font-semibold text-slate-800">{userRole}</span>) does not have permission to view this section.
          </p>
          <div className="flex flex-col gap-2">
            <Navigate to={defaultPath} replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
}
