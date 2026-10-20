import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Zap, 
  User as UserIcon, 
  Scissors, 
  ArrowUp, 
  Sliders, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { sound } from '../utils/audio';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  members: User[];
  onRefreshMembers: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  members,
  onRefreshMembers,
}) => {
  const [selectedMemberForWallet, setSelectedMemberForWallet] = useState<User | null>(null);
  const [currencyAmount, setCurrencyAmount] = useState('100000');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Cut Power Person into Normal Person
  const handleCutPowerPerson = (user: User) => {
    const res = storage.cutPowerPersonToNormal(user.id);
    if (res.success) {
      sound.playRoleAlert();
      showNotification(`Demoted ${user.name} from Power Person to Normal Person!`);
      onRefreshMembers();
    }
  };

  // Promote Normal to Power Person
  const handlePromoteToPower = (user: User) => {
    const res = storage.promoteToPowerPerson(user.id);
    if (res.success) {
      confetti({ particleCount: 60, spread: 60 });
      sound.playCoin();
      showNotification(`Elevated ${user.name} to Power Person!`);
      onRefreshMembers();
    }
  };

  // Switch Wallet VC Currency for Member
  const handleSwitchCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForWallet) return;
    const amount = parseInt(currencyAmount, 10);
    if (isNaN(amount) || amount < 0) return;

    storage.updateWalletBalance(selectedMemberForWallet.id, amount, 'Super Admin decree');
    sound.playCoin();
    showNotification(`Switched ${selectedMemberForWallet.name}'s wallet to ${amount.toLocaleString()} VC currency!`);
    setSelectedMemberForWallet(null);
    onRefreshMembers();
  };

  const powerPersons = members.filter((m) => m.role === 'power');
  const normalPersons = members.filter((m) => m.role === 'normal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">Super Admin Supreme Control</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                  Supreme Rank
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Super Admin can control Power Persons (cut to Normal) & switch wallet currency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Success toast alert */}
        {successToast && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* SECTION 1: POWER PERSONS MANAGEMENT (CUT POWER PERSON INTO NORMAL PERSON) */}
          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-zinc-800/40 border border-amber-200/80 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Cut Power Person into Normal Person
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {powerPersons.length} Active Power Persons
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              As Super Admin, you hold supreme veto power. Cutting a Power Person revokes their center chat privileges and aligns their future messages on the left side.
            </p>

            {powerPersons.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center text-xs text-zinc-400">
                No active Power Persons found in community. You can promote Normal members below!
              </div>
            ) : (
              <div className="space-y-2.5">
                {powerPersons.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 keep-colorful-image"
                      />
                      <div>
                        <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                            Power Person
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Balance: {p.walletBalance.toLocaleString()} VC currency
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* CUT POWER PERSON BUTTON (User's specific request) */}
                      <button
                        onClick={() => handleCutPowerPerson(p)}
                        className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Cut to Normal Person</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedMemberForWallet(p);
                          setCurrencyAmount(p.walletBalance.toString());
                        }}
                        className="py-2 px-3 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Switch VC
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: NORMAL MEMBERS MANAGEMENT (OPTION TO ELEVATE OR SWITCH WALLET) */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Normal Persons</h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">{normalPersons.length} Members</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {normalPersons.map((norm) => (
                <div
                  key={norm.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={norm.avatar}
                      alt={norm.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover keep-colorful-image"
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">{norm.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {norm.walletBalance.toLocaleString()} VC currency
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePromoteToPower(norm)}
                      className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Promote to Power</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMemberForWallet(norm);
                        setCurrencyAmount(norm.walletBalance.toString());
                      }}
                      className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Switch VC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nested Currency Switch Form Modal */}
        <AnimatePresence>
          {selectedMemberForWallet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm">Switch Currency for {selectedMemberForWallet.name}</h4>
                  <button onClick={() => setSelectedMemberForWallet(null)} className="text-zinc-400">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSwitchCurrency} className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">New Balance in VC currency:</label>
                    <input
                      type="number"
                      min="0"
                      value={currencyAmount}
                      onChange={(e) => setCurrencyAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-sm font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForWallet(null)}
                      className="flex-1 py-2 rounded-lg text-xs border border-zinc-300 dark:border-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-500 text-black shadow"
                    >
                      Set Balance
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
