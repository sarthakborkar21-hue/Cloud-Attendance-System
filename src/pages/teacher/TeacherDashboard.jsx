import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherStats } from '../../firebase/dbService';
import StatsCard from '../../components/common/StatsCard';
import Alert from '../../components/common/Alert';
import {
  CalendarCheck,
  History,
  Layers,
  BookOpen,
  Users,
  Percent,
  ArrowRight,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export default function TeacherDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await getTeacherStats(
          userProfile?.teacherId
        );
        setStats(data);
      } catch (err) {
        console.error('Error loading teacher stats:', err);
        setError(`Unable to load teacher assignments: ${err.message}`);
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
    return <Alert type="danger" message={error || 'Teacher data is unavailable.'} />;
  }

  const teacherName = stats.teacher?.name || userProfile?.displayName || 'Faculty Member';

  return (
    <div className="space-y-8">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Faculty Academic Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {teacherName}
          </h1>
          <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
            Department of {stats.teacher?.department || 'Computer Science & Engineering'} • Ready to mark or inspect attendance records for your designated batches.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <Link
            to="/teacher/mark"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
          >
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/teacher/history"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold border border-white/20 transition-all"
          >
            <History className="w-4 h-4" />
            <span>Session Logs</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Classes"
          value={stats.assignedClasses?.length || 0}
          subtitle="Cohort batches"
          icon={Layers}
          color="blue"
        />
        <StatsCard
          title="Courses Taught"
          value={stats.assignedSubjects?.length || 0}
          subtitle="Curriculum subjects"
          icon={BookOpen}
          color="indigo"
        />
        <StatsCard
          title="Sessions Logged"
          value={stats.totalSessionsConducted}
          subtitle="Attendance sessions"
          icon={ClipboardList}
          color="purple"
        />
        <StatsCard
          title="Average Attendance"
          value={`${stats.averageAttendance}%`}
          subtitle="Student presence rate"
          icon={Percent}
          color="emerald"
          trend="Healthy"
          trendType="up"
        />
      </div>

      {/* Main Grid: Assigned Subjects & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Assigned Courses List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Your Teaching Assignments</h3>
                <p className="text-xs text-slate-500">Classes and subjects under your supervision</p>
              </div>
              <BookOpen className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-3">
              {stats.assignedSubjects?.map((sub, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-xl transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded text-xs">
                      {sub.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded">
                      {sub.className || 'CS-3A'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{sub.name}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{sub.credits} Credits • {sub.department}</span>
                    <Link
                      to={`/teacher/mark?classId=${sub.classId}&subjectId=${sub.id}`}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Mark <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/teacher/mark"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              <span>Start Attendance Session for Today</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Attendance Sessions Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Your Recent Attendance Logs</h3>
              <p className="text-xs text-slate-500">History of lecture attendance recorded by you</p>
            </div>
            <Link
              to="/teacher/history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Course</th>
                  <th className="py-2.5">Batch</th>
                  <th className="py-2.5 text-center">Present</th>
                  <th className="py-2.5 text-center">Absent</th>
                  <th className="py-2.5 text-center">Late</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats.recentSessions?.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 font-semibold text-slate-900">{s.date}</td>
                    <td className="py-3">
                      <span className="font-bold text-slate-800">{s.subjectCode}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">{s.className}</span>
                    </td>
                    <td className="py-3 text-center font-bold text-emerald-600">{s.presentCount}</td>
                    <td className="py-3 text-center font-bold text-rose-600">{s.absentCount}</td>
                    <td className="py-3 text-center font-bold text-amber-600">{s.lateCount}</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/teacher/mark?sessionId=${s.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
