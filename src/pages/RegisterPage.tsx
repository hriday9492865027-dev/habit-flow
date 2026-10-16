import React, { useState } from 'react';
import { Radio, Mail, Lock, User, AtSign, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isValidUsername, isValidDisplayName } from '../lib/validators';

interface RegisterPageProps {
  onGoLogin: () => void;
  onGoLanding: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onGoLogin,
  onGoLanding,
}) => {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameVal = isValidDisplayName(displayName);
    if (!nameVal.valid) {
      setError(nameVal.message || 'Invalid display name.');
      return;
    }

    const userVal = isValidUsername(username);
    if (!userVal.valid) {
      setError(userVal.message || 'Invalid username.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, username, displayName);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onGoLanding}
          className="inline-flex items-center gap-2.5 mx-auto mb-3 cursor-pointer focus:outline-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#123B35] flex items-center justify-center text-white shadow-subtle">
            <Radio className="w-6 h-6 text-[#2EC4B1]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#123B35]">FriendFlow</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800">Create your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Share your location securely with trusted friends on your terms
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-floating border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C43D4B] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {(error.includes('already taken') || error.includes('already exists') || error.includes('Sign In')) && (
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="self-start text-[11px] font-bold text-[#167D70] hover:underline bg-white px-2.5 py-1 rounded-lg border border-red-200/60 shadow-xs"
                >
                  Go to Sign In &rarr;
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Miller"
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 focus:border-[#167D70]"
                />
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unique Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. sarah_m"
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 focus:border-[#167D70]"
                />
                <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Used by friends to search and find you.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 focus:border-[#167D70]"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 focus:border-[#167D70]"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#DDF5E9]/50 border border-[#167D70]/20 flex items-start gap-2 text-xs text-[#123B35]">
              <ShieldCheck className="w-4 h-4 text-[#167D70] shrink-0 mt-0.5" />
              <span>
                <strong>Sharing is OFF by default.</strong> Your coordinates remain private until you
                explicitly choose to enable live sharing.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-[#167D70]/40 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onGoLogin}
                className="font-bold text-[#167D70] hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
