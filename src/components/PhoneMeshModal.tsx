import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Radio, 
  Wifi, 
  Globe, 
  Users, 
  ShieldCheck, 
  Zap, 
  X, 
  ArrowRight, 
  Activity, 
  Cpu, 
  Share2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';

interface PhoneMeshModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  members: User[];
  connectedPeersCount: number;
}

export const PhoneMeshModal: React.FC<PhoneMeshModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  members,
  connectedPeersCount,
}) => {
  if (!isOpen) return null;

  const onlineMembers = members.filter((m) => m.status === 'online');
  const activeCount = Math.max(onlineMembers.length, connectedPeersCount, 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto glass-panel p-5 sm:p-6 rounded-3xl shadow-2xl border border-white/20 text-zinc-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/50 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Phone Mesh Network
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                    Live Global Relay
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cross-phone peer routing • Messages travel across all phones from far
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                sound.playPop();
              }}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Mesh Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 my-4 text-center">
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/30 dark:border-zinc-700">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Phones Linked
              </div>
              <div className="text-xl font-extrabold font-mono text-cyan-500 mt-0.5 flex items-center justify-center gap-1">
                <Smartphone className="w-4 h-4" />
                <span>{activeCount}</span>
              </div>
              <div className="text-[9px] text-zinc-400 mt-0.5">Across All Distances</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/30 dark:border-zinc-700">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Relay Travel
              </div>
              <div className="text-xl font-extrabold font-mono text-indigo-500 mt-0.5 flex items-center justify-center gap-1">
                <Activity className="w-4 h-4" />
                <span>1-2 Hops</span>
              </div>
              <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">Low Server Load</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/30 dark:border-zinc-700">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Mesh Protocol
              </div>
              <div className="text-xl font-extrabold font-mono text-emerald-500 mt-0.5 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4" />
                <span>0ms P2P</span>
              </div>
              <div className="text-[9px] text-zinc-400 mt-0.5">Rapid Gossip Sync</div>
            </div>
          </div>

          {/* Mesh Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5 mb-4">
            <div className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>How Far-Away Phones Connect:</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              When you share this app to a friend, your phones establish a <strong className="text-zinc-900 dark:text-white">peer mesh relay</strong>. When anyone signs in or sends a message, it immediately travels across the chain of connected phones, allowing everyone to see each other in real-time regardless of location.
            </p>
          </div>

          {/* Interactive Phone Travel Route Visualizer */}
          <div className="p-4 rounded-2xl bg-zinc-900 text-white shadow-inner mb-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Message Travel Route
              </span>
              <span>Sub-millisecond hops</span>
            </div>

            <div className="flex items-center justify-between gap-2 px-2 py-3 bg-zinc-800/70 rounded-xl border border-zinc-700 text-xs">
              {/* Node 1: Sender Phone */}
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-md">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-zinc-200">
                  {currentUser?.name || 'Your Phone'}
                </span>
                <span className="text-[8px] text-cyan-400 font-mono">Origin Node</span>
              </div>

              {/* Hop Link 1 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
                <span className="text-[9px] text-zinc-400 font-mono mt-1">Direct Hop (0ms)</span>
              </div>

              {/* Node 2: Friend Phone */}
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-md">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-zinc-200">
                  {onlineMembers.find((m) => m.id !== currentUser?.id)?.name || "Friend's Phone"}
                </span>
                <span className="text-[8px] text-indigo-400 font-mono">Far Mesh Peer</span>
              </div>

              {/* Hop Link 2 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                <span className="text-[9px] text-zinc-400 font-mono mt-1">Ecosystem Hub</span>
              </div>

              {/* Node 3: Real-Time Network */}
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-md">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-zinc-200">Community</span>
                <span className="text-[8px] text-emerald-400 font-mono">All Peers</span>
              </div>
            </div>
          </div>

          {/* Members Signed In Across All Phones */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>All Real Members Signed In Across Phones ({members.length})</span>
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                {onlineMembers.length} Online Now
              </span>
            </div>

            <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800 max-h-52 overflow-y-auto rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-white/40 dark:bg-zinc-800/40 p-1">
              {members.map((member) => {
                const isMe = member.id === currentUser?.id;
                const isOnline = member.status === 'online';

                return (
                  <div key={member.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 keep-colorful-image"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                            isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {member.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                              You
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 capitalize font-mono">
                            {member.role.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {isOnline ? '🟢 Connected via Mobile Phone Mesh' : '⚪ Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-amber-500">
                        {member.walletBalance.toLocaleString()} VC
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close button */}
          <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800 flex justify-end">
            <button
              onClick={() => {
                onClose();
                sound.playPop();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              Close Mesh View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
