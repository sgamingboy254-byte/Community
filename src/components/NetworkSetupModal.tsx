import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Wifi, Radio, Globe, Shield, Sparkles, Check, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

export type NetworkChoice = 'enable' | 'for_this_time' | 'not_now';

interface NetworkSetupModalProps {
  isOpen: boolean;
  onSelect: (choice: NetworkChoice) => void;
}

export const NetworkSetupModal: React.FC<NetworkSetupModalProps> = ({ isOpen, onSelect }) => {
  if (!isOpen) return null;

  const handleChoice = (choice: NetworkChoice) => {
    sound.playReceive();
    onSelect(choice);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        {/* Ambient Aurora Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/25 via-blue-600/30 to-indigo-600/25 rounded-full blur-3xl opacity-75" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-7 shadow-2xl border border-white/30 dark:border-white/10 text-zinc-900 dark:text-white"
        >
          {/* Header Icon & Monogram */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0 border border-white/40">
              <Radio className="w-6 h-6 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Independent Network
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  Phone Direct
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Independent mobile device connectivity setup
              </p>
            </div>
          </div>

          {/* Explanatory Callout */}
          <div className="mb-5 p-3.5 rounded-2xl bg-white/40 dark:bg-zinc-800/40 border border-white/40 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300 space-y-2">
            <p className="leading-relaxed">
              This app is engineered with <strong className="text-zinc-900 dark:text-white">independent network routing</strong>. It connects directly using your phone&apos;s internet to link seamlessly with the live ecosystem (AI Studio, GitHub repository & real-time community peers).
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono pt-1 text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-500" /> Direct Phone Network
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> AI Studio Ecosystem
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" /> Real-Time Sync
              </span>
            </div>
          </div>

          {/* The 3 Required Options */}
          <div className="space-y-2.5 mb-6">
            {/* Option 1: Enable (Permanent) */}
            <button
              type="button"
              onClick={() => handleChoice('enable')}
              className="group w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-left transition-all shadow-md hover:shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Option 1: Enable Network</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] text-white/80">
                    Always use phone network to connect with AI Studio & GitHub ecosystem
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Option 2: For this time (Session only) */}
            <button
              type="button"
              onClick={() => handleChoice('for_this_time')}
              className="group w-full p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white/90 dark:hover:bg-zinc-800 border border-white/60 dark:border-white/10 text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    Option 2: For This Time
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Enable phone network for current session only (no permanent save)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Option 3: Not now (Offline mode) */}
            <button
              type="button"
              onClick={() => handleChoice('not_now')}
              className="group w-full p-3.5 rounded-2xl bg-white/30 dark:bg-zinc-900/40 hover:bg-white/50 dark:hover:bg-zinc-800/50 border border-white/30 dark:border-white/10 text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                    Option 3: Not Now
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Operate in independent local offline mode without remote network
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 text-center font-mono">
            You can change this network preference anytime from Settings or Top Navigation.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
