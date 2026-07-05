import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  FileSpreadsheet, 
  LogOut, 
  Menu, 
  X, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const { state, logout } = useAuth();
  const isAdmin = state.user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'student'] },
    { id: 'students', label: 'Student Data', icon: Users, roles: ['admin'] },
    { id: 'activities', label: 'Campus Activities', icon: Calendar, roles: ['admin', 'student'] },
    { id: 'attendance', label: 'Attendance Registration', icon: ClipboardCheck, roles: ['admin', 'student'] },
    { id: 'summary', label: 'Attendance Summary', icon: FileSpreadsheet, roles: ['admin', 'student'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(state.user?.role || ''));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg shadow-md shadow-orange-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-white tracking-wide uppercase">CAMPUS</h1>
              <p className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase">(UNABA)</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Account Quick Info */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Signed in as</p>
          <p className={`font-medium text-slate-200 leading-tight ${state.user?.name === 'Universitas Anak Bangsa' ? 'text-[25px]' : 'truncate'}`}>{state.user?.name}</p>
          <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase ${
            isAdmin ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            {state.user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-sky-600 text-white font-semibold shadow-lg shadow-sky-600/15' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Trigger Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all duration-150"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
