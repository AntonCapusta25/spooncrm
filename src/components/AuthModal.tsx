import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CrmProfile, UserRole } from '../types/crm';
import { Lock, Mail, User, Shield, Wrench, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: CrmProfile[];
  currentProfile: CrmProfile | null;
  onSelectProfile: (profile: CrmProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  profiles,
  currentProfile,
  onSelectProfile
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'fast' | 'email'>('fast');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email / Password submission via Supabase Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up new salesperson
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split('@')[0], role: 'salesperson' }
          }
        });

        if (authError) throw authError;

        // Insert into crm_profiles
        const { data: newProfile, error: profileError } = await supabase
          .from('crm_profiles')
          .insert({
            user_id: authData.user?.id,
            name: name || email.split('@')[0],
            email: email,
            role: 'salesperson'
          })
          .select()
          .single();

        if (profileError) throw profileError;

        onSelectProfile(newProfile);
        onClose();
      } else {
        // Sign in existing user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        // Match with crm_profiles
        const matchedProfile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (matchedProfile) {
          onSelectProfile(matchedProfile);
        } else {
          // If no CRM profile exists, create one with role salesperson
          const { data: newProfile } = await supabase
            .from('crm_profiles')
            .upsert({
              user_id: authData.user?.id,
              name: authData.user?.user_metadata?.display_name || email.split('@')[0],
              email: email,
              role: 'salesperson'
            }, { onConflict: 'email' })
            .select()
            .single();

          if (newProfile) onSelectProfile(newProfile);
        }

        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastLogin = (profile: CrmProfile) => {
    onSelectProfile(profile);
    localStorage.setItem('spoonful_crm_profile_id', profile.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white border border-[#EDEDEB] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-[#37352F]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-[#EDEDEB]">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-sm">
            🥄
          </div>
          <h2 className="text-lg font-bold text-[#37352F] tracking-tight">
            Spoonful Field Operations
          </h2>
          <p className="text-xs text-[#787774] mt-1">
            Choose your team profile or sign in with your account
          </p>
        </div>

        {/* Tab switch between 1-Click Fast Pass and Email/Password */}
        <div className="flex border-b border-[#EDEDEB] bg-[#F7F6F3] text-xs">
          <button
            onClick={() => setMode('fast')}
            className={`flex-1 py-2.5 font-semibold transition-colors ${
              mode === 'fast'
                ? 'bg-white text-[#37352F] border-b-2 border-[#37352F]'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            ⚡ Team Fast Select
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 py-2.5 font-semibold transition-colors ${
              mode === 'email'
                ? 'bg-white text-[#37352F] border-b-2 border-[#37352F]'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            🔒 Email & Password
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {mode === 'fast' ? (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-[#787774] block uppercase tracking-wider mb-2">
                Select Active Account:
              </span>

              {profiles.map((p) => {
                const isCurrent = currentProfile?.id === p.id;
                const isOleksandr = p.role === 'pos_installer';

                return (
                  <div
                    key={p.id}
                    onClick={() => handleFastLogin(p)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#F7F6F3] border-[#37352F] ring-1 ring-[#37352F]'
                        : isOleksandr
                        ? 'bg-[#FFF8F7] border-[#FFE2DD] hover:bg-[#FFE2DD]'
                        : 'bg-white border-[#EDEDEB] hover:bg-[#F7F6F3]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isOleksandr ? 'bg-[#FFE2DD] text-[#D44026]' : 'bg-[#E3E2E0] text-[#37352F]'
                      }`}>
                        {isOleksandr ? '⚡' : p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#37352F] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7B54]" />}
                        </div>
                        <div className="text-[11px] text-[#787774]">
                          {p.email} • <span className="capitalize font-medium">{isOleksandr ? 'POS Specialist' : p.role}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#9B9A97]" />
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
              {error && (
                <div className="p-2.5 rounded bg-[#FFE2DD] text-[#D44026] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isSignUp && (
                <div>
                  <label className="text-[11px] font-semibold text-[#787774] block mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jansen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#37352F]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-[#787774] block mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@spoonful.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#37352F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#787774] block mb-1">
                  Password:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#37352F]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-semibold text-xs py-2 rounded-lg transition-colors mt-2"
              >
                {isLoading ? 'Authenticating...' : isSignUp ? 'Create Salesperson Account' : 'Sign In with Supabase'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[11px] text-[#787774] hover:underline"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need a new salesperson account? Sign up'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F7F6F3] border-t border-[#EDEDEB] text-center text-[11px] text-[#787774]">
          Connected to Supabase Project: <span className="font-mono text-[#37352F]">qttdcibitumvwsrxqeld</span>
        </div>

      </div>
    </div>
  );
};
