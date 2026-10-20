import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, User as UserIcon, Upload, ArrowRight, Check, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { User, UserRole } from '../types';
import { getRoleFromCode, getRoleTitle, DEFAULT_AVATARS, storage } from '../services/storage';
import { network } from '../services/network';
import { sound } from '../utils/audio';

interface SignInModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Name & Code, 2: Profile Picture
  const [name, setName] = useState('');
  const [communityCode, setCommunityCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [codeError, setCodeError] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);

  if (!isOpen) return null;

  const handleCodeChange = (val: string) => {
    setCommunityCode(val);
    const detected = getRoleFromCode(val);
    if (detected) {
      setRole(detected);
      setCodeError('');
    } else {
      setRole(null);
      if (val.length >= 5) {
        setCodeError('Invalid community code. Please enter your confidential authorization code.');
      } else {
        setCodeError('');
      }
    }
  };


  const handleProceedToAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const detected = getRoleFromCode(communityCode);
    if (!detected) {
      setCodeError('Invalid community code. Please enter a valid confidential authorization code.');
      return;
    }
    setRole(detected);
    sound.playReceive();
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        sound.playReceive();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteSignIn = async (skipAvatar = false) => {
    const finalAvatar = skipAvatar ? DEFAULT_AVATARS[3] : avatar;
    const res = await network.registerUser(name.trim(), communityCode, finalAvatar);

    if (res.success && res.user) {
      storage.setCurrentUser(res.user);
      sound.playCoin();
      onSuccess(res.user);
    } else {
      setCodeError(res.error || 'Failed to authenticate. Please check confidential code.');
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl text-zinc-900 dark:text-zinc-100"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 pt-5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">VC Community Sign In</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {step === 1 ? 'Step 1 of 2: Confidential Authorization' : 'Step 2 of 2: Profile Picture'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm px-2 py-1 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onSubmit={handleProceedToAvatar}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                      Secret Community Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs flex items-center gap-1"
                    >
                      {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showCode ? 'Hide' : 'Peek'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    {/* Confidential Masked Input - Never displays raw codes in plain view */}
                    <input
                      type={showCode ? 'text' : 'password'}
                      required
                      value={communityCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="••••••••"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3 font-mono tracking-widest text-base rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Role Detection Badge - NEVER prints the code digits */}
                  {role && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                        role === 'super_admin'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : role === 'power'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {role === 'super_admin' && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                        {role === 'power' && <Zap className="w-4 h-4 text-purple-500" />}
                        {role === 'normal' && <UserIcon className="w-4 h-4 text-emerald-500" />}
                        <span>Verified Status: {getRoleTitle(role)}</span>
                      </div>
                      <span className="text-[11px] opacity-75 font-semibold text-emerald-500">Authorized ✓</span>
                    </motion.div>
                  )}

                  {codeError && <p className="mt-1.5 text-xs text-rose-500">{codeError}</p>}
                </div>


                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={!name.trim() || !role}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                  >
                    <span>Next: Profile Picture</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="relative inline-block mx-auto mb-2">
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-xl"
                    />
                    <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">{name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{getRoleTitle(role || 'normal')}</div>
                </div>

                {/* Upload from file / gallery */}
                <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    id="avatar-file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="avatar-file" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-xs mb-1">
                      <Upload className="w-4 h-4" />
                      <span>Upload from File or Gallery</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">PNG, JPG or WebP from your device</p>
                  </label>
                </div>

                {/* Or Choose from Preset Avatars */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Or Select an Avatar:</span>
                    <span className="text-[11px] text-zinc-400">Tap to choose</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {DEFAULT_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(av);
                          sound.playReceive();
                        }}
                        className={`relative rounded-full overflow-hidden aspect-square border-2 transition-transform hover:scale-105 ${
                          avatar === av ? 'border-indigo-500 ring-2 ring-indigo-400/50 scale-105' : 'border-transparent'
                        }`}
                      >
                        <img src={av} alt={`Option ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        {avatar === av && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCompleteSignIn(true)}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteSignIn(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enter VC Community</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
