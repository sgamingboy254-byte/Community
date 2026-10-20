import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Zap, 
  User as UserIcon, 
  Check, 
  UserPlus, 
  LogOut, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storage, getRoleTitle, COMMUNITY_CODES } from '../services/storage';
import { sound } from '../utils/audio';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  members: User[];
  onSwitchUser: (user: User) => void;
  onSignOut: () => void;
  onOpenSignIn: () => void;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  members,
  onSwitchUser,
  onSignOut,
  onOpenSignIn,
}) => {
  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    storage.setCurrentUser(user);
    onSwitchUser(user);
    sound.playReceive();
    onClose();
  };

  const handleResetData = () => {
    if (confirm('Reset VC Community data back to default demo state?')) {
      storage.resetAll();
      window.location.reload();
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'power':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'normal':
        return <UserIcon className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[92dvh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Community Accounts</h3>
              <p className="text-xs text-zinc-400">Switch active profile & persona</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Select Profile to Act As:
            </span>
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrent = member.id === currentUser.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectUser(member)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-zinc-800/80 ring-2 ring-indigo-500/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 keep-colorful-image"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
                      </div>

                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {getRoleTitle(member.role)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {member.walletBalance.toLocaleString()} VC
                      </span>
                      {isCurrent && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSignIn();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create / Sign In New Account</span>
            </button>

            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl font-bold text-xs border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};
