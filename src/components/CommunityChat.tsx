import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Upload, 
  X, 
  Maximize2, 
  Info, 
  Smile,
  MessageSquare,
  Flame,
  Crown
} from 'lucide-react';
import { ChatMessage, User, ThemeMode, ChatBubbleTheme } from '../types';
import { getRoleTitle, SAMPLE_CHAT_IMAGES } from '../services/storage';
import { sound } from '../utils/audio';

const REACTION_EMOJIS = ['❤️', '🔥', '👍', '🚀', '🎉', '👏', '💎', '😂'];
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80';

interface CommunityChatProps {
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  themeMode: ThemeMode;
  chatBubbleTheme: ChatBubbleTheme;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  currentUser,
  messages,
  onSendMessage,
  onToggleReaction,
  themeMode,
  chatBubbleTheme,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage(inputText.trim(), selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    setShowImagePicker(false);
    setActiveReactionMenuId(null);
    sound.playSend();
  };

  const handleQuickGreet = (text: string) => {
    onSendMessage(text);
    sound.playSend();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        sound.playPop();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerReaction = (messageId: string, emoji: string) => {
    onToggleReaction?.(messageId, emoji);
    setActiveReactionMenuId(null);
    sound.playPop();
  };

  // Get bubble styling based on theme and role
  const getChatBubbleStyle = (isCenterRole: boolean, isMine: boolean) => {
    if (themeMode === 'dark') {
      if (isCenterRole) {
        return 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-amber-500/80 text-white shadow-2xl shadow-amber-500/10';
      }
      return 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-md';
    }

    if (themeMode === 'neon') {
      if (isCenterRole) {
        return 'bg-zinc-950 border-2 border-cyan-400 text-cyan-50 shadow-lg shadow-cyan-500/20';
      }
      return 'bg-zinc-900 border border-purple-500/50 text-purple-50 shadow-md shadow-purple-500/10';
    }

    // Normal colorful mode
    if (isCenterRole) {
      return 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border-2 border-amber-400 dark:border-amber-500 text-zinc-900 dark:text-zinc-100 shadow-xl shadow-amber-500/10';
    }

    if (isMine) {
      return 'bg-indigo-50 dark:bg-zinc-800/90 border border-indigo-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm';
    }

    return 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm';
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4.5rem)] max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
      {/* Community Chart Top Banner explaining alignment rule */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2.5 px-3.5 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm flex items-center justify-between text-xs"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-300">
            <strong>Live Community Chart:</strong> Power & Super Admin broadcast in{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400 underline decoration-amber-500">Center</span>. Normal members on{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500">Left Side</span>.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <span>You: {getRoleTitle(currentUser.role)}</span>
        </div>
      </motion.div>

      {/* Messages Scroll Area */}
      <div 
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 backdrop-blur-xs relative"
        onClick={() => {
          if (activeReactionMenuId) setActiveReactionMenuId(null);
        }}
      >
        {/* Animated Empty State if no messages yet */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6 space-y-4"
          >
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <MessageSquare className="w-8 h-8 animate-bounce" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Welcome to VC Community Live Chat!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
                Be the first to send a message. Your messages sync in rapid real-time across all connected peers.
              </p>
            </div>

            {/* Quick Greeting Action Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                'Hello everyone! 👋',
                'Checking in! 🚀',
                'Excited to be here 💎',
                'VC Community online 🔥'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickGreet(chip)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:scale-105 active:scale-95 text-zinc-700 dark:text-zinc-200 transition-all shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message Items List */}
        {messages.map((msg) => {
          const isCenterRole = msg.senderRole === 'power' || msg.senderRole === 'super_admin';
          const isMine = msg.senderId === currentUser.id;
          const isSystem = msg.isSystemAnnouncement || msg.senderId === 'system';
          const reactions = msg.reactions || {};
          const reactionEntries = Object.entries(reactions);

          // 1. System Announcement Banner Card
          if (isSystem) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                className="my-3 mx-auto max-w-xl p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs text-center shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>{msg.senderName}</span>
                </div>
                <p className="leading-relaxed font-medium">{msg.text}</p>
                <span className="block mt-1 text-[10px] text-amber-600/70 dark:text-amber-400/60 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          }

          // 2. Center Aligned Broadcast (Power Person & Super Admin)
          if (isCenterRole) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                className="flex flex-col items-center my-3 relative group"
              >
                {/* Center Header Details */}
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={msg.senderAvatar || FALLBACK_AVATAR}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                    className="w-7 h-7 rounded-full object-cover border-2 border-amber-500 shadow-md keep-colorful-image"
                  />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{msg.senderName}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                      msg.senderRole === 'super_admin'
                        ? 'bg-amber-500 text-black shadow-amber-500/30 ring-2 ring-amber-400/50'
                        : 'bg-purple-600 text-white shadow-purple-500/30 ring-2 ring-purple-400/50'
                    }`}
                  >
                    {msg.senderRole === 'super_admin' ? (
                      <>
                        <Crown className="w-3 h-3 text-black animate-pulse" /> Super Admin
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-yellow-300 animate-pulse" /> Power Person
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Reaction trigger button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id);
                      sound.playPop();
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reaction Overlay Dropdown */}
                <AnimatePresence>
                  {activeReactionMenuId === msg.id && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0, y: -6 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.85, opacity: 0, y: -6 }}
                      className="absolute -top-7 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-2xl border border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleTriggerReaction(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:scale-130 active:scale-90 transition-transform text-sm rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Centered Message Card */}
                <div
                  className={`w-full max-w-xl p-4 rounded-2xl text-center relative transition-transform hover:scale-[1.008] ${getChatBubbleStyle(
                    true,
                    isMine
                  )}`}
                >
                  {msg.text && (
                    <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* High Quality Colorful Image attachment */}
                  {msg.imageUrl && (
                    <div className="mt-3 relative inline-block max-w-md rounded-xl overflow-hidden shadow-lg border border-zinc-200/40 dark:border-zinc-700">
                      <img
                        src={msg.imageUrl}
                        alt="Community upload"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform keep-colorful-image"
                        onClick={() => {
                          setLightboxImage(msg.imageUrl || null);
                          sound.playPop();
                        }}
                      />
                      <button
                        onClick={() => {
                          setLightboxImage(msg.imageUrl || null);
                          sound.playPop();
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-1.5 text-[9px] text-amber-500/80 dark:text-amber-400/80 tracking-widest uppercase font-mono font-bold">
                    ★ Center Broadcast ★
                  </div>

                  {/* Reaction Pills */}
                  {reactionEntries.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                      {reactionEntries.map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerReaction(msg.id, emoji);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold scale-105 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-mono">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }

          // 3. Left Side Aligned (Normal Person & Other members)
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 350 }}
              className="flex items-start gap-3 justify-start max-w-lg my-2 relative group"
            >
              <img
                src={msg.senderAvatar || FALLBACK_AVATAR}
                alt={msg.senderName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                }}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm keep-colorful-image mt-0.5"
              />
              <div className="flex flex-col items-start relative max-w-full">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{msg.senderName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                    Normal
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Reaction trigger button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id);
                      sound.playPop();
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reaction Overlay Dropdown */}
                <AnimatePresence>
                  {activeReactionMenuId === msg.id && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0, y: -6 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.85, opacity: 0, y: -6 }}
                      className="absolute -top-7 left-0 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-2xl border border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleTriggerReaction(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:scale-130 active:scale-90 transition-transform text-sm rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`p-3.5 rounded-2xl rounded-tl-sm text-left shadow-sm transition-transform hover:scale-[1.008] ${getChatBubbleStyle(false, isMine)}`}>
                  {msg.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                  )}

                  {/* High Quality Colorful Image attachment */}
                  {msg.imageUrl && (
                    <div className="mt-2.5 relative rounded-xl overflow-hidden shadow border border-zinc-200/50 dark:border-zinc-700">
                      <img
                        src={msg.imageUrl}
                        alt="Shared in community"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-64 object-cover cursor-pointer hover:scale-[1.02] transition-transform keep-colorful-image"
                        onClick={() => {
                          setLightboxImage(msg.imageUrl || null);
                          sound.playPop();
                        }}
                      />
                      <button
                        onClick={() => {
                          setLightboxImage(msg.imageUrl || null);
                          sound.playPop();
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-zinc-400 font-mono text-right">
                    Normal Person · Left side
                  </div>

                  {/* Reaction Pills */}
                  {reactionEntries.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                      {reactionEntries.map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerReaction(msg.id, emoji);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold scale-105 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-mono">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview before sending */}
      {selectedImage && (
        <motion.div 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="To send"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover keep-colorful-image"
            />
            <div>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                Colourful Image Attached
              </span>
              <span className="text-[10px] text-emerald-500 font-medium">Natural colors preserved</span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedImage(null);
              sound.playPop();
            }}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Colourful Photo Gallery Drawer */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pick a Colourful Community Image:</span>
              </span>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SAMPLE_CHAT_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.url);
                    setShowImagePicker(false);
                    sound.playPop();
                  }}
                  className="group relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-700 hover:ring-2 hover:ring-indigo-500 transition-all text-left cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform keep-colorful-image"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white font-medium truncate">
                    {img.name}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.click();
            sound.playPop();
          }}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Upload image from phone or device"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowImagePicker(!showImagePicker);
            sound.playPop();
          }}
          className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
            showImagePicker
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600'
          }`}
          title="Select Colorful Images"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentUser.role === 'super_admin'
                ? 'Broadcast as Super Admin in Center...'
                : currentUser.role === 'power'
                ? 'Broadcast as Power Person in Center...'
                : 'Send message as Normal Person on Left...'
            }
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() && !selectedImage}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      {/* Lightbox Modal for Fullscreen Image View */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 p-4 bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => {
              setLightboxImage(null);
              sound.playPop();
            }}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
              <img
                src={lightboxImage}
                alt="Enlarged community photo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain keep-colorful-image"
              />
              <button
                onClick={() => {
                  setLightboxImage(null);
                  sound.playPop();
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
