import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface SecurityVerificationViewProps {
  onVerify: () => void;
}

export const SecurityVerificationView: React.FC<SecurityVerificationViewProps> = ({ onVerify }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) {
      setErrorMsg('Please enter the security passcode / Silakan masukkan kode akses.');
      return;
    }

    setIsVerifying(true);

    // Short simulated cryptographic validation lag for a highly professional look
    setTimeout(() => {
      const allowedPasscodes = ['2026', 'unaba2026', 'admin123'];
      if (allowedPasscodes.includes(cleanPasscode)) {
        setIsSuccess(true);
        setTimeout(() => {
          onVerify();
        }, 800);
      } else {
        setErrorMsg('Invalid passcode. Access Denied. / Kode akses salah. Akses Ditolak.');
        setIsVerifying(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background radial soft light gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main card box */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-[32px] max-w-md w-full p-8 md:p-10 shadow-2xl shadow-black/80 relative z-10 transition-all duration-300">
        
        {/* Header Indicator */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`p-4 rounded-2xl mb-5 transition-all duration-500 ${
            isSuccess 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 scale-110' 
              : errorMsg 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-shake' 
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <ShieldAlert className="h-8 w-8" />
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
            Security Verification
          </h2>
          <p className="text-xs font-semibold text-orange-400 mt-1 uppercase tracking-wider">
            Verifikasi Keamanan
          </p>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mt-3">
            This portal is strictly protected. Please enter the secure passcode to unlock and continue.
          </p>
          <p className="text-[11px] text-slate-500 leading-normal max-w-xs mt-1 italic">
            Portal ini dilindungi oleh sistem keamanan. Masukkan kode sandi untuk membuka akses.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3.5 flex items-center gap-2.5 mb-6 text-xs font-medium animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Access Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
              Secure Passcode / Kode Sandi *
            </label>
            
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                disabled={isVerifying || isSuccess}
                placeholder="Enter access passcode (e.g. 2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition disabled:opacity-50"
              />
              
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPasscode(!showPasscode)}
                disabled={isVerifying || isSuccess}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition focus:outline-none disabled:opacity-30"
              >
                {showPasscode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || isSuccess}
            className={`w-full py-3 text-sm font-bold rounded-xl shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/15'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/15 disabled:opacity-60'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-4.5 w-4.5" />
                Access Granted! Redirecting...
              </>
            ) : isVerifying ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Verifying Secure Token...
              </>
            ) : (
              'Verify Access Key'
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="mt-8 text-center border-t border-slate-900 pt-5">
          <p className="text-[10px] text-slate-600 font-medium">
            Authorized Personnel Only • Campus Portal Verification
          </p>
          <p className="text-[10px] text-sky-500/50 mt-1 font-semibold tracking-wide uppercase">
            Default Passcode Hint: 2026
          </p>
        </div>

      </div>
    </div>
  );
};
