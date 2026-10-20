import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Send, 
  Gift, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  Sparkles, 
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, WalletTransaction, GraphDataPoint, ThemeMode } from '../types';
import { storage } from '../services/storage';
import { sound } from '../utils/audio';

interface WalletViewProps {
  currentUser: User;
  members: User[];
  transactions: WalletTransaction[];
  graphPoints: GraphDataPoint[];
  themeMode: ThemeMode;
  onUpdateCurrentUser: (user: User) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  members,
  transactions,
  graphPoints,
  themeMode,
  onUpdateCurrentUser,
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<GraphDataPoint | null>(null);
  
  // Super Admin switch controls
  const [showAdminSwitchModal, setShowAdminSwitchModal] = useState(false);
  const [adminSwitchTargetId, setAdminSwitchTargetId] = useState(currentUser.id);
  const [customAmountInput, setCustomAmountInput] = useState(currentUser.walletBalance.toString());
  
  // Transfer currency modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipientId, setTransferRecipientId] = useState(members.find((m) => m.id !== currentUser.id)?.id || '');
  const [transferAmount, setTransferAmount] = useState('500');
  const [transferNote, setTransferNote] = useState('');

  // Daily claim cooldown simulation
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Compute graph coordinates
  const graphData = useMemo(() => {
    if (!graphPoints || graphPoints.length === 0) return [];
    return graphPoints;
  }, [graphPoints]);

  const minVal = useMemo(() => Math.min(...graphData.map((p) => p.value), 0), [graphData]);
  const maxVal = useMemo(() => Math.max(...graphData.map((p) => p.value), 10000) * 1.15, [graphData]);

