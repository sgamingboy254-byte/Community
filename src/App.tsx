import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChatMessage, WalletTransaction, GraphDataPoint, AppSettings } from './types';
import { storage } from './services/storage';
import { network } from './services/network';
import { TopNav } from './components/TopNav';
import { CommunityChat } from './components/CommunityChat';
import { PersonalChat } from './components/PersonalChat';
import { WalletView } from './components/WalletView';
import { SignInModal } from './components/SignInModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountsModal } from './components/AccountsModal';
import { SuperAdminModal } from './components/SuperAdminModal';
import { StartupScreen } from './components/StartupScreen';
import { sound } from './utils/audio';

export default function App() {
  const [showStartupScreen, setShowStartupScreen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [graphPoints, setGraphPoints] = useState<GraphDataPoint[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  
  // Active Tab: 'community' | 'personal' | 'wallet'
  const [activeTab, setActiveTab] = useState<'community' | 'personal' | 'wallet'>('community');

  // Modals
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);

  // Initialize and connect to server
  useEffect(() => {
    // 1. Load initial cached session
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      network.setUserId(savedUser.id);
    } else {
      setShowSignInModal(true);
    }

    // 2. Fetch full real server state
    network.fetchState().then((state) => {
      if (state.members) setMembers(state.members);
      if (state.communityMessages) setCommunityMessages(state.communityMessages);
      if (state.transactions) setTransactions(state.transactions);
      if (state.graphPoints) setGraphPoints(state.graphPoints);
    });

    // 3. Listen to real-time WebSocket events from the server
    const unsubscribe = network.subscribe((event, data) => {
      if (event === 'connection_change') {
        setIsLiveConnected(data.status === 'connected');
      }

      if (event === 'init_state') {
        if (data.members) setMembers(data.members);
        if (data.communityMessages) setCommunityMessages(data.communityMessages);
        if (data.transactions) setTransactions(data.transactions);
        if (data.graphPoints) setGraphPoints(data.graphPoints);
      }

      // 11-Second Heartbeat presence update (tracks who is online right now in real time)
      if (event === 'presence_update') {
        if (data.members) {
          setMembers(data.members);
          // Sync current user status if changed
          const me = data.members.find((m: User) => m.id === storage.getCurrentUser()?.id);
          if (me) {
            setCurrentUser(me);
            storage.setCurrentUser(me);
          }
        }
      }

      // When a real person joins the app
      if (event === 'member_joined') {
        if (data.members) setMembers(data.members);
        if (data.messages) setCommunityMessages(data.messages);
        sound.playReceive();
      }

      // Real community message sent by a real user
      if (event === 'new_community_message') {
        const newMsg = data.message;
        setCommunityMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        sound.playReceive();
      }

      // Super admin changed a member's role
      if (event === 'role_changed') {
        if (data.members) setMembers(data.members);
        if (data.message) {
          setCommunityMessages((prev) => [...prev, data.message]);
        }
        const current = storage.getCurrentUser();
        if (current && current.id === data.targetUserId) {
          const updated = { ...current, role: data.newRole };
          setCurrentUser(updated);
          storage.setCurrentUser(updated);
        }
        sound.playRoleAlert();
      }

      // Super admin or user wallet balance update
      if (event === 'wallet_switched' || event === 'wallet_transfer_complete') {
        if (data.members) {
          setMembers(data.members);
          const me = data.members.find((m: User) => m.id === storage.getCurrentUser()?.id);
          if (me) {
            setCurrentUser(me);
            storage.setCurrentUser(me);
          }
        }
        if (data.transactions) setTransactions(data.transactions);
        if (data.graphPoints) setGraphPoints(data.graphPoints);
        sound.playCoin();
      }

      // Live reaction update from any real user
      if (event === 'reaction_updated') {
        const { messageId, reactions } = data;
        setCommunityMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    network.send({
      type: 'toggle_reaction',
      messageId,
      emoji,
      userId: currentUser.id,
    });
    // Optimistic update
    setCommunityMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const list = [...(currentReactions[emoji] || [])];
        const idx = list.indexOf(currentUser.id);
        if (idx > -1) {
          list.splice(idx, 1);
          if (list.length === 0) delete currentReactions[emoji];
          else currentReactions[emoji] = list;
        } else {
          list.push(currentUser.id);
          currentReactions[emoji] = list;
        }
        return { ...m, reactions: currentReactions };
      })
    );
  };

  // Compute how many real people are currently online
  const onlineCount = useMemo(() => {
    return members.filter((m) => m.status === 'online').length;
  }, [members]);

  // Handle Real-Time Community message sending
  const handleSendCommunityMessage = (text: string, imageUrl?: string) => {
    if (!currentUser) return;

    // Send through server-authoritative WebSocket
    network.send({
      type: 'send_community_message',
      message: {
        senderId: currentUser.id,
        text: text || undefined,
        imageUrl: imageUrl || undefined,
      },
    });

    sound.playSend();
  };

  const handleSignOut = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    network.setUserId(null);
    setShowSignInModal(true);
    sound.playReceive();
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Determine root CSS classes based on theme mode
  const getThemeWrapperClass = () => {
    if (settings.themeMode === 'dark') {
      return 'dark bg-black text-zinc-100 theme-dark-bw';
    }
    if (settings.themeMode === 'neon') {
      return 'dark bg-zinc-950 text-cyan-50';
    }
    return 'bg-zinc-50 text-zinc-900';
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${getThemeWrapperClass()}`}>
      {/* Top Navigation */}
      {currentUser && (
        <TopNav
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenAccounts={() => setShowAccountsModal(true)}
          onOpenSuperAdminModal={() => setShowSuperAdminModal(true)}
          onPlayStartupSound={() => setShowStartupScreen(true)}
          onSignOut={handleSignOut}
          themeMode={settings.themeMode}
          neonColor={settings.neonColor}
        />
      )}

      {/* Real-Time Live Presence Ribbon (Shows 11s update cycle & real online count) */}
      {currentUser && (
        <div className="bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full px-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {isLiveConnected ? 'Online Server Connected' : 'Connecting to Live Server...'}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{onlineCount}</strong> real person{onlineCount === 1 ? '' : 's'} online now
            </span>
            <span className="hidden sm:inline text-zinc-400">·</span>
            <span className="hidden sm:inline text-zinc-400 font-mono">
              11s live presence tracker active (No bots)
            </span>
          </div>
        </div>
      )}

      {/* Main 3 Sections Viewport */}
      <main className="w-full pb-14 md:pb-0">
        <AnimatePresence mode="wait">
          {activeTab === 'community' && currentUser && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: settings.smoothAnimations ? 0.22 : 0.1 }}
            >
              <CommunityChat
                currentUser={currentUser}
                messages={communityMessages}
                onSendMessage={handleSendCommunityMessage}
                onToggleReaction={handleToggleReaction}
                themeMode={settings.themeMode}
                chatBubbleTheme={settings.chatBubbleTheme}
              />
            </motion.div>
          )}

          {activeTab === 'personal' && currentUser && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: settings.smoothAnimations ? 0.22 : 0.1 }}
            >
              <PersonalChat
                currentUser={currentUser}
                members={members}
                themeMode={settings.themeMode}
              />
            </motion.div>
          )}

          {activeTab === 'wallet' && currentUser && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: settings.smoothAnimations ? 0.22 : 0.1 }}
            >
              <WalletView
                currentUser={currentUser}
                members={members}
                transactions={transactions}
                graphPoints={graphPoints}
                themeMode={settings.themeMode}
                onUpdateCurrentUser={setCurrentUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sign-In Flow Modal (Real Server Registration) */}
      <SignInModal
        isOpen={showSignInModal}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowSignInModal(false);
          network.setUserId(user.id);
        }}
        onClose={currentUser ? () => setShowSignInModal(false) : undefined}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Accounts & Profile Modal */}
      {currentUser && (
        <AccountsModal
          isOpen={showAccountsModal}
          onClose={() => setShowAccountsModal(false)}
          currentUser={currentUser}
          members={members}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            network.setUserId(user.id);
          }}
          onSignOut={handleSignOut}
          onOpenSignIn={() => setShowSignInModal(true)}
        />
      )}

      {/* Super Admin Supreme Control Modal */}
      {currentUser && (
        <SuperAdminModal
          isOpen={showSuperAdminModal}
          onClose={() => setShowSuperAdminModal(false)}
          currentUser={currentUser}
          members={members}
          onRefreshMembers={() => {
            network.fetchState().then((state) => {
              if (state.members) setMembers(state.members);
            });
          }}
        />
      )}

      {/* Windows XP Style Startup Splash & Music */}
      <StartupScreen
        isOpen={showStartupScreen}
        onFinish={() => {
          setShowStartupScreen(false);
          sessionStorage.setItem('vc_startup_played', 'true');
        }}
      />
    </div>
  );
}
