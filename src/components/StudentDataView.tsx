import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Mail, 
  BookOpen, 
  Building2, 
  IdCard, 
  UserCircle2, 
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Student } from '../types.js';

interface StudentDataViewProps {
  getAuthHeader: () => { Authorization: string } | {};
}

export const StudentDataView: React.FC<StudentDataViewProps> = ({ getAuthHeader }) => {
  const { state } = useAuth();
  const isAdmin = state.user?.role === 'admin';

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Form Fields
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [faculty, setFaculty] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Local state validators
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/students', {
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        throw new Error('Failed to load student catalog');
      }
      const data = await response.json();
      setStudents(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with the database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedStudentId(null);
    setStudentId('');
    setName('');
    setStudyProgram('');
    setFaculty('');
    setEmail('');
    setUsername('');
    setPassword('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setIsEditing(true);
    setSelectedStudentId(student.student_id);
    setStudentId(student.student_id);
    setName(student.name);
    setStudyProgram(student.study_program);
    setFaculty(student.faculty);
    setEmail(student.email);
    setUsername(student.username);
    setPassword(''); // Empty unless they want to update it
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validations
    if (!studentId || !name || !studyProgram || !faculty || !email || !username) {
      setFormError('Please fill in all mandatory profile fields.');
      return;
    }

    if (!isEditing && !password) {
      setFormError('Please input a login password.');
      return;
    }

    // Email Pattern check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFormError('Please input a valid email address.');
      return;
    }

    const payload = isEditing 
      ? { name, study_program: studyProgram, faculty, email, password }
      : { student_id: studentId, name, study_program: studyProgram, faculty, email, username, password };

    try {
      const url = isEditing ? `/api/students/${selectedStudentId}` : '/api/students';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setSuccessMsg(isEditing ? 'Student profile successfully updated!' : 'Student profile successfully created!');
      setIsModalOpen(false);
      fetchStudents();

      // Clear toast msg after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Server error saving profile');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete student "${name}"? All associated attendance logs and authentication credentials will be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete student');
      }

      setSuccessMsg('Student profile permanently deleted.');
      fetchStudents();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const term = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.student_id.includes(term) ||
      student.study_program.toLowerCase().includes(term) ||
      student.faculty.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Student Profiles Directory</h2>
          <p className="text-xs text-slate-400">View and manage campus student records and academic fields</p>
        </div>
        <button
          onClick={openAddModal}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/10 transition active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          Add New Student
        </button>
      </div>

      {/* Success Messages / Toasts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Database Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Search and Table Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search Bar Panel */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by NIM, name, email, major..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>
        </div>

        {/* Directory Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Syncing profile catalog...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4">Student ID / NIM</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Study Program (Faculty)</th>
                  <th className="px-6 py-4">Linked Username</th>
                  <th className="px-6 py-4 text-right action-column">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/50 transition">
                    {/* NIM */}
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                      {st.student_id}
                    </td>
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-sm text-slate-800">
                      {st.name}
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {st.email}
                    </td>
                    {/* Program & Faculty */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700 font-medium">{st.study_program}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{st.faculty}</div>
                    </td>
                    {/* Username */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-medium">
                        <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                        {st.username}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right action-column">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(st)}
                          title="Edit student"
                          className="p-1.5 hover:bg-sky-50 text-sky-600 hover:text-sky-700 rounded-lg transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(st.student_id, st.name)}
                          title="Delete student"
                          className="p-1.5 hover:bg-orange-50 text-orange-600 hover:text-orange-700 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Users className="h-12 w-12 text-slate-200 mb-2" />
            <p className="text-sm font-medium">No students found matching search term.</p>
          </div>
        )}
      </div>

      {/* CRUD Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Card content */}
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl relative z-10 overflow-hidden transform transition-all animate-fade-in border border-slate-100">
            {/* Modal Header */}
            <div className="h-16 bg-slate-900 px-6 flex items-center justify-between text-white">
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                {isEditing ? 'Modify Student Profile' : 'Register New Student'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-3.5 flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{formError}</p>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student ID / NIM */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <IdCard className="h-3.5 w-3.5 text-slate-400" />
                    Student ID / NIM *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. 202601001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Andi Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Study Program */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    Study Program *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={studyProgram}
                    onChange={(e) => setStudyProgram(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Faculty */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Faculty *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science and Tech"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. andi@unaba.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. student1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                    {isEditing ? 'New Password (Optional)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/10 transition active:scale-95"
                >
                  {isEditing ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