  const graphWidth = 800;
  const graphHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const pointsString = useMemo(() => {
    if (graphData.length < 2) return '';
    return graphData
      .map((p, i) => {
        const x = paddingX + (i / (graphData.length - 1)) * (graphWidth - paddingX * 2);
        const y = graphHeight - paddingY - ((p.value - minVal) / (maxVal - minVal || 1)) * (graphHeight - paddingY * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [graphData, minVal, maxVal]);

  const areaString = useMemo(() => {
    if (graphData.length < 2) return '';
    const firstX = paddingX;
    const lastX = paddingX + (graphWidth - paddingX * 2);
    const bottomY = graphHeight - paddingY;
    return `${pointsString} ${lastX},${bottomY} ${firstX},${bottomY}`;
  }, [pointsString, graphData.length]);

  // Super Admin currency switcher handler
  const handleAdminSwitchCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseInt(customAmountInput, 10);
    if (isNaN(newAmount) || newAmount < 0) return;

    storage.updateWalletBalance(adminSwitchTargetId, newAmount, 'Super Admin currency switch');
    const updated = storage.getCurrentUser();
    if (updated) onUpdateCurrentUser(updated);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    sound.playCoin();
    setShowAdminSwitchModal(false);
  };

  // Quick delta button for Super Admin
  const handleQuickAdjust = (delta: number) => {
    const target = members.find((m) => m.id === adminSwitchTargetId) || currentUser;
    const newBal = Math.max(0, target.walletBalance + delta);
    storage.updateWalletBalance(adminSwitchTargetId, newBal, `Super Admin ${delta >= 0 ? '+' : ''}${delta} VC`);
    const updated = storage.getCurrentUser();
    if (updated) onUpdateCurrentUser(updated);
    setCustomAmountInput(newBal.toString());
    sound.playCoin();
  };

  // Transfer VC currency
  const handleTransferCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0 || amount > currentUser.walletBalance) return;

    const recipient = members.find((m) => m.id === transferRecipientId);
    if (!recipient) return;

    // Deduct from current user
    const senderNewBal = currentUser.walletBalance - amount;
    storage.updateWalletBalance(currentUser.id, senderNewBal, `Transfer to ${recipient.name}`);

    // Add to recipient
    const recipientNewBal = recipient.walletBalance + amount;
    storage.updateWalletBalance(recipient.id, recipientNewBal, `Transfer from ${currentUser.name}`);

    // Add direct transaction logs
    storage.addTransaction({
      id: 'tx-send-' + Date.now(),
      title: `Transfer to ${recipient.name}`,
      type: 'transfer_out',
      amount: -amount,
      timestamp: Date.now(),
      counterpartName: recipient.name,
      note: transferNote || `VC transfer sent to ${recipient.name}`,
    });

    const updated = storage.getCurrentUser();
    if (updated) onUpdateCurrentUser(updated);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
    });
    sound.playCoin();
    setShowTransferModal(false);
    setTransferNote('');
  };

  // Claim daily bonus
  const handleClaimDaily = () => {
    if (dailyClaimed) return;
    const reward = currentUser.role === 'super_admin' ? 5000 : currentUser.role === 'power' ? 2500 : 1000;
    const newBal = currentUser.walletBalance + reward;

    storage.updateWalletBalance(currentUser.id, newBal, 'Daily community attendance grant');
    storage.addTransaction({
      id: 'tx-claim-' + Date.now(),
      title: 'Daily VC Community Reward',
      type: 'community_reward',
      amount: reward,
      timestamp: Date.now(),
      note: 'Attendance dividend for active members',
    });

    const updated = storage.getCurrentUser();
    if (updated) onUpdateCurrentUser(updated);

    setDailyClaimed(true);
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 },
    });
    sound.playCoin();
  };

  return (
    <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-3 sm:py-6 pb-24 md:pb-8 space-y-4 sm:space-y-6">
      {/* ================= UPPER SIDE: INCOME AMOUNT IN NUMBER WITH SMALL LETTER "VC currency" ================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border ${
          themeMode === 'neon'
            ? 'bg-zinc-950/80 border-cyan-400/40 neon-glow-cyan'
            : themeMode === 'dark'
            ? 'bg-zinc-900 border-zinc-700 text-white'
            : 'bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border-indigo-800 shadow-2xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Total Income & Available Balance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Income Amount in number with small letter "VC currency" */}
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight tabular-nums">
                {currentUser.walletBalance.toLocaleString()}
              </span>
              {/* As explicitly requested: "in small letter there is VC currency written" */}
              <span className="text-sm sm:text-base md:text-lg font-semibold text-indigo-300 dark:text-zinc-400 lowercase tracking-wide">
                VC currency
              </span>
            </div>

            <p className="mt-2 text-xs text-indigo-200/70 dark:text-zinc-400 max-w-md">
              Peer-to-peer liquidity and governance credits in the VC Community ecosystem. Real-time ledger synchronization.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Super Admin Switch Currency Button */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setAdminSwitchTargetId(currentUser.id);
                  setCustomAmountInput(currentUser.walletBalance.toString());
                  setShowAdminSwitchModal(true);
                  sound.playReceive();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-lg transition-all"
              >
                <Sliders className="w-4 h-4" />
                <span>Super Admin: Switch Currency</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowTransferModal(true);
                sound.playReceive();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send VC Currency</span>
            </button>

            <button
              onClick={handleClaimDaily}
              disabled={dailyClaimed}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                dailyClaimed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>{dailyClaimed ? 'Claimed Today ✓' : 'Daily Community Grant'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-indigo-200/80 dark:text-zinc-400">Upper Surge (24h)</div>
              <div className="text-sm font-bold font-mono text-emerald-400">+18.4% (+4,700 VC)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-indigo-200/80 dark:text-zinc-400">Down Correction Dip</div>
              <div className="text-sm font-bold font-mono text-rose-400">-5.2% (-1,200 VC)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-indigo-200/80 dark:text-zinc-400">Treasury Super Admin</div>
              <div className="text-sm font-bold font-mono text-amber-300">Supreme Authority</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= DOWNSIDE: INTERACTIVE GRAPH SHOWING HOW IT IS UPPER AND HOW IT IS DOWN ================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Currency & Income Fluctuation Graph
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold">
                Live Dynamics
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Visualizing how currency trends upper and down across historical cycles.
            </p>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  sound.playReceive();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  timeframe === tf
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Hovered point tooltip summary */}
        <div className="h-8 flex items-center gap-4 text-xs font-mono">
          {hoveredPoint ? (
            <>
              <span className="text-zinc-500">Timestamp: {hoveredPoint.timeLabel}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {hoveredPoint.value.toLocaleString()} VC currency
              </span>
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  hoveredPoint.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {hoveredPoint.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {hoveredPoint.change >= 0 ? '+' : ''}
                {hoveredPoint.change.toLocaleString()} VC (
                {hoveredPoint.change >= 0 ? 'Upper Trend' : 'Down Correction'})
              </span>
            </>
          ) : (
            <span className="text-zinc-400 text-[11px]">
              Hover or tap on any point on the graph below to inspect upper and down fluctuations
            </span>
          )}
        </div>

        {/* The SVG Canvas Graph */}
        <div className="relative w-full overflow-x-auto pt-2">
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="currencyGraphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const y = paddingY + ratio * (graphHeight - paddingY * 2);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={graphWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Gradient Area Fill */}
            {areaString && (
              <polygon
                points={areaString}
                fill="url(#currencyGraphGradient)"
                className="transition-all duration-300"
              />
            )}

            {/* The Main Fluctuation Line */}
            {pointsString && (
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
                className="transition-all duration-300"
              />
            )}

            {/* Interactive Data Points */}
            {graphData.map((pt, i) => {
              const x = paddingX + (i / (graphData.length - 1)) * (graphWidth - paddingX * 2);
              const y = graphHeight - paddingY - ((pt.value - minVal) / (maxVal - minVal || 1)) * (graphHeight - paddingY * 2);
              const isHovered = hoveredPoint?.timestamp === pt.timestamp;
              const isUpper = pt.change >= 0;

              return (
                <g key={i}>
                  {/* Subtle vertical indicator bar on hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={graphHeight - paddingY}
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    className="cursor-pointer transition-all duration-200"
                    fill={isUpper ? '#10b981' : '#f43f5e'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onTouchStart={() => setHoveredPoint(pt)}
                  />

                  {/* Time label below axis */}
                  <text
                    x={x}
                    y={graphHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-zinc-400 font-mono"
                  >
                    {pt.timeLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Upper Surge Indicator (Green)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Down Dip Indicator (Red)</span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">Currency Unit: VC currency</span>
        </div>
      </motion.div>

      {/* ================= TRANSACTION HISTORY ================= */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Recent VC Currency Activity</h3>
          <span className="text-xs text-zinc-400 font-mono">{transactions.length} records</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {transactions.map((tx) => {
            const isPositive = tx.amount >= 0;

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{tx.title}</div>
                    <div className="text-[11px] text-zinc-400">{tx.note || 'VC Community transaction'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono text-sm font-bold ${
                      isPositive ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {tx.amount.toLocaleString()} VC
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL: SUPER ADMIN SWITCH CURRENCY ================= */}
      <AnimatePresence>
        {showAdminSwitchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-900 dark:text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base">Super Admin: Switch VC Currency</h3>
                </div>
                <button
                  onClick={() => setShowAdminSwitchModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminSwitchCurrency} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Select Member to Switch Wallet Amount:
                  </label>
                  <select
                    value={adminSwitchTargetId}
                    onChange={(e) => {
                      setAdminSwitchTargetId(e.target.value);
                      const target = members.find((m) => m.id === e.target.value);
                      if (target) setCustomAmountInput(target.walletBalance.toString());
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role === 'super_admin' ? 'Super Admin' : m.role === 'power' ? 'Power Person' : 'Normal Person'}) - Current: {m.walletBalance.toLocaleString()} VC
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    New Exact VC Currency Amount:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono text-base font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Quick Increment/Decrement Buttons */}
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1.5">Quick Adjust Presets:</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(5000)}
                      className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(25000)}
                      className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      +25,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(-5000)}
                      className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                    >
                      -5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(-25000)}
                      className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                    >
                      -25,000
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdminSwitchModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Switch</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: SEND VC CURRENCY ================= */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-900 dark:text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-base">Send VC Currency</h3>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleTransferCurrency} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Send to Community Member:
                  </label>
                  <select
                    value={transferRecipientId}
                    onChange={(e) => setTransferRecipientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {members
                      .filter((m) => m.id !== currentUser.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role.toUpperCase()})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-500">Amount to Transfer:</label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Available: {currentUser.walletBalance.toLocaleString()} VC
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={currentUser.walletBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono text-base font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Memo / Note (Optional):
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="e.g. Thanks for collaboration!"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={parseInt(transferAmount, 10) > currentUser.walletBalance}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-50"
                  >
                    Transfer VC
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
