import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../firebase/dbService';
import Alert from '../../components/common/Alert';
import StatsCard from '../../components/common/StatsCard';
import { StatusBadge } from '../../components/common/Badge';
import {
  Users,
  GraduationCap,
  Layers,
  ClipboardCheck,
  Percent,
  CalendarCheck,
  BarChart3,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function AdminDashboard() {
  const { isFirebaseConfigured } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading admin statistics:', err);
      setError(`Unable to load admin statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <Alert type="danger" message={error || 'Admin statistics are unavailable.'} />;
  }

  return (
    <div className="space-y-8">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Institutional attendance analytics, active enrollment, and departmental statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
          <Link
            to="/teacher/mark"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Enrolled active learners"
          icon={Users}
          color="blue"
          trend="+12%"
          trendType="up"
        />
        <StatsCard
          title="Total Faculty"
          value={stats.totalTeachers}
          subtitle="Assigned instructors"
          icon={GraduationCap}
          color="indigo"
          trend="Active"
          trendType="neutral"
        />
        <StatsCard
          title="Class Batches"
          value={stats.totalClasses}
          subtitle="Active academic sections"
          icon={Layers}
          color="purple"
        />
        <StatsCard
          title="Attendance Records"
          value={stats.totalRecords}
          subtitle={`${stats.totalSessions} sessions logged`}
          icon={ClipboardCheck}
          color="emerald"
        />
        <StatsCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          subtitle={`Policy Threshold: ${stats.attendanceThreshold}%`}
          icon={Percent}
          color={stats.overallPercentage >= 75 ? 'emerald' : 'rose'}
          trend={stats.overallPercentage >= 75 ? 'Compliant' : 'Below Target'}
          trendType={stats.overallPercentage >= 75 ? 'up' : 'down'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daily Attendance Rate Trend</h3>
              <p className="text-xs text-slate-500">Student presence percentage across recent lecture dates</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              {isFirebaseConfigured ? 'Firestore Data' : 'Local Demo Data'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(val, name) => [`${val}%`, name === 'percentage' ? 'Attendance Rate' : name]}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                  name="Attendance %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-Wise Attendance Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Subject Attendance</h3>
                <p className="text-xs text-slate-500">Average % per course</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectStats} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Minimum standard: 75%</span>
            <Link to="/reports" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Full breakdown <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity & Management Shortcut Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Attendance Sessions Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Attendance Sessions</h3>
              <p className="text-xs text-slate-500">Latest lectures logged by faculty</p>
            </div>
            <Link to="/teacher/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Class</th>
                  <th className="py-2.5">Subject</th>
                  <th className="py-2.5">Faculty</th>
                  <th className="py-2.5 text-center">Present</th>
                  <th className="py-2.5 text-center">Absent</th>
                  <th className="py-2.5 text-center">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats.recentSessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 text-slate-900 font-semibold">{s.date}</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">{s.className}</span></td>
                    <td className="py-3">
                      <div>
                        <span className="font-bold text-slate-900">{s.subjectCode}</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{s.subjectName}</p>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{s.teacherName}</td>
                    <td className="py-3 text-center text-emerald-600 font-bold">{s.presentCount}</td>
                    <td className="py-3 text-center text-rose-600 font-bold">{s.absentCount}</td>
                    <td className="py-3 text-center text-amber-600 font-bold">{s.lateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md">
            <h4 className="text-base font-bold mb-1">Quick Administrative Actions</h4>
            <p className="text-xs text-blue-100 mb-4 leading-relaxed">
              Maintain institutional academic integrity and monitor student presence in real time.
            </p>
            <div className="space-y-2">
              <Link
                to="/admin/students"
                className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-200" />
                  <span>Manage Student Roster</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/admin/teachers"
                className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-blue-200" />
                  <span>Faculty Assignments</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/reports"
                className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-200" />
                  <span>Generate CSV Reports</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Cloud System Health</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-800">Google Firestore</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Security Rules</span>
                <span className="font-semibold text-emerald-600">RBAC Enforced</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Auto Warning</span>
                <span className="font-semibold text-amber-600">&lt; 75% Flagging Active</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
