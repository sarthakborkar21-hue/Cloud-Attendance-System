import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentStats } from '../../firebase/dbService';
import StatsCard from '../../components/common/StatsCard';
import Alert from '../../components/common/Alert';
import { StatusBadge, AttendancePercentageBadge } from '../../components/common/Badge';
import {
  GraduationCap,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Info,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await getStudentStats(
          userProfile?.studentId,
          currentUser?.email
        );
        setStats(data);
      } catch (err) {
        console.error('Error loading student stats:', err);
        setError(`Unable to load your attendance: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, userProfile]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <Alert type="danger" message={error || 'Student attendance is unavailable.'} />;
  }

  const { student, overallPercentage, isBelowThreshold, threshold } = stats;

  return (
    <div className="space-y-8">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Student Academic Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {student?.name || userProfile?.displayName || 'Student Portal'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-blue-100">
            <span className="font-mono bg-white/15 px-2.5 py-1 rounded-lg font-bold">
              Roll No: {student?.rollNumber || 'Not linked'}
            </span>
            <span className="bg-white/15 px-2.5 py-1 rounded-lg font-semibold">
              Class: {student?.className || 'Not linked'}
            </span>
            <span className="bg-white/15 px-2.5 py-1 rounded-lg">
              Semester 6 • B.Tech CSE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 relative z-10 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[11px] text-blue-200 block uppercase font-bold tracking-wider">Overall Rate</span>
            <span className="text-3xl font-extrabold tracking-tight">{overallPercentage}%</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
            overallPercentage >= threshold ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-bounce'
          }`}>
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Critical Attendance Warning Banner (< 75%) */}
      {isBelowThreshold && (
        <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 text-xs text-rose-900">
            <h4 className="text-base font-extrabold text-rose-800 mb-1">
              Warning: Low Attendance Alert (&lt; {threshold}%)
            </h4>
            <p className="leading-relaxed">
              Your overall attendance or specific subject attendance is currently below the mandatory institutional threshold of <span className="font-bold">{threshold}%</span>. You are at imminent risk of exam debarment. Please meet with your course instructor immediately to discuss remedial lectures or submit official medical excuses.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Classes Conducted"
          value={stats.totalConducted}
          subtitle="Total lecture sessions"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Classes Attended"
          value={stats.presentCount}
          subtitle={`Full credit presence`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Classes Missed"
          value={stats.absentCount}
          subtitle="Zero credit absences"
          icon={XCircle}
          color="rose"
        />
        <StatsCard
          title="Late Arrivals"
          value={stats.lateCount}
          subtitle="Credited at 50% weight"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Attendance Calculation Rule Note */}
      <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold">Official College Attendance Rule:</span> Attendance Percentage = <code>(Effective Attended / Total Conducted) × 100</code>. A status of <span className="font-bold text-emerald-700">Present</span> grants 1.0 credit, while <span className="font-bold text-amber-700">Late</span> grants 0.5 credit. Absences carry 0 credit. Minimum requirement for semester exam eligibility is <span className="font-bold">{threshold}%</span>.
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Subject-Wise Attendance Breakdown</h3>
          </div>
          <span className="text-xs text-slate-500">Live Course Eligibility</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5">Course Code</th>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5 text-center">Conducted</th>
                <th className="px-6 py-3.5 text-center">Present</th>
                <th className="px-6 py-3.5 text-center">Absent</th>
                <th className="px-6 py-3.5 text-center">Late</th>
                <th className="px-6 py-3.5">Attendance Progress</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.subjectWise?.map((sub) => {
                const isShort = sub.percentage < threshold;

                return (
                  <tr key={sub.subjectId} className={`hover:bg-slate-50/60 transition-colors ${
                    isShort ? 'bg-rose-50/30' : ''
                  }`}>
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      {sub.subjectCode}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {sub.subjectName}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{sub.total}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{sub.present}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-600">{sub.absent}</td>
                    <td className="px-6 py-4 text-center font-bold text-amber-600">{sub.late}</td>
                    <td className="px-6 py-4 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-[11px]">
                          <span className={isShort ? 'text-rose-600' : 'text-slate-700'}>{sub.percentage}%</span>
                          <span className="text-slate-400 font-normal">Min: {threshold}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isShort
                                ? 'bg-rose-500'
                                : sub.percentage >= 85
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AttendancePercentageBadge percentage={sub.percentage} threshold={threshold} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Monthly Attendance Graph & Recent History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Attendance Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Monthly Attendance Rate</h3>
                <p className="text-xs text-slate-500">Your presence trend across academic months</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                Semester 6
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target requirement: {threshold}%</span>
            <span className="font-semibold text-slate-700">Calculated from Cloud Firestore</span>
          </div>
        </div>

        {/* Recent Attendance History Feed */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Attendance Logs</h3>
              <p className="text-xs text-slate-500">Your individual session marks</p>
            </div>
            <History className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {stats.recentHistory?.map((rec, idx) => (
              <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl flex items-center justify-between transition-colors border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono">
                    <span className="text-xs font-bold text-slate-800 block">{rec.date}</span>
                    <span className="text-[10px] text-slate-400">{rec.subjectCode}</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{rec.subjectName}</h5>
                    <p className="text-[11px] text-slate-500">Instructor: {rec.teacherName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={rec.status} />
                  {rec.remarks && (
                    <span className="text-[10px] text-slate-400 italic hidden sm:inline">({rec.remarks})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
