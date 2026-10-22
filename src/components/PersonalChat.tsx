import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  ShieldCheck, 
  Zap, 
  User as UserIcon, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Upload, 
  X,
  Maximize2,
  Coins,
  Users,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { ChatMessage, User, ThemeMode } from '../types';
import { getRoleTitle, SAMPLE_CHAT_IMAGES, storage } from '../services/storage';
import { network } from '../services/network';
import { sound } from '../utils/audio';

interface PersonalChatProps {
  currentUser: User;
  members: User[];
  themeMode: ThemeMode;
}

export const PersonalChat: React.FC<PersonalChatProps> = ({ currentUser, members, themeMode }) => {
  const otherMembers = members.filter((m) => m.id !== currentUser.id);
  const [selectedMember, setSelectedMember] = useState<User | null>(
    typeof window !== 'undefined' && window.innerWidth >= 768 ? otherMembers[0] || null : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'online' | 'power' | 'normal'>('all');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedMember up to date if member details update in real-time
  useEffect(() => {
    if (selectedMember) {
      const refreshed = members.find((m) => m.id === selectedMember.id);
      if (refreshed && (refreshed.status !== selectedMember.status || refreshed.role !== selectedMember.role || refreshed.walletBalance !== selectedMember.walletBalance)) {
        setSelectedMember(refreshed);
      }
    } else if (otherMembers.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSelectedMember(otherMembers[0]);
    }
  }, [members]);

  // Load direct messages for selected member
  useEffect(() => {
    if (selectedMember) {
      setMessages(storage.getPersonalMessages(selectedMember.id));
    }
  }, [selectedMember]);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      if (selectedMember) {
        setMessages(storage.getPersonalMessages(selectedMember.id));
      }
    });
    return unsubscribe;
  }, [selectedMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Comprehensive Search and Filter calculation
  const filteredMembers = useMemo(() => {
    return otherMembers.filter((m) => {
      // Role / status filter
      if (roleFilter === 'online' && m.status !== 'online') return false;
      if (roleFilter === 'power' && m.role !== 'power') return false;
      if (roleFilter === 'normal' && m.role !== 'normal') return false;

      // Text search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.communityCode.includes(q) ||
        (m.bio && m.bio.toLowerCase().includes(q))
      );
    });
  }, [otherMembers, searchQuery, roleFilter]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || (!inputText.trim() && !selectedImage)) return;

    const newMsg: ChatMessage = {
      id: 'dm-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: inputText.trim() || undefined,
      imageUrl: selectedImage || undefined,
      timestamp: Date.now(),
      isDirect: true,
      recipientId: selectedMember.id,
    };

    storage.addPersonalMessage(selectedMember.id, newMsg);
    setMessages((prev) => [...prev, newMsg]);
    
    // Broadcast real-time direct message through server (dual WS + HTTP)
    network.sendDirectMessage(newMsg);

    setInputText('');
    setSelectedImage(null);
    setShowImagePicker(false);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-amber-500" />,
          label: 'Super Admin',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'power':
        return {
          icon: <Zap className="w-3 h-3 text-purple-500" />,
          label: 'Power Person',
          classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      default:
        return {
          icon: <UserIcon className="w-3 h-3 text-zinc-400" />,
          label: 'Normal Person',
          classes: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3 h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4.5rem)] flex flex-col gap-2.5">
      {/* Top Glass Search & Quick-Filter Bar for Personal Chat */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md">
        {/* Search Input with Glass Aesthetic */}
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500/80" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name, role or code..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl glass-input text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 shadow-inner transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['all', 'online', 'power', 'normal'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setRoleFilter(filter);
                sound.playReceive();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all shrink-0 ${
                roleFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-white/40 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-white/70 dark:hover:bg-zinc-800/80 border border-white/20'
              }`}
            >
              {filter === 'all' ? 'All Members' : filter === 'online' ? '🟢 Online' : filter}
            </button>
          ))}
          <span className="text-[10px] text-zinc-400 font-mono ml-auto sm:ml-2 shrink-0">
            {filteredMembers.length} found
          </span>
        </div>
      </div>

      {/* Main Glass Workspace (Left Member Sidebar + Right Direct Chat Canvas) */}
      <div className="flex-1 flex gap-3 sm:gap-4 min-h-0 overflow-hidden">
        {/* Left Member Directory Glass Panel */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col rounded-2xl glass-panel shadow-sm overflow-hidden shrink-0 ${
            selectedMember ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-white/30 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Direct Messaging
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              {filteredMembers.length} available
            </span>
          </div>

          {/* Member List Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                  {searchQuery ? 'No members match search' : 'No other real persons yet'}
                </p>
                <p className="text-[11px] mt-1 text-zinc-400">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-indigo-500 font-semibold underline mt-1"
                    >
                      Clear search filter
                    </button>
                  ) : (
                    'Real online people will appear live as they join the network!'
                  )}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const badge = getRoleBadge(member.role);

                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedMember(member);
                      sound.playReceive();
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${
                      isSelected
                        ? 'bg-indigo-600/15 dark:bg-indigo-600/25 border border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                        : 'hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-white/50 dark:border-white/10 shadow-sm keep-colorful-image group-hover:scale-105 transition-transform"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          member.status === 'online'
                            ? 'bg-emerald-500'
                            : member.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-zinc-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {member.walletBalance.toLocaleString()} VC
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.classes}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1-on-1 Chat Canvas with Glass UI */}
        <div
          className={`flex-1 flex flex-col rounded-2xl glass-panel shadow-sm overflow-hidden ${
            !selectedMember ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedMember ? (
            <>
              {/* Header with Glass Info Bar */}
              <div className="p-3.5 border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/60 dark:border-white/20 shadow keep-colorful-image"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        selectedMember.status === 'online'
                          ? 'bg-emerald-500'
                          : selectedMember.status === 'away'
                          ? 'bg-amber-500'
                          : 'bg-zinc-400'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                        {selectedMember.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                        {getRoleTitle(selectedMember.role)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {selectedMember.status === 'online'
                        ? '🟢 Online now'
                        : selectedMember.status === 'away'
                        ? '🟡 Away'
                        : '⚪ Offline'} · Real Member
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-white/30 dark:border-white/10">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                    {selectedMember.walletBalance.toLocaleString()} VC
                  </span>
                </div>
              </div>

              {/* Direct Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200">
                      Private encrypted conversation with {selectedMember.name}
                    </p>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1">
                      Messages sent here are direct and synchronous. Share ideas, transfer VC currency, or send high-quality colourful images.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUser.id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 max-w-md ${isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/50 dark:border-white/10 shadow-sm keep-colorful-image mt-0.5"
                        />

                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`p-3 rounded-2xl text-sm ${
                              isMine
                                ? 'glass-bubble-mine rounded-tr-xs'
                                : 'glass-bubble-other rounded-tl-xs text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {msg.text && (
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            )}

                            {msg.imageUrl && (
                              <div className="mt-2 relative rounded-xl overflow-hidden border border-white/40 shadow-sm">
                                <img
                                  src={msg.imageUrl}
                                  alt="Direct share"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-auto max-h-60 object-cover cursor-pointer hover:scale-[1.02] transition-transform keep-colorful-image"
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
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1 px-1 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected Image Preview Dock */}
              {selectedImage && (
                <div className="p-2 mx-3 mb-2 rounded-xl glass-panel border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage}
                      alt="To send"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover keep-colorful-image border border-white/40"
                    />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Image attached
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Photo Drawer */}
              <AnimatePresence>
                {showImagePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 mx-3 mb-2 glass-panel rounded-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Send Colourful Image:</span>
                      </span>
                      <button
                        onClick={() => setShowImagePicker(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        ✕
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
                          className="group relative rounded-xl overflow-hidden aspect-video border border-white/40 hover:ring-2 hover:ring-indigo-500 transition-all text-left"
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

              {/* Message Input Dock */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex items-center gap-2">
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
                  className="p-2.5 rounded-xl glass-panel text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  title="Pick colorful photo"
                  className="p-2.5 rounded-xl glass-panel text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Direct message to ${selectedMember.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !selectedImage}
                  className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center justify-center font-bold text-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200">
                Select a member to start chatting
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Choose someone from the left member list or search above to begin direct conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
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
