import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  UserX, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { useAuth } from '../context/AuthContext.js';
import { Student, Activity, RekapSummary } from '../types.js';

interface DashboardViewProps {
  getAuthHeader: () => { Authorization: string } | {};
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ getAuthHeader, setActiveTab }) => {
  const { state } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rekap, setRekap] = useState<RekapSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const headers = getAuthHeader();

        const [resStudents, resActivities, resRekap] = await Promise.all([
          fetch('/api/students', { headers }),
          fetch('/api/activity', { headers }),
          fetch('/api/rekap', { headers })
        ]);

        if (!resStudents.ok || !resActivities.ok || !resRekap.ok) {
          throw new Error('Failed to load dashboard statistics');
        }

        const dataStudents = await resStudents.json();
        const dataActivities = await resActivities.json();
        const dataRekap = await resRekap.json();

        setStudents(dataStudents);
        setActivities(dataActivities);
        setRekap(dataRekap);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error communicating with server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving real-time campus metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto mt-10">
        <p className="text-red-700 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = students.length;
  const totalActivities = activities.length;
  const totalAbsences = rekap?.totals.absences ?? 0;
  const totalAttendance = rekap?.totals.presents ?? 0;

  // Next active activities
  const activeActivities = activities
    .filter(a => a.status === 'Active')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Participant chart data
  const chartData = rekap?.summaryByActivity.map(item => ({
    name: item.activity_name.length > 20 ? item.activity_name.substring(0, 18) + '...' : item.activity_name,
    participants: item.participants,
    fullName: item.activity_name
  })) || [];

  const barColors = ['#0284c7', '#ea580c', '#3b82f6', '#f97316', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-sky-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-8">
          <Users className="w-96 h-96" />
        </div>
        <div className="space-y-2 z-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome Back, <span className={`text-orange-400 ${state.user?.name === 'Universitas Anak Bangsa' ? 'text-[25px]' : ''}`}>{state.user?.name}!</span>
          </h2>
          <p className="text-slate-300 max-w-xl text-sm md:text-base">
            Manage student registrations, schedule activities, track attendance histories, and analyze student engagement.
          </p>
        </div>
        <div className="flex gap-3 z-10 shrink-0">
          {state.user?.role === 'admin' ? (
            <>
              <button 
                onClick={() => setActiveTab('activities')}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-150 active:scale-95"
              >
                Create Activity
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all duration-150 active:scale-95"
              >
                Add Student
              </button>
            </>
          ) : (
            <button 
              onClick={() => setActiveTab('attendance')}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-150 active:scale-95"
            >
              Register Activity
            </button>
          )}
        </div>
      </div>

      {/* Numerical Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Students</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalStudents}</h3>
            <span className="flex items-center text-[11px] font-medium text-emerald-600 gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Active Profiles
            </span>
          </div>
          <div className="p-4 bg-sky-50 rounded-2xl text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Activities */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campus Activities</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalActivities}</h3>
            <span className="flex items-center text-[11px] font-medium text-orange-500 gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              Active & Completed
            </span>
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Attendance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presents (Hadir)</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalAttendance}</h3>
            <span className="flex items-center text-[11px] font-medium text-emerald-600 gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Confirmed logs
            </span>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Absences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Absences (Alfa)</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalAbsences}</h3>
            <span className="flex items-center text-[11px] font-medium text-red-500 gap-1 mt-1">
              <TrendingDown className="h-3 w-3" />
              Unexcused absences
            </span>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Chart & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graph Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Activity Participant Statistics</h3>
            <p className="text-xs text-slate-400">Total number of registered student participants across each activity</p>
          </div>
          
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: 'white',
                      fontSize: '12px'
                    }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="participants" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No activity records available to map.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Activities / Quick Logs Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Active Activities</h3>
              <button 
                onClick={() => setActiveTab('activities')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-4">
              {activeActivities.length > 0 ? (
                activeActivities.map((act) => (
                  <div key={act.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-sky-100 hover:bg-sky-50/10 transition group">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 group-hover:text-sky-600 transition truncate max-w-[180px]">
                          {act.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{act.organizer}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        {act.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {act.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {act.date} at {act.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                  <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs">No active activities found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-sky-50 rounded-xl p-3 text-[11px] text-sky-800 leading-relaxed font-medium">
              🔑 <strong className="text-sky-950">Tip:</strong> Students can register for active events in the <span className="text-orange-500 font-bold underline cursor-pointer" onClick={() => setActiveTab('attendance')}>Attendance</span> section.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
