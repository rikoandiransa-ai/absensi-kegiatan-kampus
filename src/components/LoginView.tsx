import React, { useState } from 'react';
import { GraduationCap, Key, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Please input both your Username/Student ID and Password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(username.trim(), password);
      if (!result.success) {
        setErrorMsg(result.message || 'Invalid username, Student ID, or password.');
      }
    } catch (err: any) {
      setErrorMsg('Network error. Failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Outer Card Wrapper */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-100 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-slate-100 min-h-[540px]">
        
        {/* Left Side: Brand Accent Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-12 translate-x-12">
            <GraduationCap className="w-80 h-80 text-white" />
          </div>

          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight tracking-wide">CAMPUS</h2>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">(UNABA)</p>
            </div>
          </div>

          {/* Core message */}
          <div className="space-y-4 my-12 z-10">
            <h3 className="text-[50px] font-bold uppercase tracking-tight leading-none text-white">
              UNIVERSITAS <span className="text-orange-400">ANAK BANGSA</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm uppercase tracking-wider font-semibold">
              Campus Activity Attendance System
            </p>
          </div>

          {/* System status footer */}
          <div className="text-[10px] text-slate-500 font-medium">
          </div>
        </div>

        {/* Right Side: Authentication form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="space-y-2 mb-8 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-xs text-slate-400">Enter your credentials below to log in</p>
          </div>

          {/* Login Error Notification */}
          {errorMsg && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-2xl p-4 flex items-center gap-3 mb-6 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Student ID input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Username or Student ID *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. admin or 202601001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/15 transition"
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Key className="h-4 w-4 text-slate-400" />
                Password *
              </label>
              <input
                type="password"
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/15 transition"
              />
            </div>

            {/* Form Actions */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-xl shadow-sky-600/15 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Dashboard'
              )}
            </button>
          </form>


        </div>

      </div>
    </div>
  );
};
