import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  ArrowRight,
  Share2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../utils/audio';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-drjxcpdjwzlbrhuyfb2spu-980567763920.asia-southeast1.run.app';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    sound.playReceive();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeInstall = async () => {
    sound.playReceive();
    if (isInstallable) {
      await install();
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-lg max-h-[92dvh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                Download & Install Android App
              </h2>
              <p className="text-xs text-indigo-100 opacity-90">
                Install as native app icon or download APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Status banner if already running installed */}
          {isInstalled && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>VC Community is already running as an installed application on this device!</span>
            </div>
          )}

          {/* METHOD 1: Instant Android Direct Install (Recommended) */}
          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                Method 1 · Fastest
              </span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Install Directly on Android (WebAPK)
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              No manual file installation needed! Android automatically generates and installs the official app icon onto your home screen with full offline capability.
            </p>

            {isInstallable ? (
              <button
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>1-Tap Install VC Community App</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>How to install in Chrome/Browser:</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">1</span>
                  <span>Tap the <strong>three dots (⋮)</strong> at the top right of your browser.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">2</span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">3</span>
                  <span>Tap <strong>Add</strong>. An app icon will appear right on your phone's home screen!</span>
                </div>
              </div>
            )}
          </div>

          {/* METHOD 2: Standalone .APK File Generation via PWABuilder */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-700 text-white">
                Method 2
              </span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Generate Standalone .APK File
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              If you specifically want a downloadable <strong>.apk</strong> or <strong>.aab</strong> package file for Android devices, you can generate it in 1 click using PWABuilder:
            </p>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-md flex items-center justify-center gap-2 transition-all text-center"
            >
              <span>Generate .APK on PWABuilder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="mt-2 text-[11px] text-zinc-400">
              Clicking above opens PWABuilder with your app pre-loaded. Click <strong>"Package for Android"</strong> to download the compiled `.apk`.
            </div>
          </div>

          {/* Share / Copy App Link */}
          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
            <div className="truncate text-xs text-zinc-500 font-mono">
              {appUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 flex items-center gap-1 shrink-0"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};
