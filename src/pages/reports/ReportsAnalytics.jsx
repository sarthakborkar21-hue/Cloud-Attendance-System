import React, { useState, useEffect, useMemo } from 'react';
import {
  getAttendanceSessions,
  getAttendanceRecords,
  getStudents,
  getClasses,
  getSubjects,
  getSettings
} from '../../firebase/dbService';
import { exportToCSV } from '../../utils/exportCsv';
import DataTable from '../../components/common/DataTable';
import StatsCard from '../../components/common/StatsCard';
import Alert from '../../components/common/Alert';
import { AttendancePercentageBadge, StatusBadge } from '../../components/common/Badge';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Layers,
  BookOpen,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Printer
} from 'lucide-react';

export default function ReportsAnalytics() {
  const [reportType, setReportType] = useState('student'); // 'student' | 'subject' | 'daily' | 'monthly' | 'class'
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sesList, recList, stuList, clsList, subList, setObj] = await Promise.all([
          getAttendanceSessions(),
          getAttendanceRecords(),
          getStudents(),
          getClasses(),
          getSubjects(),
          getSettings()
        ]);
        setSessions(sesList);
        setRecords(recList);
        setStudents(stuList);
        setClasses(clsList);
        setSubjects(subList);
        setSettings(setObj);
      } catch (err) {
        console.error('Error loading report datasets:', err);
        setError(`Unable to load reports: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const lateWeight = settings?.lateAttendanceWeight ?? 0.5;
  const threshold = settings?.attendanceThreshold || 75;

  // Filtered records based on active toolbar
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterClass !== 'ALL' && r.classId !== filterClass) return false;
      if (filterSubject !== 'ALL' && r.subjectId !== filterSubject) return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }, [records, filterClass, filterSubject, startDate, endDate]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (filterClass !== 'ALL' && s.classId !== filterClass) return false;
      if (filterSubject !== 'ALL' && s.subjectId !== filterSubject) return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });
  }, [sessions, filterClass, filterSubject, startDate, endDate]);

  // 1. Student-Wise Report Data
  const studentReportData = useMemo(() => {
    const studentMap = {};

    // Initialize all students in scope
    students.forEach(stu => {
      if (filterClass !== 'ALL' && stu.classId !== filterClass) return;
      studentMap[stu.id] = {
        id: stu.id,
        rollNumber: stu.rollNumber,
        name: stu.name,
        className: stu.className,
        email: stu.email,
        totalConducted: 0,
        present: 0,
        absent: 0,
        late: 0,
        effectiveAttended: 0
      };
    });

    filteredRecords.forEach(r => {
      if (!studentMap[r.studentId]) return;
      const item = studentMap[r.studentId];
      item.totalConducted++;
      if (r.status === 'Present') {
        item.present++;
        item.effectiveAttended += 1;
      } else if (r.status === 'Absent') {
        item.absent++;
      } else if (r.status === 'Late') {
        item.late++;
        item.effectiveAttended += lateWeight;
      }
    });

    return Object.values(studentMap).map(s => {
      const pct = s.totalConducted > 0 
        ? Math.round((s.effectiveAttended / s.totalConducted) * 100)
        : 100;
      return {
        ...s,
        percentage: pct,
        isDebarred: pct < threshold
      };
    });
  }, [students, filteredRecords, filterClass, lateWeight, threshold]);

  // 2. Subject-Wise Report Data
  const subjectReportData = useMemo(() => {
    const subMap = {};

    subjects.forEach(sub => {
      if (filterClass !== 'ALL' && sub.classId !== filterClass) return;
      if (filterSubject !== 'ALL' && sub.id !== filterSubject) return;

      subMap[sub.id] = {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        className: sub.className,
        teacherName: sub.teacherName,
        totalSessions: 0,
        totalStudentRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        effectiveAttended: 0
      };
    });

    filteredSessions.forEach(s => {
      if (subMap[s.subjectId]) {
        subMap[s.subjectId].totalSessions++;
      }
    });

    filteredRecords.forEach(r => {
      if (!subMap[r.subjectId]) return;
      const item = subMap[r.subjectId];
      item.totalStudentRecords++;
      if (r.status === 'Present') {
        item.present++;
        item.effectiveAttended += 1;
      } else if (r.status === 'Absent') {
        item.absent++;
      } else if (r.status === 'Late') {
        item.late++;
        item.effectiveAttended += lateWeight;
      }
    });

    return Object.values(subMap).map(s => {
      const pct = s.totalStudentRecords > 0 
        ? Math.round((s.effectiveAttended / s.totalStudentRecords) * 100)
        : 0;
      return {
        ...s,
        percentage: pct
      };
    });
  }, [subjects, filteredSessions, filteredRecords, filterClass, filterSubject, lateWeight]);

  // 3. Daily Report Data
  const dailyReportData = useMemo(() => {
    return filteredSessions.map(s => {
      const total = s.totalCount || 0;
      const effective = (s.presentCount || 0) + (s.lateCount || 0) * lateWeight;
      const pct = total > 0 ? Math.round((effective / total) * 100) : 0;
      return {
        ...s,
        percentage: pct
      };
    });
  }, [filteredSessions, lateWeight]);

  // 4. Monthly Report Data
  const monthlyReportData = useMemo(() => {
    const monthMap = {};

    filteredRecords.forEach(r => {
      const m = r.date ? r.date.substring(0, 7) : '2024-10';
      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          effectiveAttended: 0
        };
      }
      monthMap[m].totalRecords++;
      if (r.status === 'Present') {
        monthMap[m].present++;
        monthMap[m].effectiveAttended += 1;
      } else if (r.status === 'Absent') {
        monthMap[m].absent++;
      } else if (r.status === 'Late') {
        monthMap[m].late++;
        monthMap[m].effectiveAttended += lateWeight;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
      const pct = m.totalRecords > 0 
        ? Math.round((m.effectiveAttended / m.totalRecords) * 100)
        : 0;
      return {
        ...m,
        percentage: pct
      };
    });
  }, [filteredRecords, lateWeight]);

  // 5. Class-Wise Report Data
  const classReportData = useMemo(() => {
    const clsMap = {};

    classes.forEach(c => {
      if (filterClass !== 'ALL' && c.id !== filterClass) return;
      const countStudents = students.filter(s => s.classId === c.id).length;
      clsMap[c.id] = {
        id: c.id,
        name: c.name,
        department: c.department,
        semester: c.semester,
        studentCount: countStudents,
        totalSessions: 0,
        totalRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        effectiveAttended: 0
      };
    });

    filteredSessions.forEach(s => {
      if (clsMap[s.classId]) {
        clsMap[s.classId].totalSessions++;
      }
    });

    filteredRecords.forEach(r => {
      if (!clsMap[r.classId]) return;
      const item = clsMap[r.classId];
      item.totalRecords++;
      if (r.status === 'Present') {
        item.present++;
        item.effectiveAttended += 1;
      } else if (r.status === 'Absent') {
        item.absent++;
      } else if (r.status === 'Late') {
        item.late++;
        item.effectiveAttended += lateWeight;
      }
    });

    return Object.values(clsMap).map(c => {
      const pct = c.totalRecords > 0 
        ? Math.round((c.effectiveAttended / c.totalRecords) * 100)
        : 0;
      return {
        ...c,
        percentage: pct
      };
    });
  }, [classes, students, filteredSessions, filteredRecords, filterClass, lateWeight]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let exportData = [];
    let filename = `attendance_${reportType}_report_${new Date().toISOString().split('T')[0]}`;

    if (reportType === 'student') {
      exportData = studentReportData.map(s => ({
        'Roll Number': s.rollNumber,
        'Student Name': s.name,
        'Class': s.className,
        'Total Classes': s.totalConducted,
        'Present': s.present,
        'Absent': s.absent,
        'Late': s.late,
        'Attendance %': `${s.percentage}%`,
        'Debarment Risk (<75%)': s.isDebarred ? 'YES - AT RISK' : 'NO'
      }));
    } else if (reportType === 'subject') {
      exportData = subjectReportData.map(s => ({
        'Subject Code': s.code,
        'Subject Name': s.name,
        'Class': s.className,
        'Instructor': s.teacherName,
        'Sessions Conducted': s.totalSessions,
        'Total Attendance Marks': s.totalStudentRecords,
        'Present': s.present,
        'Absent': s.absent,
        'Late': s.late,
        'Average Attendance %': `${s.percentage}%`
      }));
    } else if (reportType === 'daily') {
      exportData = dailyReportData.map(d => ({
        'Date': d.date,
        'Class': d.className,
        'Subject Code': d.subjectCode,
        'Subject Name': d.subjectName,
        'Slot': d.slot || 'N/A',
        'Instructor': d.teacherName,
        'Total Students': d.totalCount,
        'Present': d.presentCount,
        'Absent': d.absentCount,
        'Late': d.lateCount,
        'Attendance %': `${d.percentage}%`
      }));
    } else if (reportType === 'monthly') {
      exportData = monthlyReportData.map(m => ({
        'Month': m.month,
        'Total Marks Recorded': m.totalRecords,
        'Present': m.present,
        'Absent': m.absent,
        'Late': m.late,
        'Monthly Attendance %': `${m.percentage}%`
      }));
    } else if (reportType === 'class') {
      exportData = classReportData.map(c => ({
        'Class Name': c.name,
        'Department': c.department,
        'Semester': c.semester,
        'Enrolled Students': c.studentCount,
        'Total Sessions': c.totalSessions,
        'Total Marks': c.totalRecords,
        'Overall Attendance %': `${c.percentage}%`
      }));
    }

    exportToCSV(exportData, filename);
  };

  // Compute top overview metrics
  let totalPresence = 0;
  let totalAbsence = 0;
  let totalLates = 0;
  let effectiveScore = 0;

  filteredRecords.forEach(r => {
    if (r.status === 'Present') {
      totalPresence++;
      effectiveScore += 1;
    } else if (r.status === 'Absent') {
      totalAbsence++;
    } else if (r.status === 'Late') {
      totalLates++;
      effectiveScore += lateWeight;
    }
  });

  const scopePercentage = filteredRecords.length > 0 
    ? Math.round((effectiveScore / filteredRecords.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Institutional attendance summaries, compliance verification, and instant CSV generation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all no-print"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all no-print"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'student', label: 'Student-Wise Report' },
          { id: 'subject', label: 'Subject-Wise Report' },
          { id: 'daily', label: 'Daily Session Report' },
          { id: 'monthly', label: 'Monthly Summary' },
          { id: 'class', label: 'Class / Batch Report' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              reportType === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Lectures"
          value={filteredSessions.length}
          subtitle="In selected scope"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Total Student Records"
          value={filteredRecords.length}
          subtitle="Individual marks"
          icon={FileSpreadsheet}
          color="indigo"
        />
        <StatsCard
          title="Present Marks"
          value={totalPresence}
          subtitle="Full attendance"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Absent Marks"
          value={totalAbsence}
          subtitle="Missed lectures"
          icon={XCircle}
          color="rose"
        />
        <StatsCard
          title="Average Attendance"
          value={`${scopePercentage}%`}
          subtitle={`Debarment standard: ${threshold}%`}
          icon={Percent}
          color={scopePercentage >= threshold ? 'emerald' : 'rose'}
          trend={scopePercentage >= threshold ? 'Eligible' : 'Warning'}
          trendType={scopePercentage >= threshold ? 'up' : 'down'}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 self-start md:self-center">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Report Scope Filters:</span>
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

        {/* Date Ranges */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start date"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End date"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Reset Dates
          </button>
        )}
      </div>

      {/* Render Dynamic Table based on reportType */}
      {reportType === 'student' && (
        <DataTable
          columns={[
            {
              header: 'Roll No',
              accessor: 'rollNumber',
              sortable: true,
              cell: (row) => (
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {row.rollNumber}
                </span>
              )
            },
            {
              header: 'Student Name',
              accessor: 'name',
              sortable: true,
              cell: (row) => (
                <div>
                  <span className="font-bold text-slate-800 text-xs block">{row.name}</span>
                  <span className="text-[11px] text-slate-400">{row.email}</span>
                </div>
              )
            },
            {
              header: 'Class',
              accessor: 'className',
              sortable: true,
              cell: (row) => <span className="font-semibold text-xs text-slate-700">{row.className}</span>
            },
            {
              header: 'Conducted',
              accessor: 'totalConducted',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.totalConducted}</span>
            },
            {
              header: 'Present',
              accessor: 'present',
              sortable: true,
              cell: (row) => <span className="font-bold text-emerald-600">{row.present}</span>
            },
            {
              header: 'Absent',
              accessor: 'absent',
              sortable: true,
              cell: (row) => <span className="font-bold text-rose-600">{row.absent}</span>
            },
            {
              header: 'Late',
              accessor: 'late',
              sortable: true,
              cell: (row) => <span className="font-bold text-amber-600">{row.late}</span>
            },
            {
              header: 'Attendance %',
              accessor: 'percentage',
              sortable: true,
              cell: (row) => (
                <AttendancePercentageBadge percentage={row.percentage} threshold={threshold} />
              )
            },
            {
              header: 'Eligibility Status',
              accessor: 'isDebarred',
              cell: (row) => row.isDebarred ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  Risk of Debarment
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Eligible for Exams
                </span>
              )
            }
          ]}
          data={studentReportData}
          searchKey="name"
          searchPlaceholder="Search student by name or roll no..."
          itemsPerPage={10}
          emptyMessage="No student attendance data found."
        />
      )}

      {reportType === 'subject' && (
        <DataTable
          columns={[
            {
              header: 'Course Code',
              accessor: 'code',
              sortable: true,
              cell: (row) => (
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {row.code}
                </span>
              )
            },
            {
              header: 'Subject Name',
              accessor: 'name',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800 text-xs">{row.name}</span>
            },
            {
              header: 'Class',
              accessor: 'className',
              sortable: true,
              cell: (row) => <span className="font-semibold text-xs text-slate-700">{row.className}</span>
            },
            {
              header: 'Instructor',
              accessor: 'teacherName',
              sortable: true,
              cell: (row) => <span className="text-xs text-slate-700 font-medium">{row.teacherName}</span>
            },
            {
              header: 'Sessions',
              accessor: 'totalSessions',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.totalSessions}</span>
            },
            {
              header: 'Total Marks',
              accessor: 'totalStudentRecords',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.totalStudentRecords}</span>
            },
            {
              header: 'Present',
              accessor: 'present',
              sortable: true,
              cell: (row) => <span className="font-bold text-emerald-600">{row.present}</span>
            },
            {
              header: 'Absent',
              accessor: 'absent',
              sortable: true,
              cell: (row) => <span className="font-bold text-rose-600">{row.absent}</span>
            },
            {
              header: 'Late',
              accessor: 'late',
              sortable: true,
              cell: (row) => <span className="font-bold text-amber-600">{row.late}</span>
            },
            {
              header: 'Avg Rate %',
              accessor: 'percentage',
              sortable: true,
              cell: (row) => (
                <AttendancePercentageBadge percentage={row.percentage} threshold={threshold} />
              )
            }
          ]}
          data={subjectReportData}
          searchKey="name"
          searchPlaceholder="Search subject by code or name..."
          itemsPerPage={10}
          emptyMessage="No subject attendance records found."
        />
      )}

      {reportType === 'daily' && (
        <DataTable
          columns={[
            {
              header: 'Date',
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
              header: 'Class',
              accessor: 'className',
              sortable: true,
              cell: (row) => <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold text-xs">{row.className}</span>
            },
            {
              header: 'Course Code & Name',
              accessor: 'subjectCode',
              sortable: true,
              cell: (row) => (
                <div>
                  <span className="font-bold text-blue-700 text-xs block">{row.subjectCode}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-xs">{row.subjectName}</span>
                </div>
              )
            },
            {
              header: 'Slot / Period',
              accessor: 'slot',
              cell: (row) => <span className="text-xs text-slate-600">{row.slot || 'Regular'}</span>
            },
            {
              header: 'Faculty',
              accessor: 'teacherName',
              sortable: true,
              cell: (row) => <span className="text-xs text-slate-700">{row.teacherName}</span>
            },
            {
              header: 'Present',
              accessor: 'presentCount',
              sortable: true,
              cell: (row) => <span className="font-bold text-emerald-600">{row.presentCount}</span>
            },
            {
              header: 'Absent',
              accessor: 'absentCount',
              sortable: true,
              cell: (row) => <span className="font-bold text-rose-600">{row.absentCount}</span>
            },
            {
              header: 'Late',
              accessor: 'lateCount',
              sortable: true,
              cell: (row) => <span className="font-bold text-amber-600">{row.lateCount}</span>
            },
            {
              header: 'Presence %',
              accessor: 'percentage',
              sortable: true,
              cell: (row) => <AttendancePercentageBadge percentage={row.percentage} threshold={threshold} />
            }
          ]}
          data={dailyReportData}
          searchKey="subjectCode"
          searchPlaceholder="Search daily sessions..."
          itemsPerPage={10}
          emptyMessage="No daily sessions found for the given criteria."
        />
      )}

      {reportType === 'monthly' && (
        <DataTable
          columns={[
            {
              header: 'Calendar Month',
              accessor: 'month',
              sortable: true,
              cell: (row) => (
                <span className="font-bold text-slate-900 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded">
                  {row.month}
                </span>
              )
            },
            {
              header: 'Total Marks Recorded',
              accessor: 'totalRecords',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.totalRecords}</span>
            },
            {
              header: 'Present',
              accessor: 'present',
              sortable: true,
              cell: (row) => <span className="font-bold text-emerald-600">{row.present}</span>
            },
            {
              header: 'Absent',
              accessor: 'absent',
              sortable: true,
              cell: (row) => <span className="font-bold text-rose-600">{row.absent}</span>
            },
            {
              header: 'Late',
              accessor: 'late',
              sortable: true,
              cell: (row) => <span className="font-bold text-amber-600">{row.late}</span>
            },
            {
              header: 'Monthly Attendance %',
              accessor: 'percentage',
              sortable: true,
              cell: (row) => <AttendancePercentageBadge percentage={row.percentage} threshold={threshold} />
            }
          ]}
          data={monthlyReportData}
          searchKey="month"
          searchPlaceholder="Search by month (YYYY-MM)..."
          itemsPerPage={10}
          emptyMessage="No monthly attendance summary available."
        />
      )}

      {reportType === 'class' && (
        <DataTable
          columns={[
            {
              header: 'Class / Section',
              accessor: 'name',
              sortable: true,
              cell: (row) => (
                <span className="font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded font-mono">
                  {row.name}
                </span>
              )
            },
            {
              header: 'Department',
              accessor: 'department',
              sortable: true,
              cell: (row) => <span className="text-xs text-slate-700 font-semibold">{row.department}</span>
            },
            {
              header: 'Semester',
              accessor: 'semester',
              sortable: true,
              cell: (row) => <span className="text-xs text-slate-600">{row.semester}</span>
            },
            {
              header: 'Enrolled Students',
              accessor: 'studentCount',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.studentCount}</span>
            },
            {
              header: 'Sessions Logged',
              accessor: 'totalSessions',
              sortable: true,
              cell: (row) => <span className="font-bold text-slate-800">{row.totalSessions}</span>
            },
            {
              header: 'Present Marks',
              accessor: 'present',
              sortable: true,
              cell: (row) => <span className="font-bold text-emerald-600">{row.present}</span>
            },
            {
              header: 'Absent Marks',
              accessor: 'absent',
              sortable: true,
              cell: (row) => <span className="font-bold text-rose-600">{row.absent}</span>
            },
            {
              header: 'Overall Rate %',
              accessor: 'percentage',
              sortable: true,
              cell: (row) => <AttendancePercentageBadge percentage={row.percentage} threshold={threshold} />
            }
          ]}
          data={classReportData}
          searchKey="name"
          searchPlaceholder="Search classes..."
          itemsPerPage={10}
          emptyMessage="No class attendance data found."
        />
      )}
    </div>
  );
}
