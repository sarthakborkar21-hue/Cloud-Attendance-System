import React from 'react';

export function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const style = styles[role?.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}>
      {role || 'User'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-blue-50 text-blue-700 border-blue-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const style = styles[status?.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}

export function AttendancePercentageBadge({ percentage, threshold = 75 }) {
  const isLow = percentage < threshold;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
        isLow
          ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
          : percentage >= 85
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-blue-100 text-blue-700 border border-blue-200'
      }`}
    >
      {percentage}%
      {isLow && <span className="text-[10px] uppercase tracking-wider font-extrabold ml-0.5">Warning</span>}
    </span>
  );
}
