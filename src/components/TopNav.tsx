import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Users, 
  LogOut, 
  MessageSquare, 
  Wallet as WalletIcon, 
  ChevronRight, 
  Coins,
  ArrowLeft,
  Download,
  Smartphone,
  Volume2,
  Radio,
  ShoppingCart
} from 'lucide-react';
import { User, UserRole, ThemeMode, NeonColor } from '../types';
import { getRoleTitle } from '../services/storage';
import { sound } from '../utils/audio';

interface TopNavProps {
  currentUser: User;
  activeTab: 'community' | 'personal' | 'wallet' | 'cart';
  onTabChange: (tab: 'community' | 'personal' | 'wallet' | 'cart') => void;
  onOpenSettings: () => void;
  onOpenAccounts: () => void;
  onOpenSuperAdminModal: () => void;
  onOpenPhoneMesh?: () => void;
  onOpenInstallModal?: () => void;
  onPlayStartupSound?: () => void;
  onSignOut: () => void;
  themeMode: ThemeMode;
  neonColor: NeonColor;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenAccounts,
  onOpenSuperAdminModal,
  onOpenPhoneMesh,
  onOpenInstallModal,
  onPlayStartupSound,
  onSignOut,
  themeMode,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'Super Admin',
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'power':
        return {
          icon: <Zap className="w-3.5 h-3.5" />,
          label: 'Power Person',
          classes: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'normal':
        return {
          icon: <UserIcon className="w-3.5 h-3.5" />,
          label: 'Normal Person',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onPlayStartupSound || (() => sound.playWindowsXPStartup())}
              title="Click to play Windows XP Startup Music with VC Logo"
              className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm font-black text-xs sm:text-sm tracking-tight hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-75 blur-xs transition-opacity" />
              <span className="relative z-10">VC</span>
            </button>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-white">
                  VC Community
                </span>
                <button
                  type="button"
                  onClick={onPlayStartupSound || (() => sound.playWindows7Startup())}
                  title="Play Windows 7 Professional Startup Sound"
                  className="px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[9px] font-mono font-bold flex items-center gap-1 transition-colors border border-cyan-500/20"
                >
                  <Volume2 className="w-2.5 h-2.5" />
                  <span>Win 7 Sound</span>
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                <span className="capitalize">{getRoleTitle(currentUser.role)}</span>
                <span className="opacity-40">·</span>
                <span className="text-emerald-500">Online</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <button
              onClick={() => {
                onTabChange('community');
                sound.playReceive();
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'community'
                  ? themeMode === 'neon'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community Chart</span>
            </button>

            <button
              onClick={() => {
                onTabChange('personal');
                sound.playReceive();
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'personal'
                  ? themeMode === 'neon'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Personal Chat</span>
            </button>

            <button
              onClick={() => {
                onTabChange('wallet');
                sound.playCoin();
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'wallet'
                  ? themeMode === 'neon'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>Wallet</span>
            </button>

            <button
              onClick={() => {
                onTabChange('cart');
                sound.playAddToCart();
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? themeMode === 'neon'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-amber-400'
                    : 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
              <span>VC Cart 🛒</span>
            </button>
          </nav>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Phone Mesh Live Network Status Trigger */}
            {onOpenPhoneMesh && (
              <button
                type="button"
                onClick={() => {
                  onOpenPhoneMesh();
                  sound.playPop();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Phone Mesh: Messages travel across all connected phones"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
                <span className="hidden sm:inline">Phone Mesh</span>
              </button>
            )}

            {/* Profile Picture button */}
            <div className="relative">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  sound.playReceive();
                }}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/40 transition-all focus:outline-none"
              aria-label="User Profile Menu"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-sm keep-colorful-image"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {currentUser.walletBalance.toLocaleString()} VC
                </span>
              </div>
            </button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
                  >
                    {/* Profile Header */}
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 keep-colorful-image"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{currentUser.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.classes}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Wallet VC Currency:</span>
                        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {currentUser.walletBalance.toLocaleString()} VC
                        </span>
                      </div>
                    </div>

                    {/* Menu Sections: Settings, Accounts, Super Admin Powers */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenSettings();
                          sound.playReceive();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <SettingsIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold">Settings</div>
                            <div className="text-[11px] text-zinc-400">Dark B&W, Normal, Neon & Themes</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      {onOpenPhoneMesh && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenPhoneMesh();
                            sound.playPop();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                              <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-white">Phone Mesh Network</div>
                              <div className="text-[11px] text-zinc-400">All phones linked from far</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenAccounts();
                          sound.playReceive();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold">Accounts</div>
                            <div className="text-[11px] text-zinc-400">Switch profile & permissions</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      {/* Super Admin Control Panel option */}
                      {currentUser.role === 'super_admin' && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenSuperAdminModal();
                            sound.playRoleAlert();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors text-left border border-amber-500/20"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold">Super Admin Control</div>
                              <div className="text-[11px] opacity-80">Cut power person & switch currency</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-amber-500" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onTabChange('wallet');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <Coins className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold">VC Wallet & Graph</div>
                            <div className="text-[11px] text-zinc-400">Upper and down income charts</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenInstallModal?.();
                          sound.playReceive();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>Download APK / Install</span>
                              <span className="text-[9px] px-1 py-0.2 bg-indigo-600 text-white rounded font-semibold">APK</span>
                            </div>
                            <div className="text-[11px] opacity-80">Install on phone or get APK file</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                      </button>

                      {/* Windows 7 Professional Startup Music button with VC Logo */}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          if (onPlayStartupSound) {
                            onPlayStartupSound();
                          } else {
                            sound.playWindows7Startup();
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 border border-cyan-200/80 dark:border-cyan-900/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-sm font-black text-xs">
                            VC
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>Windows 7 Professional Chime</span>
                              <span className="text-[9px] px-1 py-0.2 bg-cyan-600 text-white rounded font-bold">Win 7</span>
                            </div>
                            <div className="text-[11px] opacity-80">Play VC Windows 7 sound & Aero animation</div>
                          </div>
                        </div>
                        <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </button>
                    </div>

                    {/* Footer actions: Sign out & Back */}
                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onSignOut();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-Zone Ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around safe-bottom shadow-lg">
        <button
          onClick={() => {
            onTabChange('community');
            sound.playReceive();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'community'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-zinc-400 dark:text-zinc-500 font-medium'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Community</span>
        </button>

        <button
          onClick={() => {
            onTabChange('personal');
            sound.playReceive();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'personal'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-zinc-400 dark:text-zinc-500 font-medium'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Personal</span>
        </button>

        <button
          onClick={() => {
            onTabChange('wallet');
            sound.playCoin();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'wallet'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-zinc-400 dark:text-zinc-500 font-medium'
          }`}
        >
          <WalletIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Wallet</span>
        </button>

        <button
          onClick={() => {
            onTabChange('cart');
            sound.playAddToCart();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'cart'
              ? 'text-amber-500 font-bold scale-105'
              : 'text-zinc-400 dark:text-zinc-500 font-medium'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5 text-amber-500" />
          <span className="text-[10px] tracking-tight font-bold">Cart 🛒</span>
        </button>
      </nav>
    </>
  );
};
