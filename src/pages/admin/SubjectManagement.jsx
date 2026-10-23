import React, { useState, useEffect } from 'react';
import { 
  getSubjects, 
  addSubject, 
  updateSubject, 
  deleteSubject, 
  getClasses, 
  getTeachers 
} from '../../firebase/dbService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Layers,
  Award,
  AlertTriangle
} from 'lucide-react';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    classId: '',
    className: '',
    teacherId: '',
    teacherName: '',
    credits: 3,
    department: 'Computer Science & Engineering'
  });

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subList, clsList, tchList] = await Promise.all([
        getSubjects(),
        getClasses(),
        getTeachers()
      ]);
      setSubjects(subList);
      setClasses(clsList);
      setTeachers(tchList);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAlert({ type: 'danger', message: `Unable to load subjects: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSubject(null);
    setFormData({
      code: `CS${300 + subjects.length + 1}`,
      name: '',
      classId: classes[0]?.id || '',
      className: classes[0]?.name || '',
      teacherId: teachers[0]?.id || '',
      teacherName: teachers[0]?.name || '',
      credits: 3,
      department: 'Computer Science & Engineering'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setModalMode('edit');
    setSelectedSubject(sub);
    setFormData({ ...sub });
    setIsModalOpen(true);
  };

  const promptDelete = (sub) => {
    setSubjectToDelete(sub);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteSubject(subjectToDelete.id);
      setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
      setAlert({ type: 'success', message: `Subject ${subjectToDelete.code} removed successfully.` });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to remove subject: ${err.message}` });
    } finally {
      setIsDeleteModalOpen(false);
      setSubjectToDelete(null);
    }
  };

  const handleClassSelect = (e) => {
    const cId = e.target.value;
    const cObj = classes.find(c => c.id === cId);
    setFormData(prev => ({
      ...prev,
      classId: cId,
      className: cObj ? cObj.name : ''
    }));
  };

  const handleTeacherSelect = (e) => {
    const tId = e.target.value;
    const tObj = teachers.find(t => t.id === tId);
    setFormData(prev => ({
      ...prev,
      teacherId: tId,
      teacherName: tObj ? tObj.name : ''
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const created = await addSubject(formData);
        setSubjects(prev => [created, ...prev]);
        setAlert({ type: 'success', message: `Course ${created.code} created successfully!` });
      } else if (modalMode === 'edit') {
        const updated = await updateSubject(selectedSubject.id, formData);
        setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
        setAlert({ type: 'success', message: `Course details updated successfully!` });
      }
      setIsModalOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: `Error saving subject: ${err.message}` });
    }
  };

  const columns = [
    {
      header: 'Course Code',
      accessor: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs">
          {row.code}
        </span>
      )
    },
    {
      header: 'Course Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.department}</span>
        </div>
      )
    },
    {
      header: 'Target Class',
      accessor: 'className',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
          <Layers className="w-3 h-3 text-slate-500" />
          {row.className || 'CS-3A'}
        </span>
      )
    },
    {
      header: 'Instructor In-Charge',
      accessor: 'teacherName',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
          {row.teacherName || 'Not Assigned'}
        </span>
      )
    },
    {
      header: 'Credits',
      accessor: 'credits',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          {row.credits} Credits
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            title="Edit Course"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => promptDelete(row)}
            title="Delete Course"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subject & Course Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Curriculum subjects, credit structures, and assigned teaching faculty.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {alert.message && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ type: '', message: '' })} 
        />
      )}

      <DataTable
        columns={columns}
        data={subjects}
        searchKey="name"
        searchPlaceholder="Search subject by code or title..."
        itemsPerPage={10}
        emptyMessage="No subjects found."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Subject / Course' : `Edit Course: ${selectedSubject?.code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS305"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Credits</label>
              <input
                type="number"
                min={1}
                max={6}
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Expert Systems"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Class *</label>
            <select
              value={formData.classId}
              onChange={handleClassSelect}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty Member *</label>
            <select
              value={formData.teacherId}
              onChange={handleTeacherSelect}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              {modalMode === 'create' ? 'Create Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Subject Removal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to remove subject <span className="font-bold">{subjectToDelete?.code}</span> ({subjectToDelete?.name})?
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
              onClick={confirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
            >
              Delete Subject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
