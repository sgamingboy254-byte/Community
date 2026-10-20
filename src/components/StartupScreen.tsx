import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles, Disc } from 'lucide-react';
import { sound } from '../utils/audio';

interface StartupScreenProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ isOpen, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const audioStartedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      audioStartedRef.current = false;
      return;
    }

    // Automatically trigger Windows 7 Professional startup sound immediately
    const startAudio = () => {
      if (!audioStartedRef.current) {
        audioStartedRef.current = true;
        sound.playWindows7Startup();
      }
    };

    // Attempt direct automatic play immediately upon mount
    startAudio();

    // Fallback one-time global touch/click/key listener in case browser blocked autoplay
    const handleFirstGesture = () => {
      startAudio();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    // Progress smoothly and automatically complete after 3.4 seconds (matching the Windows 7 4-note chime & glass decay)
    const startTime = Date.now();
    const duration = 3400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => {
          onFinish();
        }, 300);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [isOpen, onFinish]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white select-none overflow-hidden cursor-default"
      >
        {/* Windows 7 Aero Glass Aurora Glow Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/30 to-indigo-600/25 rounded-full blur-3xl opacity-85" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
        </div>

        {/* Central Aero Glass Brand Container */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md w-full">
          {/* Windows 7 4-Color Glowing Light Orb around the VC Logo Emblem */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-6"
          >
            {/* The 4 Windows 7 Radiant Light Petals (Red, Green, Blue, Amber) */}
            <div className="absolute -inset-8 rounded-full flex items-center justify-center pointer-events-none animate-win7-orb">
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-full bg-rose-500/60 blur-xl" />
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-emerald-500/60 blur-xl" />
              <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full bg-blue-500/70 blur-xl" />
              <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-amber-500/60 blur-xl" />
            </div>

            {/* Aero Glass Logo Emblem Frame */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/10 dark:bg-zinc-900/40 p-1.5 shadow-2xl border border-white/40 flex items-center justify-center backdrop-blur-2xl ring-1 ring-white/30">
              {/* Gloss Highlight Sheen */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-3xl pointer-events-none" />

              {/* 4 Colored Glass Gem Accents */}
              <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-rose-500 shadow-md shadow-rose-500/80 ring-1 ring-white/60" />
              <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/80 ring-1 ring-white/60" />
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/80 ring-1 ring-white/60" />
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-amber-500 shadow-md shadow-amber-500/80 ring-1 ring-white/60" />

              {/* Bold Metallic "VC" Monogram */}
              <div className="flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-blue-200 drop-shadow-xl">
                  VC
                </span>
              </div>
            </div>
          </motion.div>

          {/* Typography */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="space-y-1.5 mb-7"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              <span>VC Community</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-mono font-bold tracking-wide">
                Windows 7 Pro
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100/70 font-medium">
              Starting network • Windows 7 Professional 4-Note Chime
            </p>
          </motion.div>

          {/* Windows 7 Aero Glass Loading Chime Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="w-full flex flex-col items-center gap-3"
          >
            <div className="w-64 h-3 rounded-full bg-white/10 border border-white/20 p-0.5 overflow-hidden relative backdrop-blur-md shadow-inner">
              {/* Aero Glass Shimmer Bar */}
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/50"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
              <Volume2 className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>Playing Windows 7 Professional Sound...</span>
            </div>
          </motion.div>
        </div>

        {/* Footer Aero Credit */}
        <div className="absolute bottom-6 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>VC Community • Windows 7 Professional Sound Edition</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
