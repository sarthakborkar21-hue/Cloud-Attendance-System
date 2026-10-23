import React, { useState, useEffect } from 'react';
import { 
  getClasses, 
  addClass, 
  updateClass, 
  deleteClass, 
  getStudents 
} from '../../firebase/dbService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedClass, setSelectedClass] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science & Engineering',
    semester: 'Semester 6',
    academicYear: '2024-2025',
    room: ''
  });

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsList, stuList] = await Promise.all([
        getClasses(),
        getStudents()
      ]);
      setClasses(clsList);
      setStudents(stuList);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setAlert({ type: 'danger', message: `Unable to load classes: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedClass(null);
    setFormData({
      name: '',
      department: 'Computer Science & Engineering',
      semester: 'Semester 6',
      academicYear: '2024-2025',
      room: 'Room 301 - Academic Block'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cls) => {
    setModalMode('edit');
    setSelectedClass(cls);
    setFormData({ ...cls });
    setIsModalOpen(true);
  };

  const promptDelete = (cls) => {
    setClassToDelete(cls);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await deleteClass(classToDelete.id);
      setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
      setAlert({ type: 'success', message: `Class ${classToDelete.name} deleted successfully.` });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to delete class: ${err.message}` });
    } finally {
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const created = await addClass(formData);
        setClasses(prev => [created, ...prev]);
        setAlert({ type: 'success', message: `Class ${created.name} added successfully!` });
      } else if (modalMode === 'edit') {
        const updated = await updateClass(selectedClass.id, formData);
        setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
        setAlert({ type: 'success', message: `Class updated successfully!` });
      }
      setIsModalOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: `Error saving class: ${err.message}` });
    }
  };

  const columns = [
    {
      header: 'Class Code',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono">
          {row.name}
        </span>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      cell: (row) => <span className="text-xs font-semibold text-slate-700">{row.department}</span>
    },
    {
      header: 'Semester & Year',
      accessor: 'semester',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">{row.semester}</span>
          <span className="text-[11px] text-slate-400">{row.academicYear}</span>
        </div>
      )
    },
    {
      header: 'Room / Lab',
      accessor: 'room',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {row.room || 'TBD'}
        </span>
      )
    },
    {
      header: 'Enrolled Students',
      accessor: 'id',
      cell: (row) => {
        const count = students.filter(s => s.classId === row.id).length;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {count} Students
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            title="Edit Class"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => promptDelete(row)}
            title="Delete Class"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class & Batch Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure academic classrooms, semesters, and student cohorts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Class</span>
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
        data={classes}
        searchKey="name"
        searchPlaceholder="Search class by code, dept..."
        itemsPerPage={10}
        emptyMessage="No classes found."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Class Batch' : `Edit Class: ${selectedClass?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. CS-3A or IT-4B"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Room / Hall Location</label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g. Lab 302 - Turing Hall"
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
              {modalMode === 'create' ? 'Create Class' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Class Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete class <span className="font-bold">{classToDelete?.name}</span>?
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
              Delete Class
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
