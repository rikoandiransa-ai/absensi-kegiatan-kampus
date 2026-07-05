import React, { useEffect, useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Calendar,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { RekapSummary, Activity } from '../types.js';

interface AttendanceSummaryViewProps {
  getAuthHeader: () => { Authorization: string } | {};
}

export const AttendanceSummaryView: React.FC<AttendanceSummaryViewProps> = ({ getAuthHeader }) => {
  const [rekap, setRekap] = useState<RekapSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('All');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeader();

      const [resRekap, resActivities] = await Promise.all([
        fetch('/api/rekap', { headers }),
        fetch('/api/activity', { headers })
      ]);

      if (!resRekap.ok || !resActivities.ok) {
        throw new Error('Failed to fetch attendance summary data');
      }

      const dataRekap = await resRekap.json();
      const dataActivities = await resActivities.json();

      setRekap(dataRekap);
      setActivities(dataActivities);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Export CSV/Excel Function
  const handleExportExcel = () => {
    if (!rekap) return;

    // Build beautiful multi-section CSV report
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Title
    csvContent += "CAMPUS ATTENDANCE SYSTEM - SUMMARY REPORT\n";
    csvContent += `Generated Date, ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

    // 1. Overall Totals
    csvContent += "OVERALL ATTENDANCE METRICS\n";
    csvContent += `Total Enrolled Students, ${rekap.totals.participants}\n`;
    csvContent += `Total Presents (Hadir), ${rekap.totals.presents}\n`;
    csvContent += `Total Absences (Alfa), ${rekap.totals.absences}\n`;
    csvContent += `Total Excused/Sick (Izin/Sakit), ${rekap.totals.excused}\n`;
    csvContent += `Total Unconfirmed (Terdaftar), ${rekap.totals.registered}\n\n`;

    // 2. Summary by Activity
    csvContent += "SUMMARY BY CAMPUS ACTIVITY\n";
    csvContent += "Activity ID, Activity Name, Organizer, Status, Registered Participants, Presents (Hadir), Absences (Alfa), Excused (Izin/Sakit), Unconfirmed (Terdaftar)\n";
    rekap.summaryByActivity.forEach(act => {
      csvContent += `${act.activity_id}, "${act.activity_name.replace(/"/g, '""')}", "${act.organizer.replace(/"/g, '""')}", ${act.status}, ${act.participants}, ${act.presents}, ${act.absences}, ${act.excused}, ${act.registered}\n`;
    });
    csvContent += "\n";

    // 3. Summary by Date
    csvContent += "SUMMARY BY DATE\n";
    csvContent += "Date, Presents (Hadir), Absences (Alfa), Unconfirmed (Terdaftar)\n";
    rekap.summaryByDate.forEach(item => {
      csvContent += `${item.date}, ${item.presents}, ${item.absences}, ${item.registered}\n`;
    });

    // Download Trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campus_attendance_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Filter summaries based on user selection
  const filteredActivitiesSummary = rekap?.summaryByActivity.filter(act => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      act.activity_name.toLowerCase().includes(term) ||
      act.organizer.toLowerCase().includes(term)
    );

    const matchesId = selectedActivityId === 'All' || act.activity_id.toString() === selectedActivityId;

    return matchesSearch && matchesId;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in print-container">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance Summary Reports</h2>
          <p className="text-xs text-slate-400">Chronological activity logs, participant summaries, and metrics reporting</p>
        </div>
        
        {/* Export buttons (hidden during print) */}
        <div className="no-print flex gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            disabled={!rekap}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel (CSV)
          </button>
          
          <button
            onClick={handlePrintPDF}
            disabled={!rekap}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-55 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-800/10 transition active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print / Save to PDF
          </button>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Computing attendance aggregates...</p>
        </div>
      ) : rekap ? (
        <div className="space-y-6">
          {/* Summary Metric Bento Grid Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Cards */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Participants</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-800">{rekap.totals.participants}</span>
                <span className="text-xs text-slate-400">students</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Presents (Hadir)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-emerald-600">{rekap.totals.presents}</span>
                <span className="text-xs text-slate-400">logs</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absences (Alfa)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-red-600">{rekap.totals.absences}</span>
                <span className="text-xs text-slate-400">logs</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sakit & Izin</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-amber-600">{rekap.totals.excused}</span>
                <span className="text-xs text-slate-400">logs</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unconfirmed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-sky-600">{rekap.totals.registered}</span>
                <span className="text-xs text-slate-400">logs</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Content panels */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Filter controls (no-print) */}
            <div className="no-print p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter activity summaries by name or host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity Filter:</span>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="All">All Activities</option>
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>{act.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table 1: Summary by Activity */}
            <div className="p-6">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-sky-600 shrink-0" />
                Attendance Breakdowns by Campus Activity
              </h3>

              {filteredActivitiesSummary.length > 0 ? (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                        <th className="px-5 py-3">Activity Title</th>
                        <th className="px-5 py-3">Organizer</th>
                        <th className="px-5 py-3 text-center">Registrations</th>
                        <th className="px-5 py-3 text-center text-emerald-700">Presents</th>
                        <th className="px-5 py-3 text-center text-red-700">Absences</th>
                        <th className="px-5 py-3 text-center text-amber-700">Sakit/Izin</th>
                        <th className="px-5 py-3 text-center">Unconfirmed</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {filteredActivitiesSummary.map(act => (
                        <tr key={act.activity_id} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-800">{act.activity_name}</td>
                          <td className="px-5 py-3.5 text-slate-500 font-medium">{act.organizer}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{act.participants}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-emerald-600 bg-emerald-50/20">{act.presents}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-red-600 bg-red-50/20">{act.absences}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-amber-600 bg-amber-50/20">{act.excused}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-sky-600">{act.registered}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              act.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {act.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">No activity reports found matching current filters.</p>
              )}
            </div>
          </div>

          {/* Table 2: Chronological Attendance Summary by Date */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-sky-600 shrink-0" />
              Chronological Summary by Date
            </h3>

            {rekap.summaryByDate.length > 0 ? (
              <div className="overflow-x-auto border border-slate-100 rounded-xl max-w-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-center text-emerald-700">Presents (Hadir)</th>
                      <th className="px-5 py-3 text-center text-red-700">Absences (Alfa)</th>
                      <th className="px-5 py-3 text-center">Unconfirmed Registrations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {rekap.summaryByDate.map(item => (
                      <tr key={item.date} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-700">{item.date}</td>
                        <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{item.presents} logs</td>
                        <td className="px-5 py-3.5 text-center font-bold text-red-600">{item.absences} logs</td>
                        <td className="px-5 py-3.5 text-center font-medium text-slate-500">{item.registered} logs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6">No historical records mapped by date.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400 shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-200 mb-2 mx-auto" />
          <p className="text-sm font-medium">Failed to compile reports. Try reloading the page.</p>
        </div>
      )}
    </div>
  );
};
