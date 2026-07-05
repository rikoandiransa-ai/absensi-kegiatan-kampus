import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  User, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Attendance, Student, Activity } from '../types.js';

interface AttendanceViewProps {
  getAuthHeader: () => { Authorization: string } | {};
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ getAuthHeader }) => {
  const { state } = useAuth();
  const isAdmin = state.user?.role === 'admin';
  const currentStudentId = state.user?.student_id;

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Form States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [customStatus, setCustomStatus] = useState<'Terdaftar' | 'Hadir'>('Terdaftar');
  const [formError, setFormError] = useState<string | null>(null);

  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const calculateTimeCompliance = (
    regDate: string,
    regTime: string,
    actDate?: string,
    actTime?: string
  ) => {
    if (!actDate || !actTime) {
      return { label: 'Registered', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    }

    if (regDate < actDate) {
      return { 
        label: 'Pre-registered', 
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        description: 'Registered early before event day' 
      };
    }
    if (regDate > actDate) {
      return { 
        label: 'Retroactive', 
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', 
        description: 'Registered after the event day' 
      };
    }

    try {
      const [regH, regM] = regTime.split(':').map(Number);
      const [actH, actM] = actTime.split(':').map(Number);
      if (isNaN(regH) || isNaN(regM) || isNaN(actH) || isNaN(actM)) {
        return { label: 'On Time', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      }

      const regTotal = regH * 60 + regM;
      const actTotal = actH * 60 + actM;
      const diff = regTotal - actTotal;

      if (diff <= 15) {
        return { 
          label: 'On Time', 
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
          description: diff < 0 ? `Registered ${Math.abs(diff)}m early` : 'Registered within 15m grace period'
        };
      } else {
        return { 
          label: `Late (${diff}m)`, 
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', 
          description: `Missed scheduled start by ${diff} minutes`
        };
      }
    } catch (e) {
      return { label: 'On Time', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeader();

      const [resAttendance, resActivities] = await Promise.all([
        fetch('/api/absensi', { headers }),
        fetch('/api/activity', { headers })
      ]);

      if (!resAttendance.ok || !resActivities.ok) {
        throw new Error('Failed to load attendance datasets');
      }

      const dataAttendance = await resAttendance.json();
      const dataActivities = await resActivities.json();

      setAttendances(dataAttendance);
      setActivities(dataActivities);

      // Fetch all students for registration
      const resStudents = await fetch('/api/students', { headers });
      if (resStudents.ok) {
        const dataStudents = await resStudents.json();
        setStudents(dataStudents);
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRegisterModal = () => {
    setFormError(null);
    setSelectedStudentId(currentStudentId || '');
    setSelectedActivityId('');
    setCustomStatus('Terdaftar');

    const now = new Date();
    const localDate = now.toISOString().split('T')[0];
    const localTime = now.toTimeString().split(' ')[0].substring(0, 5);
    setCustomDate(localDate);
    setCustomTime(localTime);

    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const studentIdToSubmit = selectedStudentId || currentStudentId;
    if (!studentIdToSubmit || !selectedActivityId) {
      setFormError('Please select both a student and an activity.');
      return;
    }

    try {
      const response = await fetch('/api/absensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          student_id: studentIdToSubmit,
          activity_id: parseInt(selectedActivityId, 10),
          status: customStatus,
          custom_date: customDate,
          custom_time: customTime
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete registration');
      }

      setSuccessMsg('Registration successfully processed!');
      setIsRegisterModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Server error recording attendance');
    }
  };

  // Admin marks attendance status
  const handleMarkStatus = async (attendanceId: number, status: Attendance['status']) => {
    try {
      const response = await fetch(`/api/absensi/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update attendance');
      }

      setSuccessMsg('Attendance status successfully updated!');
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDeleteRegistration = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel and delete this registration log?')) {
      return;
    }

    try {
      const response = await fetch(`/api/absensi/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete registration');
      }

      setSuccessMsg('Registration log deleted.');
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting log');
    }
  };

  // Filter out completed activities for registration selection
  const activeActivities = activities.filter(a => a.status === 'Active');

  // Filter logs
  const filteredLogs = attendances.filter(log => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      (log.student_name || '').toLowerCase().includes(term) ||
      log.student_id.includes(term) ||
      (log.activity_name || '').toLowerCase().includes(term) ||
      (log.study_program || '').toLowerCase().includes(term)
    );

    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance & Registrations</h2>
          <p className="text-xs text-slate-400">
            Re-register for activities, mark student check-ins, and manage enrollments.
          </p>
        </div>
        
        {/* Register Button */}
        <button
          onClick={openRegisterModal}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/10 transition active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          RE-REGISTRATION
        </button>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Fetch Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filters and Search Log */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Log controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, NIM, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          {/* Status logs filtering */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500 transition"
            >
              <option value="All">All Statuses</option>
              <option value="Terdaftar">Terdaftar (Registered)</option>
              <option value="Hadir">Hadir (Present)</option>
              <option value="Izin">Izin (Excused)</option>
              <option value="Sakit">Sakit (Sick)</option>
              <option value="Alfa">Alfa (Absent)</option>
            </select>
          </div>
        </div>

        {/* Attendance Log Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Syncing registration books...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Activity Name</th>
                  <th className="px-6 py-4">Enrollment Timestamp</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right action-column">Mark Attendance / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => {
                  let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
                  if (log.status === 'Hadir') badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  else if (log.status === 'Terdaftar') badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                  else if (log.status === 'Izin' || log.status === 'Sakit') badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                  else if (log.status === 'Alfa') badgeStyle = "bg-red-50 text-red-700 border-red-200";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      {/* Student details */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-slate-800">{log.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.student_id} • {log.study_program}</div>
                      </td>
                      {/* Activity Name */}
                      <td className="px-6 py-4 font-semibold text-sm text-slate-700">
                        {log.activity_name}
                      </td>
                      {/* Timestamp */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{log.date} at {log.time}</span>
                          </div>
                          {(() => {
                            const compliance = calculateTimeCompliance(log.date, log.time, log.activity_date, log.activity_time);
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-block self-start text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${compliance.badgeClass}`}>
                                  {compliance.label}
                                </span>
                                {compliance.description && (
                                  <span className="text-[9px] text-slate-400 leading-none">
                                    {compliance.description}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${badgeStyle}`}>
                          {log.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right action-column">
                        <div className="inline-flex gap-2 items-center">
                          {/* Fast status actions */}
                          <select
                            value={log.status}
                            onChange={(e) => handleMarkStatus(log.id, e.target.value as Attendance['status'])}
                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-sky-500 transition"
                          >
                            <option value="Terdaftar">Terdaftar</option>
                            <option value="Hadir">Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Alfa">Alfa</option>
                          </select>

                          <button
                            onClick={() => handleDeleteRegistration(log.id)}
                            title="Delete log"
                            className="p-1.5 hover:bg-orange-50 text-orange-600 hover:text-orange-700 rounded-lg transition shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <ClipboardCheck className="h-12 w-12 text-slate-200 mb-2" />
            <p className="text-sm font-medium">No attendance logs found matching filters.</p>
          </div>
        )}
      </div>

      {/* Register/Enrollment Modal Dialog */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsRegisterModalOpen(false)}
          />

          {/* Card Frame */}
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl relative z-10 overflow-hidden transform transition-all animate-fade-in border border-slate-100">
            {/* Modal Header */}
            <div className="h-16 bg-slate-900 px-6 flex items-center justify-between text-white">
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
                RE-REGISTRATION
              </h3>
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-3.5 flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{formError}</p>
                </div>
              )}

              {/* Form Controls */}
              <div className="space-y-4">
                {/* Student Field - accessible only to admin, read-only for student */}
                {isAdmin ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Select Student *
                    </label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    >
                      <option value="">-- Choose Student profile --</option>
                      {students.map((st) => (
                        <option key={st.student_id} value={st.student_id}>
                          {st.name} ({st.student_id})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Student Profile
                    </label>
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium">
                      {state.user?.name} ({state.user?.student_id})
                    </div>
                  </div>
                )}                 {/* Activity Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Select Activity *
                  </label>
                  <select
                    required
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  >
                    <option value="">-- Choose Active activity --</option>
                    {activeActivities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name} (Date: {act.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Activity Details & Hours Validation */}
                {(() => {
                  const selectedAct = activeActivities.find(a => a.id === parseInt(selectedActivityId, 10));
                  if (!selectedAct) return null;

                  const compliance = calculateTimeCompliance(customDate, customTime, selectedAct.date, selectedAct.time);

                  return (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 animate-fade-in">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>Specified Activity Hours:</span>
                        <span className="text-sky-600">{selectedAct.date} at {selectedAct.time}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Registration Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Registration Time *
                          </label>
                          <input
                            type="time"
                            required
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">Validation Status:</span>
                        <div className="text-right">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${compliance.badgeClass}`}>
                            {compliance.label}
                          </span>
                          {compliance.description && (
                            <p className="text-[9px] text-slate-400 mt-0.5">{compliance.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Admin Status preset field */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Initial Attendance Status
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(['Terdaftar', 'Hadir'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCustomStatus(st)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                            customStatus === st
                              ? 'bg-white text-slate-800 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {st === 'Terdaftar' ? 'Registered' : 'Present (Hadir)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/10 transition active:scale-95"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
