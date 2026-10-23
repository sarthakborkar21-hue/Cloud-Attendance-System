import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getClasses,
  getSubjects,
  getStudents,
  checkDuplicateSession,
  getAttendanceRecords,
  saveAttendanceSession
} from '../../firebase/dbService';
import Alert from '../../components/common/Alert';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  AlertTriangle,
  History,
  Layers,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, userRole, isFirebaseConfigured } = useAuth();

  // Selection Filters
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get('subjectId') || '');
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 10:00 AM');
  const [sessionRemarks, setSessionRemarks] = useState('');

  // Attendance State
  const [students, setStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({}); // { [studentId]: { status: 'Present'|'Absent'|'Late', remarks: '' } }
  
  // Existing Session / Duplicate Detection
  const [existingSession, setExistingSession] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // 1. Initial Load of Classes and Subjects
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [clsList, subList] = await Promise.all([
          getClasses(),
          getSubjects()
        ]);
        setClasses(clsList);
        setSubjects(subList);

        const initialClass = searchParams.get('classId') || clsList[0]?.id || '';
        setSelectedClassId(initialClass);

        const matchingSubs = subList.filter(s => !initialClass || s.classId === initialClass);
        const initialSub = searchParams.get('subjectId') || matchingSubs[0]?.id || subList[0]?.id || '';
        setSelectedSubjectId(initialSub);
      } catch (err) {
        console.error('Error loading metadata:', err);
        setAlert({ type: 'danger', message: `Unable to load attendance metadata: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams]);

  // 2. Whenever Class, Subject, or Date changes, fetch students and check for duplicate session
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return;

    async function loadStudentsAndCheckSession() {
      try {
        // Fetch students enrolled in this class
        const stuList = await getStudents(selectedClassId);
        setStudents(stuList);

        // Check for duplicate attendance session
        const duplicate = await checkDuplicateSession(selectedClassId, selectedSubjectId, selectedDate);

        if (duplicate) {
          setExistingSession(duplicate);
          setIsEditMode(true);
          setSessionRemarks(duplicate.remarks || '');
          if (duplicate.slot) setSelectedSlot(duplicate.slot);

          // Load previous student records for this session
          const records = await getAttendanceRecords({ sessionId: duplicate.id });
          const statusMap = {};
          
          stuList.forEach(stu => {
            const rec = records.find(r => r.studentId === stu.id);
            statusMap[stu.id] = {
              status: rec ? rec.status : 'Present',
              remarks: rec ? rec.remarks || '' : '',
              recordId: rec ? rec.id : null
            };
          });

          setStudentStatuses(statusMap);
        } else {
          // No duplicate session: Fresh session with default "Present"
          setExistingSession(null);
          setIsEditMode(false);
          setSessionRemarks('');

          const defaultStatus = {};
          stuList.forEach(stu => {
            defaultStatus[stu.id] = { status: 'Present', remarks: '', recordId: null };
          });
          setStudentStatuses(defaultStatus);
        }
      } catch (err) {
        console.error('Error checking duplicate session:', err);
        setAlert({ type: 'danger', message: `Unable to load class attendance: ${err.message}` });
      }
    }

    loadStudentsAndCheckSession();
  }, [selectedClassId, selectedSubjectId, selectedDate]);

  // When class changes, update subject dropdown appropriately
  const handleClassChange = (e) => {
    const newClassId = e.target.value;
    setSelectedClassId(newClassId);

    const relevant = subjects.filter(s => s.classId === newClassId);
    if (relevant.length > 0) {
      setSelectedSubjectId(relevant[0].id);
    }
  };

  // Status toggle handler
  const handleStatusChange = (studentId, status) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleStudentRemarkChange = (studentId, remark) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remark
      }
    }));
  };

  // Quick Mass Actions
  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = {
        ...studentStatuses[s.id],
        status
      };
    });
    setStudentStatuses(updated);
  };

  // Calculate live statistics
  const counts = Object.values(studentStatuses).reduce(
    (acc, curr) => {
      if (curr.status === 'Present') acc.present++;
      else if (curr.status === 'Absent') acc.absent++;
      else if (curr.status === 'Late') acc.late++;
      return acc;
    },
    { present: 0, absent: 0, late: 0 }
  );

  const totalStudents = students.length;
  const attendanceRate = totalStudents > 0 
    ? Math.round(((counts.present + counts.late * 0.5) / totalStudents) * 100)
    : 0;
  const cannotEditSession = userRole === 'teacher'
    && existingSession
    && existingSession.teacherId !== userProfile?.teacherId;

  // Submit to Firestore
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (students.length === 0) {
      setAlert({ type: 'danger', message: 'No students enrolled in this class to record attendance.' });
      return;
    }
    if (cannotEditSession) {
      setAlert({ type: 'danger', message: 'Only the teacher who recorded this session or an administrator can update it.' });
      return;
    }

    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      const clsObj = classes.find(c => c.id === selectedClassId);
      const subObj = subjects.find(s => s.id === selectedSubjectId);

      const sessionData = {
        id: existingSession ? existingSession.id : undefined,
        classId: selectedClassId,
        className: clsObj?.name || 'CS-3A',
        subjectId: selectedSubjectId,
        subjectCode: subObj?.code || 'CS301',
        subjectName: subObj?.name || 'Cloud Computing',
        teacherId: userProfile?.teacherId || currentUser?.uid,
        teacherName: userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Faculty Member',
        date: selectedDate,
        slot: selectedSlot,
        room: clsObj?.room || 'Lab 302',
        remarks: sessionRemarks,
        createdAt: existingSession ? existingSession.createdAt : new Date().toISOString()
      };

      const recordList = students.map(stu => {
        const cur = studentStatuses[stu.id] || { status: 'Present', remarks: '' };
        return {
          id: cur.recordId || undefined,
          studentId: stu.id,
          studentName: stu.name,
          studentRoll: stu.rollNumber,
          studentEmail: stu.email,
          status: cur.status,
          remarks: cur.remarks
        };
      });

      const result = await saveAttendanceSession(sessionData, recordList);

      setExistingSession(result.session);
      setIsEditMode(true);
      setAlert({
        type: 'success',
        message: isFirebaseConfigured
          ? `Attendance was saved to Firestore for ${clsObj?.name} - ${subObj?.code} on ${selectedDate}.`
          : `Attendance was saved in Local Demo Mode for ${clsObj?.name} - ${subObj?.code} on ${selectedDate}.`
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to save attendance: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Filtered subjects for current class
  const classSubjects = subjects.filter(s => !selectedClassId || s.classId === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mark Lecture Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select course session details, mark student presence, and save the attendance record.
          </p>
        </div>

        <Link
          to="/teacher/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <History className="w-3.5 h-3.5" />
          <span>View Session Logs</span>
        </Link>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Duplicate Session Notification Banner */}
      {isEditMode && existingSession && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-900">
            <h4 className="font-bold text-sm mb-0.5">Existing Attendance Session Detected</h4>
            <p className="leading-relaxed">
              Attendance for <span className="font-bold">{existingSession.className}</span> - <span className="font-bold">{existingSession.subjectCode}</span> on <span className="font-bold">{existingSession.date}</span> has already been saved (Recorded by {existingSession.teacherName}).
              {cannotEditSession
                ? 'This session is read-only for your account. Only its recording teacher or an administrator can update it.'
                : <>You are currently in <span className="font-bold uppercase tracking-wider text-amber-800">Edit / Update Mode</span>. Saving will update the existing records.</>}
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Session Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <span>1. Lecture Session Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Class Batch *</span>
            </label>
            <select
              value={selectedClassId}
              onChange={handleClassChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.department}</option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Subject Course *</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {(classSubjects.length > 0 ? classSubjects : subjects).map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Attendance Date *</span>
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Slot */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Slot / Period</span>
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="09:00 - 10:00 AM">09:00 - 10:00 AM (Slot 1)</option>
              <option value="10:00 - 11:00 AM">10:00 - 11:00 AM (Slot 2)</option>
              <option value="11:15 - 12:15 PM">11:15 - 12:15 PM (Slot 3)</option>
              <option value="01:00 - 02:00 PM">01:00 - 02:00 PM (Slot 4)</option>
              <option value="02:00 - 03:00 PM">02:00 - 03:00 PM (Slot 5)</option>
              <option value="03:15 - 04:15 PM">03:15 - 04:15 PM (Slot 6)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Session Remarks / Lecture Topic</label>
          <input
            type="text"
            value={sessionRemarks}
            onChange={(e) => setSessionRemarks(e.target.value)}
            placeholder="e.g. Unit 3: Cloud Virtualization & Hypervisors Lab Demo"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Step 2: Live Summary & Mass Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Counter Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
            Total Students: <span className="text-sm font-extrabold">{totalStudents}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Present: <span className="text-sm font-extrabold">{counts.present}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            Absent: <span className="text-sm font-extrabold">{counts.absent}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold">
            Late: <span className="text-sm font-extrabold">{counts.late}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            Presence Rate: <span className="text-sm font-extrabold">{attendanceRate}%</span>
          </div>
        </div>

        {/* Mass Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAll('Present')}
            disabled={cannotEditSession}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll('Absent')}
            disabled={cannotEditSession}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Step 3: Interactive Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Student Attendance Roster</h3>
          </div>
          <span className="text-xs text-slate-500">Toggle status for each student below</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Details</th>
                <th className="px-6 py-3.5 text-center">Attendance Status</th>
                <th className="px-6 py-3.5">Individual Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map((stu) => {
                  const currentStatus = studentStatuses[stu.id]?.status || 'Present';
                  const currentRemarks = studentStatuses[stu.id]?.remarks || '';

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {stu.rollNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{stu.name}</div>
                        <div className="text-[11px] text-slate-400">{stu.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Present Toggle */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(stu.id, 'Present')}
                            disabled={cannotEditSession}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          {/* Absent Toggle */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(stu.id, 'Absent')}
                            disabled={cannotEditSession}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          {/* Late Toggle */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(stu.id, 'Late')}
                            disabled={cannotEditSession}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              currentStatus === 'Late'
                                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          disabled={cannotEditSession}
                          value={currentRemarks}
                          onChange={(e) => handleStudentRemarkChange(stu.id, e.target.value)}
                          placeholder="Optional note..."
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No students currently enrolled in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Submit Button */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {isFirebaseConfigured
              ? 'The session and its student records are committed together to Firestore.'
              : 'The session and student records are saved in Local Demo Mode.'}
          </p>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0 || cannotEditSession}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{cannotEditSession ? 'Session is Read Only' : isEditMode ? 'Update Attendance Session' : 'Save Attendance'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
