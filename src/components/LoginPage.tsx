import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-white text-[#37352F] select-none font-['Inter',sans-serif]">
      <div className="w-full max-w-[340px] space-y-6">
        
        {/* Notion Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-sm">
            🥄
          </div>
          <h1 className="text-xl font-bold text-[#37352F] tracking-tight">
            Log in to Spoonful
          </h1>
          <p className="text-xs text-[#787774]">
            Internal sales & field operations
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-[#FFE2DD] border border-[#F5C0B8] text-[#D44026] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-medium text-[#787774] block mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="name@spoonful.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#37352F] placeholder-[#9B9A97] transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#787774] block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#37352F] placeholder-[#9B9A97] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#37352F] hover:bg-[#201F1D] text-white font-medium text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Continue with email</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#EDEDEB] text-center text-[11px] text-[#9B9A97]">
          Internal tool • Spoonful B.V.
        </div>

      </div>
    </div>
  );
};
