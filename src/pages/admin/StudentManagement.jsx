import React, { useState, useEffect } from 'react';
import { 
  getStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent, 
  getClasses 
} from '../../firebase/dbService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { StatusBadge } from '../../components/common/Badge';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    classId: '',
    className: '',
    gender: 'Male',
    dob: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    status: 'Active'
  });

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuList, clsList] = await Promise.all([
        getStudents(),
        getClasses()
      ]);
      setStudents(stuList);
      setClasses(clsList);
      if (clsList.length > 0 && !formData.classId) {
        setFormData(prev => ({
          ...prev,
          classId: clsList[0].id,
          className: clsList[0].name
        }));
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setAlert({ type: 'danger', message: `Unable to load students: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedStudent(null);
    setFormData({
      name: '',
      rollNumber: `CS210${String(students.length + 1).padStart(2, '0')}`,
      email: '',
      phone: '',
      classId: classes[0]?.id || '',
      className: classes[0]?.name || '',
      gender: 'Male',
      dob: '2003-01-01',
      guardianName: '',
      guardianPhone: '',
      address: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const openViewModal = (student) => {
    setModalMode('view');
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const promptDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setAlert({ type: 'success', message: `Student ${studentToDelete.name} deleted successfully.` });
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to delete student: ${err.message}` });
    } finally {
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleClassChange = (e) => {
    const clsId = e.target.value;
    const clsObj = classes.find(c => c.id === clsId);
    setFormData(prev => ({
      ...prev,
      classId: clsId,
      className: clsObj ? clsObj.name : ''
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const created = await addStudent(formData);
        setStudents(prev => [created, ...prev]);
        setAlert({ type: 'success', message: `Student ${created.name} enrolled successfully!` });
      } else if (modalMode === 'edit') {
        const updated = await updateStudent(selectedStudent.id, formData);
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
        setAlert({ type: 'success', message: `Student details updated successfully!` });
      }
      setIsModalOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: `Failed to save student: ${err.message}` });
    }
  };

  // Filter students by selected class
  const displayedStudents = selectedClass === 'ALL'
    ? students
    : students.filter(s => s.classId === selectedClass);

  const columns = [
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
          <div className="font-bold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Class / Section',
      accessor: 'className',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          {row.className || 'CS-3A'}
        </span>
      )
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      cell: (row) => <span className="text-xs text-slate-600">{row.phone || 'N/A'}</span>
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
            title="Edit Student"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => promptDelete(row)}
            title="Delete Student"
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Add, update, search, and manage registered student profiles in Firestore.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {alert.message && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ type: '', message: '' })} 
        />
      )}

      {/* Class Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Class Filter:
        </span>
        <button
          onClick={() => setSelectedClass('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedClass === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Classes ({students.length})
        </button>
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedClass === c.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <DataTable
        columns={columns}
        data={displayedStudents}
        searchKey="name"
        searchPlaceholder="Search student by name, roll no, or email..."
        itemsPerPage={10}
        emptyMessage="No students found matching your search."
      />

      {/* Create / Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'Enroll New Student'
            : modalMode === 'edit'
            ? `Edit Student: ${selectedStudent?.name}`
            : `Student Details: ${selectedStudent?.name}`
        }
        maxWidth="max-w-2xl"
      >
        {modalMode === 'view' && selectedStudent ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Roll: {selectedStudent.rollNumber}
                  </span>
                  <StatusBadge status={selectedStudent.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Assigned Class</span>
                <span className="font-bold text-slate-800 text-sm">{selectedStudent.className}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Contact Phone</span>
                <span className="font-semibold text-slate-800">{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Date of Birth</span>
                <span className="font-semibold text-slate-800">{selectedStudent.dob || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Guardian Name</span>
                <span className="font-semibold text-slate-800">{selectedStudent.guardianName || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Guardian Phone</span>
                <span className="font-semibold text-slate-800">{selectedStudent.guardianPhone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 md:col-span-2">
                <span className="text-slate-400 block mb-1">Residential Address</span>
                <span className="font-semibold text-slate-800">{selectedStudent.address || 'N/A'}</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Liam Walker"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="e.g. CS21011"
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
                  placeholder="e.g. liam.w@college.edu"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Class / Batch *</label>
                <select
                  value={formData.classId}
                  onChange={handleClassChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.department}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  placeholder="Parent / Guardian Name"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guardian Phone</label>
                <input
                  type="text"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="Guardian Emergency Contact"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Residential Address"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
                {modalMode === 'create' ? 'Enroll Student' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Before Deleting Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Student Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete student <span className="font-bold">{studentToDelete?.name}</span> ({studentToDelete?.rollNumber})? This will permanently remove their academic profile.
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
              Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
