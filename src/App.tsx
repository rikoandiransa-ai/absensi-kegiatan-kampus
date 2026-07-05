import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { LoginView } from './components/LoginView.js';
import { SecurityVerificationView } from './components/SecurityVerificationView.js';
import { DashboardView } from './components/DashboardView.js';
import { StudentDataView } from './components/StudentDataView.js';
import { ActivityDataView } from './components/ActivityDataView.js';
import { AttendanceView } from './components/AttendanceView.js';
import { AttendanceSummaryView } from './components/AttendanceSummaryView.js';
import { Menu, Clock, GraduationCap, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { state, isLoading, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isSiteVerified, setIsSiteVerified] = useState(() => {
    return localStorage.getItem('is_site_verified') === 'true';
  });

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Initializing secure session tunnel...</p>
      </div>
    );
  }



  // Guard: if not authenticated, render Login Page
  if (!state.token) {
    return <LoginView />;
  }

  // Active view router mapping
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView getAuthHeader={getAuthHeader} setActiveTab={setActiveTab} />;
      case 'students':
        return <StudentDataView getAuthHeader={getAuthHeader} />;
      case 'activities':
        return <ActivityDataView getAuthHeader={getAuthHeader} />;
      case 'attendance':
        return <AttendanceView getAuthHeader={getAuthHeader} />;
      case 'summary':
        return <AttendanceSummaryView getAuthHeader={getAuthHeader} />;
      default:
        return <DashboardView getAuthHeader={getAuthHeader} setActiveTab={setActiveTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard(UNABA)';
      case 'students': return 'Student Data Management';
      case 'activities': return 'Campus Activities scheduler';
      case 'attendance': return 'Activity Attendance';
      case 'summary': return 'Attendance Summary Reports';
      default: return 'Campus activity (UNABA)';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {/* 2. Main Content Frame */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <header className="no-print h-16 border-b border-slate-150 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-100/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl text-slate-600"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base capitalize tracking-wide">
              {getPageTitle()}
            </h1>
          </div>

          {/* Time & User Metadata */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/70 border border-slate-200/50 px-3.5 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>
            
            {/* User Badge */}
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-orange-500/10">
                {state.user?.name ? state.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className={`font-bold text-slate-700 leading-tight ${state.user?.name === 'Universitas Anak Bangsa' ? 'text-[25px]' : 'text-xs'}`}>{state.user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize font-medium">{state.user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* View Layout Canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
