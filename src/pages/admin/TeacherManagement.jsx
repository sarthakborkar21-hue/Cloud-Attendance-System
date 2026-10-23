import React, { useState, useEffect } from 'react';
import { 
  getTeachers, 
  addTeacher, 
  updateTeacher, 
  deleteTeacher, 
  getClasses, 
  getSubjects 
} from '../../firebase/dbService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { StatusBadge } from '../../components/common/Badge';
import {
  GraduationCap,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  BookOpen,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    email: '',
    phone: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    assignedClasses: [],
    assignedSubjects: [],
    status: 'Active'
  });

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tchList, clsList, subList] = await Promise.all([
        getTeachers(),
        getClasses(),
        getSubjects()
      ]);
      setTeachers(tchList);
      setClasses(clsList);
      setSubjects(subList);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setAlert({ type: 'danger', message: `Unable to load teachers: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTeacher(null);
    setFormData({
      name: '',
      teacherId: `T2024${String(teachers.length + 1).padStart(2, '0')}`,
      email: '',
      phone: '',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      assignedClasses: [classes[0]?.id || 'cls-cs3a'],
      assignedSubjects: [subjects[0]?.id || 'sub-cs301'],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setModalMode('edit');
    setSelectedTeacher(teacher);
    setFormData({
      ...teacher,
      assignedClasses: teacher.assignedClasses || [],
      assignedSubjects: teacher.assignedSubjects || []
    });
    setIsModalOpen(true);
  };

  const openViewModal = (teacher) => {
    setModalMode('view');
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const promptDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await deleteTeacher(teacherToDelete.id);
      setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
      setAlert({ type: 'success', message: `Faculty member ${teacherToDelete.name} removed successfully.` });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to remove faculty member: ${err.message}` });
    } finally {
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const created = await addTeacher(formData);
        setTeachers(prev => [created, ...prev]);
        setAlert({ type: 'success', message: `Faculty member ${created.name} added successfully!` });
      } else if (modalMode === 'edit') {
        const updated = await updateTeacher(selectedTeacher.id, formData);
        setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
        setAlert({ type: 'success', message: `Faculty member details updated successfully!` });
      }
      setIsModalOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to save teacher: ${err.message}` });
    }
  };

  const toggleClassAssignment = (classId) => {
    setFormData(prev => {
      const exists = prev.assignedClasses.includes(classId);
      return {
        ...prev,
        assignedClasses: exists
          ? prev.assignedClasses.filter(id => id !== classId)
          : [...prev.assignedClasses, classId]
      };
    });
  };

  const toggleSubjectAssignment = (subId) => {
    setFormData(prev => {
      const exists = prev.assignedSubjects.includes(subId);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter(id => id !== subId)
          : [...prev.assignedSubjects, subId]
      };
    });
  };

  const columns = [
    {
      header: 'Faculty ID',
      accessor: 'teacherId',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
          {row.teacherId}
        </span>
      )
    },
    {
      header: 'Faculty Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Designation & Dept',
      accessor: 'designation',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700 block">{row.designation}</span>
          <span className="text-[11px] text-slate-400">{row.department}</span>
        </div>
      )
    },
    {
      header: 'Assigned Courses',
      accessor: 'assignedSubjects',
      cell: (row) => {
        const count = row.assignedSubjects?.length || 0;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg">
            <BookOpen className="w-3 h-3 text-slate-500" />
            {count} {count === 1 ? 'Course' : 'Courses'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status || 'Active'} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openViewModal(row)}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            title="Edit Teacher"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => promptDelete(row)}
            title="Delete Teacher"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage instructional faculty, course assignments, and departmental roles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {alert.message && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ type: '', message: '' })} 
        />
      )}

      {/* Teachers Table */}
      <DataTable
        columns={columns}
        data={teachers}
        searchKey="name"
        searchPlaceholder="Search faculty by name, ID, department..."
        itemsPerPage={10}
        emptyMessage="No faculty records found."
      />

      {/* Create / Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'Add New Faculty Member'
            : modalMode === 'edit'
            ? `Edit Faculty: ${selectedTeacher?.name}`
            : `Faculty Profile: ${selectedTeacher?.name}`
        }
        maxWidth="max-w-2xl"
      >
        {modalMode === 'view' && selectedTeacher ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                {selectedTeacher.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedTeacher.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                    ID: {selectedTeacher.teacherId}
                  </span>
                  <StatusBadge status={selectedTeacher.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Designation</span>
                <span className="font-bold text-slate-800 text-sm">{selectedTeacher.designation}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Department</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.department}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.email}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Assigned Courses */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Assigned Courses & Classes</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTeacher.assignedSubjects?.map(subId => {
                  const sObj = subjects.find(s => s.id === subId);
                  return (
                    <span key={subId} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold">
                      {sObj ? `${sObj.code} - ${sObj.name}` : subId}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Robert Vance"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty ID *</label>
                <input
                  type="text"
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  placeholder="e.g. T202405"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. teacher@college.edu"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor & Head">Professor & Head</option>
                  <option value="Visiting Lecturer">Visiting Lecturer</option>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Multi-select Subjects */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Assign Teaching Subjects</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {subjects.map(s => {
                  const isChecked = formData.assignedSubjects.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSubjectAssignment(s.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800">{s.code}</span>
                        <span className="text-slate-500 block text-[10px] truncate max-w-xs">{s.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
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
                {modalMode === 'create' ? 'Add Faculty Member' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Faculty Removal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete faculty member <span className="font-bold">{teacherToDelete?.name}</span>?
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
              Delete Faculty
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
