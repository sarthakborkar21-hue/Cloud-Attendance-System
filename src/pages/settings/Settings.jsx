import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, seedInitialDataToCloud } from '../../firebase/dbService';
import { isFirebaseConfigured } from '../../firebase/config';
import Alert from '../../components/common/Alert';
import {
  Settings as SettingsIcon,
  Cloud,
  Database,
  Shield,
  Percent,
  RefreshCw,
  Sparkles,
  Save,
  CheckCircle2,
  HardDrive,
  Info
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    collegeName: 'National Institute of Science & Technology',
    academicYear: '2024-2025',
    attendanceThreshold: 75,
    lateAttendanceWeight: 0.5,
    autoLockDays: 7,
    emailNotifications: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const data = await getSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setAlert({ type: 'danger', message: `Unable to load settings: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      setAlert({ type: 'success', message: 'System configurations updated successfully.' });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to save settings: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('Add any missing sample classes, subjects, faculty, students, and attendance records? Existing data will not be overwritten.')) {
      return;
    }

    setSeeding(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await seedInitialDataToCloud();
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.mode === 'cloud'
            ? `Added ${res.addedCount} missing sample documents to Firestore. Existing documents were left unchanged.`
            : 'Added missing sample data in Local Demo Mode. Existing local data was left unchanged.'
        });
      } else {
        setAlert({
          type: 'warning',
          message: `Local seed completed, but Firestore returned: ${res.error}. Verify your firestore.rules if using live Firebase.`
        });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: `Seeding error: ${err.message}` });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Cloud Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure academic attendance thresholds, late penalties, and cloud database diagnostics.
        </p>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Cloud Integration Diagnostics Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Cloud Database Diagnostics</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            isFirebaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {isFirebaseConfigured ? 'Firebase Configured' : 'Local Demo Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Persistence Engine</span>
            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              {isFirebaseConfigured ? 'Google Cloud Firestore' : 'Browser Local Storage'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Authentication Engine</span>
            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              {isFirebaseConfigured ? 'Firebase Authentication' : 'Local Demo Session'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Optional Sample Data</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
                Manually adds sample records that are missing. Existing records are never overwritten; this does not create accounts or roles.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSeedData}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {seeding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Missing Sample Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Institutional Attendance Policy Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Academic & Attendance Configuration</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name</label>
              <input
                type="text"
                required
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Attendance Threshold (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  max={100}
                  required
                  value={settings.attendanceThreshold}
                  onChange={(e) => setSettings({ ...settings, attendanceThreshold: parseInt(e.target.value) || 75 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Students below this rate are flagged with exam debarment risk.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Late Attendance Credit Policy *
              </label>
              <select
                value={settings.lateAttendanceWeight}
                onChange={(e) => setSettings({ ...settings, lateAttendanceWeight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              >
                <option value={0.5}>0.5 Credit (Standard: Half-Day Presence)</option>
                <option value={1.0}>1.0 Credit (Treated as Attended with Late Note)</option>
                <option value={0.0}>0.0 Credit (Strict: Late Treated as Absent)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Defines how many credits a student receives when marked Late.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* College Mini Project Architecture Reference */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Cloud Computing Architecture Notes for Mini Project Viva</span>
        </h4>
        <p className="leading-relaxed">
          This system implements a Cloud-Native Serverless Architecture. Data is persisted in Google Cloud Firestore using atomic document updates and batched writes. The frontend utilizes Vite React and client-side RBAC (Role-Based Access Control) with security boundaries enforced at both the client routing layer and Firebase Security Rules (<code className="bg-white px-1 py-0.5 border rounded">firestore.rules</code>).
        </p>
      </div>
    </div>
  );
}
