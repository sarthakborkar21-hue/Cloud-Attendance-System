import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getAttendanceSessions, 
  getAttendanceRecords, 
  getClasses, 
  getSubjects,
  deleteAttendanceSession 
} from '../../firebase/dbService';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { StatusBadge } from '../../components/common/Badge';
import {
  History,
  Filter,
  Calendar,
  Layers,
  BookOpen,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export default function AttendanceHistory() {
  const { userRole, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // Session Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sesList, clsList, subList] = await Promise.all([
        getAttendanceSessions(),
        getClasses(),
        getSubjects()
      ]);
      setSessions(sesList);
      setClasses(clsList);
      setSubjects(subList);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setAlert({ type: 'danger', message: `Unable to load attendance history: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Sessions
  const filteredSessions = sessions.filter(s => {
    if (filterClass !== 'ALL' && s.classId !== filterClass) return false;
    if (filterSubject !== 'ALL' && s.subjectId !== filterSubject) return false;
    if (filterDate && s.date !== filterDate) return false;
    return true;
  });

  const openSessionDetails = async (session) => {
    setActiveSession(session);
    setIsDetailModalOpen(true);
    setLoadingRecords(true);
    try {
      const records = await getAttendanceRecords({ sessionId: session.id });
      setSessionRecords(records);
    } catch (err) {
      console.error('Error loading session records:', err);
      setAlert({ type: 'danger', message: `Unable to load session records: ${err.message}` });
    } finally {
      setLoadingRecords(false);
    }
  };

  const promptDeleteSession = (session) => {
    setSessionToDelete(session);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteAttendanceSession(sessionToDelete.id);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      setAlert({ type: 'success', message: 'Attendance session deleted successfully.' });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to delete session: ${err.message}` });
    } finally {
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const columns = [
    {
      header: 'Lecture Date',
      accessor: 'date',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {row.date}
        </span>
      )
    },
    {
      header: 'Course',
      accessor: 'subjectCode',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
            {row.subjectCode}
          </span>
          <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{row.subjectName}</p>
        </div>
      )
    },
    {
      header: 'Class Batch',
      accessor: 'className',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
          {row.className}
        </span>
      )
    },
    {
      header: 'Faculty Member',
      accessor: 'teacherName',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-700 font-medium">{row.teacherName}</span>
    },
    {
      header: 'Present / Total',
      accessor: 'presentCount',
      cell: (row) => {
        const total = row.totalCount || 0;
        const p = row.presentCount || 0;
        const l = row.lateCount || 0;
        const effective = p + l * 0.5;
        const pct = total > 0 ? Math.round((effective / total) * 100) : 0;

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">{p} / {total}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              pct >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {pct}%
            </span>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openSessionDetails(row)}
            title="Inspect Records"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {(userRole === 'admin' || (
            userRole === 'teacher' && row.teacherId === userProfile?.teacherId
          )) && (
            <Link
              to={`/teacher/mark?classId=${row.classId}&subjectId=${row.subjectId}&date=${row.date}`}
              title="Edit Attendance Session"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </Link>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => promptDeleteSession(row)}
              title="Delete Session"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Session History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Query past lectures, inspect individual student marks, and update authorized logs.
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'teacher') && (
          <Link
            to="/teacher/mark"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>Mark New Session</span>
          </Link>
        )}
      </div>

      {alert.message && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ type: '', message: '' })} 
        />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 self-start md:self-center">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters:</span>
        </div>

        {/* Class Filter */}
        <div className="w-full md:w-48">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="w-full md:w-56">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-full md:w-44">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Sessions DataTable */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        searchKey="subjectCode"
        searchPlaceholder="Search by subject code, teacher, or class..."
        itemsPerPage={10}
        emptyMessage="No attendance sessions found matching the filter criteria."
      />

      {/* Session Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={activeSession ? `Session Log: ${activeSession.className} - ${activeSession.subjectCode}` : 'Session Details'}
        maxWidth="max-w-3xl"
      >
        {activeSession && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Subject & Topic</span>
                <span className="font-bold text-slate-800 text-sm">{activeSession.subjectName} ({activeSession.subjectCode})</span>
                {activeSession.remarks && (
                  <p className="text-slate-500 mt-0.5 italic">{activeSession.remarks}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  <span className="block font-bold">{activeSession.presentCount}</span>
                  <span className="text-[10px]">Present</span>
                </div>
                <div className="text-center px-3 py-1 bg-rose-100 text-rose-800 rounded-lg">
                  <span className="block font-bold">{activeSession.absentCount}</span>
                  <span className="text-[10px]">Absent</span>
                </div>
                <div className="text-center px-3 py-1 bg-amber-100 text-amber-800 rounded-lg">
                  <span className="block font-bold">{activeSession.lateCount}</span>
                  <span className="text-[10px]">Late</span>
                </div>
              </div>
            </div>

            {/* Individual Student Records */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Student Attendance List</h4>
              {loadingRecords ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading records from Firestore...</div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                        <th className="px-4 py-2.5">Roll No</th>
                        <th className="px-4 py-2.5">Student Name</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionRecords.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2 font-mono font-bold text-blue-700">{r.studentRoll}</td>
                          <td className="px-4 py-2 font-medium text-slate-800">{r.studentName}</td>
                          <td className="px-4 py-2 text-center">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-2 text-slate-500">{r.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">Date: {activeSession.date} • Recorded by {activeSession.teacherName}</span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/teacher/mark?classId=${activeSession.classId}&subjectId=${activeSession.subjectId}&date=${activeSession.date}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Edit This Session
                </Link>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Session Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to permanently delete this attendance session for <span className="font-bold">{sessionToDelete?.className}</span> ({sessionToDelete?.subjectCode}) on <span className="font-bold">{sessionToDelete?.date}</span>? All individual student marks for this session will be removed.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteSession}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
            >
              Delete Session
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
