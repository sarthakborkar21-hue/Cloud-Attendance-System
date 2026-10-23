import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Cloud,
  Lock,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2
} from 'lucide-react';
import Alert from '../../components/common/Alert';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    login,
    register,
    switchDemoRole,
    isFirebaseConfigured,
    authError,
    clearAuthError
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectByRole = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'admin') navigate('/admin');
    else if (userRole === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        const { role: registeredRole } = await register(email, password, { name });
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => redirectByRole(registeredRole), 1000);
      } else {
        const { role: loggedInRole } = await login(email, password);
        redirectByRole(loggedInRole);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo fill and login
  const handleDemoLogin = (targetRole) => {
    switchDemoRole(targetRole);
    redirectByRole(targetRole);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: College & Project Information */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Cloud Attendance</h1>
                <p className="text-xs text-blue-200">College Management Portal</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-100 text-xs font-semibold border border-blue-400/30">
                <Building2 className="w-3.5 h-3.5" />
                Cloud Computing Mini Project
              </div>
              <h2 className="text-2xl font-extrabold leading-snug">
                Modern, Secure & Cloud-Powered Attendance System
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                Uses Firebase Authentication and Cloud Firestore when configured. Role assignments and data access are enforced by Firestore Security Rules.
              </p>
            </div>

            <div className="space-y-3 text-xs text-blue-100/90">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Admin, teacher, and student role-based dashboards</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Duplicate Attendance Session Prevention</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Interactive Recharts Analytics & CSV Export</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-blue-200/80 flex items-center justify-between relative z-10">
            <span>Academic Year 2024-2025</span>
            <span className="flex items-center gap-1 font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isFirebaseConfigured ? 'Firestore Rules Required' : 'Local Demo Only'}
            </span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          
          {!isFirebaseConfigured && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Local Demo Mode</span>
              </div>
              <span className="text-[11px] text-amber-800">Not connected to Firebase</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow text-center flex flex-col items-center gap-0.5"
              >
                <span>Admin Demo</span>
                <span className="text-[10px] font-normal text-purple-500">Dean of Academics</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('teacher')}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow text-center flex flex-col items-center gap-0.5"
              >
                <span>Teacher Demo</span>
                <span className="text-[10px] font-normal text-blue-500">Dr. Robert Vance</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow text-center flex flex-col items-center gap-0.5"
              >
                <span>Student Demo</span>
                <span className="text-[10px] font-normal text-emerald-500">Alex Morgan</span>
              </button>
            </div>
          </div>
          )}

          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {isRegistering ? 'Create Student Account' : 'Portal Sign In'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegistering 
                  ? 'Enter credentials to enroll into the college database' 
                  : 'Enter your registered email and password to continue'}
              </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  !isRegistering ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isRegistering ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {error && <Alert type="danger" message={error} className="mb-4" onClose={() => setError('')} />}
          {!error && authError && (
            <Alert type="danger" message={authError} className="mb-4" onClose={clearAuthError} />
          )}
          {success && <Alert type="success" message={success} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.morgan@college.edu"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {isRegistering && (
              <p className="text-xs text-slate-500">
                Public registration creates a student account only. An administrator must provision staff roles and link student records.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? 'Complete Registration' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
