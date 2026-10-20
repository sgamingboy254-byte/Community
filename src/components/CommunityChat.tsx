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
  Smile
} from 'lucide-react';
import { ChatMessage, User, ThemeMode, ChatBubbleTheme } from '../types';
import { getRoleTitle, SAMPLE_CHAT_IMAGES } from '../services/storage';
import { sound } from '../utils/audio';

const REACTION_EMOJIS = ['❤️', '🔥', '👍', '🚀', '🎉', '👏', '💎', '😂'];

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        sound.playReceive();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerReaction = (messageId: string, emoji: string) => {
    onToggleReaction?.(messageId, emoji);
    setActiveReactionMenuId(null);
    sound.playReceive();
  };

  // Get bubble styling based on settings
  const getChatBubbleStyle = (isCenterRole: boolean, isMine: boolean) => {
    if (themeMode === 'dark') {
      if (isCenterRole) {
        return 'bg-zinc-900 border-2 border-white/60 text-white shadow-xl';
      }
      return 'bg-zinc-900/90 border border-zinc-800 text-zinc-200';
    }

    if (themeMode === 'neon') {
      if (isCenterRole) {
        return 'bg-zinc-950 border-2 border-cyan-400 text-cyan-100 neon-glow-cyan';
      }
      return 'bg-zinc-900 border border-purple-500/40 text-purple-100';
    }

    // Normal colorful mode
    if (isCenterRole) {
      return 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-amber-400/80 dark:border-amber-500 text-zinc-900 dark:text-zinc-100 shadow-md';
    }

    if (isMine) {
      return 'bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100';
    }

    return 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100';
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4.5rem)] max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
      {/* Community Chart Top Banner explaining alignment rule */}
      <div className="mb-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-300">
            <strong>Community Chart Alignment:</strong> Power Person & Super Admin messages are placed in{' '}
            <span className="font-bold underline decoration-amber-500">Center</span>. Normal member messages are on the{' '}
            <span className="font-bold underline decoration-indigo-500">Left Side</span>. Tap <Smile className="w-3.5 h-3.5 inline mx-0.5 text-indigo-500" /> to react!
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <span>Your Role: {getRoleTitle(currentUser.role)}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        className="flex-1 overflow-y-auto px-2 py-4 space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60"
        onClick={() => {
          if (activeReactionMenuId) setActiveReactionMenuId(null);
        }}
      >
        {messages.map((msg) => {
          const isCenterRole = msg.senderRole === 'power' || msg.senderRole === 'super_admin';
          const isMine = msg.senderId === currentUser.id;
          const isSystem = msg.isSystemAnnouncement || msg.senderId === 'system';
          const reactions = msg.reactions || {};
          const reactionEntries = Object.entries(reactions);

          // System Announcement Card
          if (isSystem) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-3 mx-auto max-w-xl p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs text-center shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{msg.senderName}</span>
                </div>
                <p className="leading-relaxed font-medium">{msg.text}</p>
                <span className="block mt-1 text-[10px] text-amber-600/70 dark:text-amber-400/60 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          }

          // Center Aligned (Power Person & Super Admin)
          if (isCenterRole) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center my-3 relative group"
              >
                {/* Center Header Details */}
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border-2 border-amber-500 shadow-sm keep-colorful-image"
                  />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{msg.senderName}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      msg.senderRole === 'super_admin'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'bg-purple-600 text-white shadow-sm'
                    }`}
                  >
                    {msg.senderRole === 'super_admin' ? (
                      <>
                        <ShieldCheck className="w-3 h-3" /> Super Admin
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" /> Power Person
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
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Click-to-trigger Reaction Overlay */}
                <AnimatePresence>
                  {activeReactionMenuId === msg.id && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: -4 }}
                      className="absolute -top-7 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleTriggerReaction(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-sm rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Centered Message Box */}
                <div
                  className={`w-full max-w-xl p-4 rounded-2xl text-center relative ${getChatBubbleStyle(
                    true,
                    isMine
                  )}`}
                >
                  {msg.text && (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* High Quality Colorful Image attachment */}
                  {msg.imageUrl && (
                    <div className="mt-3 relative inline-block max-w-md rounded-xl overflow-hidden shadow-lg border border-zinc-200/40 dark:border-zinc-700">
                      <img
                        src={msg.imageUrl}
                        alt="Community upload"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform keep-colorful-image"
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                      />
                      <button
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-1 text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                              hasReacted
                                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold scale-105'
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

          // Left Side Aligned (Normal Person & Other members)
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 justify-start max-w-lg my-2 relative group"
            >
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm keep-colorful-image mt-0.5"
              />
              <div className="flex flex-col items-start relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{msg.senderName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
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
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Click-to-trigger Reaction Overlay */}
                <AnimatePresence>
                  {activeReactionMenuId === msg.id && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: -4 }}
                      className="absolute -top-7 left-0 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleTriggerReaction(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-sm rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`p-3.5 rounded-2xl rounded-tl-sm text-left shadow-sm ${getChatBubbleStyle(false, isMine)}`}>
                  {msg.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* High Quality Colorful Image attachment */}
                  {msg.imageUrl && (
                    <div className="mt-2.5 relative rounded-xl overflow-hidden shadow border border-zinc-200/50 dark:border-zinc-700">
                      <img
                        src={msg.imageUrl}
                        alt="Shared in community"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-64 object-cover cursor-pointer hover:scale-[1.02] transition-transform keep-colorful-image"
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                      />
                      <button
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                              hasReacted
                                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold scale-105'
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
        <div className="mt-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
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
              <span className="text-[10px] text-emerald-500">Natural colors preserved</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Colourful Photo Gallery Drawer */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pick a Colourful Community Image:</span>
              </span>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                    sound.playReceive();
                  }}
                  className="group relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-700 hover:ring-2 hover:ring-indigo-500 transition-all text-left"
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
          onClick={() => fileInputRef.current?.click()}
          title="Upload from device"
          className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 transition-all"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowImagePicker(!showImagePicker)}
          title="Pick colourful photo from gallery"
          className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 transition-all"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            currentUser.role === 'power' || currentUser.role === 'super_admin'
              ? `Speak in Center as ${getRoleTitle(currentUser.role)}...`
              : 'Speak on Left Side as Normal Person...'
          }
          className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-sm"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !selectedImage}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Image Lightbox Viewport */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged"
                referrerPolicy="no-referrer"
                className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl keep-colorful-image"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
