import React from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Check, 
  Zap, 
  Palette,
  Eye,
  Activity,
  Download,
  Smartphone
} from 'lucide-react';
import { AppSettings, ThemeMode, NeonColor, ChatBubbleTheme } from '../types';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenInstallModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenInstallModal,
}) => {
  if (!isOpen) return null;

  const handleThemeModeChange = (mode: ThemeMode) => {
    onUpdateSettings({ ...settings, themeMode: mode });
    sound.playReceive();
  };

  const handleNeonColorChange = (color: NeonColor) => {
    onUpdateSettings({ ...settings, neonColor: color, themeMode: 'neon' });
    sound.playReceive();
  };

  const handleChatThemeChange = (chatTheme: ChatBubbleTheme) => {
    onUpdateSettings({ ...settings, chatBubbleTheme: chatTheme });
    sound.playReceive();
  };

  const toggleSmoothAnimations = () => {
    onUpdateSettings({ ...settings, smoothAnimations: !settings.smoothAnimations });
    sound.playReceive();
  };

  const toggleSound = () => {
    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
    sound.playReceive();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg max-h-[92dvh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">VC Community Settings</h2>
              <p className="text-xs text-zinc-400">Themes, visual fidelity & motion controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Main Mode: Normal vs Dark B&W vs Neon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Display Theme Mode
              </label>
              <span className="text-[11px] text-zinc-400">Default is Normal (Colourful)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Normal Mode (Default Colorful) */}
              <button
                type="button"
                onClick={() => handleThemeModeChange('normal')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  settings.themeMode === 'normal'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {settings.themeMode === 'normal' && (
                  <span className="absolute top-2 right-2 text-indigo-600">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white mb-2 shadow-sm">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Normal</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Default colourful mode for all features
                </div>
              </button>

              {/* Dark Mode (Black & White Monochrome UI, Colorful Images) */}
              <button
                type="button"
                onClick={() => handleThemeModeChange('dark')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  settings.themeMode === 'dark'
                    ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-500/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {settings.themeMode === 'dark' && (
                  <span className="absolute top-2 right-2 text-white">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg bg-black border border-white/40 flex items-center justify-center text-white mb-2 shadow-sm">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Dark Mode</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Black & White UI · Images stay colourful!
                </div>
              </button>

              {/* Neon Setting */}
              <button
                type="button"
                onClick={() => handleThemeModeChange('neon')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  settings.themeMode === 'neon'
                    ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400/50 neon-glow-cyan'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {settings.themeMode === 'neon' && (
                  <span className="absolute top-2 right-2 text-cyan-400">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-cyan-400 flex items-center justify-center text-cyan-400 mb-2 shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Neon Mode</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Cyber luminescence & vivid accents
                </div>
              </button>
            </div>

            {/* Note on Image Preservation */}
            <div className="mt-2 p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                <strong>Image Preservation Policy:</strong> Even in Dark Black & White mode, all colorful images uploaded by users retain 100% natural color.
              </span>
            </div>
          </div>

          {/* Neon Palette Presets (if Neon mode is active or to activate Neon) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Neon Accent Colors
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { id: 'cyan', label: 'Cyan', color: 'bg-cyan-400', border: 'border-cyan-400' },
                  { id: 'purple', label: 'Violet', color: 'bg-purple-500', border: 'border-purple-500' },
                  { id: 'emerald', label: 'Emerald', color: 'bg-emerald-400', border: 'border-emerald-400' },
                  { id: 'amber', label: 'Solar', color: 'bg-amber-400', border: 'border-amber-400' },
                  { id: 'pink', label: 'Neon Pink', color: 'bg-pink-500', border: 'border-pink-500' },
                ] as const
              ).map((neon) => (
                <button
                  key={neon.id}
                  type="button"
                  onClick={() => handleNeonColorChange(neon.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    settings.neonColor === neon.id && settings.themeMode === 'neon'
                      ? `${neon.border} bg-zinc-800/80 ring-2 ring-offset-1`
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${neon.color} shadow-sm`} />
                  <span className="text-[10px] font-semibold">{neon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Theme Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Chart Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'classic', label: 'Classic VC Indigo' },
                  { id: 'emerald', label: 'Emerald Surge' },
                  { id: 'neon', label: 'Cyber Neon' },
                  { id: 'sunset', label: 'Sunset Amber' },
                  { id: 'noir', label: 'Noir Minimal' },
                  { id: 'ocean', label: 'Deep Ocean' },
                ] as const
              ).map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleChatThemeChange(th.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    settings.chatBubbleTheme === th.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-white font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth Animation & Sound Toggles */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Smoother Animations (60–120 FPS Spring Physics)</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Enhanced transitions, bouncy micro-interactions & smooth chart rendering
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSmoothAnimations}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.smoothAnimations ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.smoothAnimations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Interactive Audio Feedback</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Pleasant synth clicks for messages, coin drops & community decrees
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.soundEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInstallModal?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <span>Download Android APK / Install App</span>
                      <span className="text-[9px] px-1 bg-indigo-600 text-white rounded font-bold">APK</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Install as native mobile app or generate APK package
                    </div>
                  </div>
                </div>
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
