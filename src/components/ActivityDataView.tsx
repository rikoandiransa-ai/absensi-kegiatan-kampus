import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  MapPin, 
  Clock, 
  User, 
  Activity as ActivityIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Activity } from '../types.js';

interface ActivityDataViewProps {
  getAuthHeader: () => { Authorization: string } | {};
}

export const ActivityDataView: React.FC<ActivityDataViewProps> = ({ getAuthHeader }) => {
  const { state } = useAuth();
  const isAdmin = state.user?.role === 'admin';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed'>('Active');

  // Local state validators
  const [formError, setFormError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/activity', {
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        throw new Error('Failed to load activity schedule');
      }
      const data = await response.json();
      setActivities(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedActivityId(null);
    setName('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setOrganizer('');
    setStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setIsEditing(true);
    setSelectedActivityId(activity.id);
    setName(activity.name);
    setDescription(activity.description);
    setDate(activity.date);
    setTime(activity.time);
    setLocation(activity.location);
    setOrganizer(activity.organizer);
    setStatus(activity.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validations
    if (!name || !date || !time || !location || !organizer) {
      setFormError('Please fill in all mandatory activity fields.');
      return;
    }

    const payload = { name, description, date, time, location, organizer, status };

    try {
      const url = isEditing ? `/api/activity/${selectedActivityId}` : '/api/activity';
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

      setSuccessMsg(isEditing ? 'Activity details successfully updated!' : 'Activity details successfully scheduled!');
      setIsModalOpen(false);
      fetchActivities();

      // Clear toast msg after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Server error saving activity details');
    }
  };

  const handleDelete = async (id: number, actName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently cancel and delete "${actName}"? All student registration and attendance logs tied to this activity will be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/activity/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete activity');
      }

      setSuccessMsg('Activity permanently deleted.');
      fetchActivities();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  // Filter activities based on search and status
  const filteredActivities = activities.filter(act => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      act.name.toLowerCase().includes(term) ||
      act.description.toLowerCase().includes(term) ||
      act.location.toLowerCase().includes(term) ||
      act.organizer.toLowerCase().includes(term)
    );

    const matchesStatus = statusFilter === 'All' || act.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Campus Activities Scheduler</h2>
          <p className="text-xs text-slate-400">Schedule activities, assign locations, set times, and view catalogs</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-600/10 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add New Activity
          </button>
        )}
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

      {/* Search and Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities by name, location, host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Status:
          </span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['All', 'Active', 'Completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === filter
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Syncing activity calendars...</p>
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => (
            <div 
              key={act.id} 
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between group hover:border-sky-100 hover:shadow-md transition duration-200"
            >
              {/* Card Main Body */}
              <div className="p-6 space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    act.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${act.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {act.status}
                  </span>
                  
                  {/* Host label */}
                  <span className="text-[11px] text-orange-500 font-bold uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                    {act.organizer}
                  </span>
                </div>

                {/* Name & Desc */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition truncate text-base" title={act.name}>
                    {act.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 h-[54px]">
                    {act.description || 'No description provided for this campus activity.'}
                  </p>
                </div>

                {/* Details list */}
                <div className="pt-3 border-t border-slate-50 space-y-2 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{act.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{act.date} at {act.time}</span>
                  </div>
                </div>
              </div>

              {/* Admin actions row */}
              {isAdmin && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-2 action-column">
                  <button
                    onClick={() => openEditModal(act)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-sky-50 text-sky-600 hover:text-sky-700 hover:bg-sky-100 rounded-xl font-bold transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(act.id, act.name)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-50 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-xl font-bold transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400 shadow-sm">
          <Calendar className="h-12 w-12 text-slate-200 mb-2 mx-auto" />
          <p className="text-sm font-medium">No activities scheduled matching filters.</p>
        </div>
      )}

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
                <Calendar className="h-5 w-5 text-orange-500" />
                {isEditing ? 'Modify Activity Details' : 'Schedule New Activity'}
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
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <ActivityIcon className="h-3.5 w-3.5 text-slate-400" />
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Hackathon 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <ActivityIcon className="h-3.5 w-3.5 text-slate-400" />
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the activity purpose, targets, and notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition resize-none"
                  />
                </div>

                {/* Organizer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Organizer / Host *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS Student Union"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Double split: Date / Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seminar Hall B"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Status Toggle (Active/Completed) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Activity Status
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['Active', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                          status === st
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
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
                  {isEditing ? 'Save Changes' : 'Schedule Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
