import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio } from 'lucide-react';
import { User, ChatMessage, WalletTransaction, GraphDataPoint, AppSettings, Product, Order } from './types';
import { storage } from './services/storage';
import { network } from './services/network';
import { TopNav } from './components/TopNav';
import { CommunityChat } from './components/CommunityChat';
import { PersonalChat } from './components/PersonalChat';
import { WalletView } from './components/WalletView';
import { VCCartView } from './components/VCCartView';
import { SignInModal } from './components/SignInModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountsModal } from './components/AccountsModal';
import { SuperAdminModal } from './components/SuperAdminModal';
import { StartupScreen } from './components/StartupScreen';
import { NetworkSetupModal, NetworkChoice } from './components/NetworkSetupModal';
import { PhoneMeshModal } from './components/PhoneMeshModal';
import { sound } from './utils/audio';

export default function App() {
  // Network preference: 'enable' | 'for_this_time' | 'not_now'
  const [networkMode, setNetworkMode] = useState<NetworkChoice>(() => {
    if (typeof window === 'undefined') return 'enable';
    const permanent = localStorage.getItem('vc_network_choice') as NetworkChoice | null;
    if (permanent) return permanent;
    const session = sessionStorage.getItem('vc_network_choice') as NetworkChoice | null;
    if (session) return session;
    return 'enable';
  });

  // Show network prompt before the opening sound & logo screen
  const [showNetworkPrompt, setShowNetworkPrompt] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const permanent = localStorage.getItem('vc_network_choice');
    const session = sessionStorage.getItem('vc_network_choice');
    return !permanent && !session;
  });

  const [showStartupScreen, setShowStartupScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const permanent = localStorage.getItem('vc_network_choice');
    const session = sessionStorage.getItem('vc_network_choice');
    // If user hasn't made their network choice yet, hold startup screen until they choose Option 1 or 2
    if (!permanent && !session) return false;
    if (permanent === 'not_now' || session === 'not_now') return false;
    return true;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>(() => storage.getCommunityMessages());
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [graphPoints, setGraphPoints] = useState<GraphDataPoint[]>([]);
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  
  // Active Tab: 'community' | 'personal' | 'wallet' | 'cart'
  const [activeTab, setActiveTab] = useState<'community' | 'personal' | 'wallet' | 'cart'>('community');

  // Modals
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [showPhoneMeshModal, setShowPhoneMeshModal] = useState(false);

  // Initialize and connect to server
  useEffect(() => {
    // 1. Load initial cached session
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      network.setCurrentUser(savedUser);
      network.setUserId(savedUser.id);
      network.syncPeers();
    } else {
      setShowSignInModal(true);
    }

    // 2. Fetch full real server state
    network.fetchState().then((state) => {
      if (state.members && state.members.length > 0) setMembers(state.members);
      if (state.communityMessages && state.communityMessages.length > 0) {
        setCommunityMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          state.communityMessages.forEach((m) => map.set(m.id, m));
          const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
          storage.saveCommunityMessages(merged);
          return merged;
        });
      }
      if (state.transactions && state.transactions.length > 0) setTransactions(state.transactions);
      if (state.graphPoints && state.graphPoints.length > 0) setGraphPoints(state.graphPoints);
      if (state.products && state.products.length > 0) {
        setProducts(state.products);
        storage.saveProducts(state.products);
      }
      if (state.orders) {
        setOrders(state.orders);
        storage.saveOrders(state.orders);
      }
    });

    // 3. Listen to real-time WebSocket events from the server
    const unsubscribe = network.subscribe((event, data) => {
      if (event === 'connection_change') {
        setIsLiveConnected(data.status === 'connected');
      }

      if (event === 'init_state') {
        if (data.members) setMembers(data.members);
        if (data.communityMessages && data.communityMessages.length > 0) {
          setCommunityMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id, m));
            data.communityMessages.forEach((m: ChatMessage) => map.set(m.id, m));
            const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
            storage.saveCommunityMessages(merged);
            return merged;
          });
        }
        if (data.transactions) setTransactions(data.transactions);
        if (data.graphPoints) setGraphPoints(data.graphPoints);
        if (data.products) {
          setProducts(data.products);
          storage.saveProducts(data.products);
        }
        if (data.orders) {
          setOrders(data.orders);
          storage.saveOrders(data.orders);
        }
      }

      // Rapid presence update (tracks who is online right now in real time)
      if (event === 'presence_update') {
        if (data.members) {
          setMembers(data.members);
          const me = data.members.find((m: User) => m.id === storage.getCurrentUser()?.id);
          if (me) {
            setCurrentUser(me);
            localStorage.setItem('vc_current_user', JSON.stringify(me));
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
          const updated = [...prev, newMsg];
          storage.saveCommunityMessages(updated);
          return updated;
        });
        sound.playReceive();
      }

      // Direct personal message
      if (event === 'new_direct_message') {
        const msg = data.message;
        if (msg) {
          const currentId = storage.getCurrentUser()?.id;
          const otherUserId = msg.senderId === currentId ? msg.recipientId : msg.senderId;
          if (otherUserId) {
            storage.addPersonalMessage(otherUserId, msg);
          }
          sound.playChime();
        }
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

      // Live Product added (Super Admin)
      if (event === 'product_added') {
        if (data.products) {
          setProducts(data.products);
          storage.saveProducts(data.products);
        } else if (data.product) {
          setProducts((prev) => [data.product, ...prev]);
        }
        if (data.message) {
          setCommunityMessages((prev) => [...prev, data.message]);
        }
        sound.playChime();
      }

      // Product deleted (Super Admin)
      if (event === 'product_deleted') {
        if (data.products) {
          setProducts(data.products);
          storage.saveProducts(data.products);
        } else if (data.productId) {
          setProducts((prev) => prev.filter((p) => p.id !== data.productId));
        }
      }

      // Order placed (Buyer bought item)
      if (event === 'order_placed') {
        if (data.order) {
          setOrders((prev) => [data.order, ...prev]);
        }
        if (data.members) setMembers(data.members);
        if (data.products) {
          setProducts(data.products);
          storage.saveProducts(data.products);
        }
        if (data.transactions) setTransactions(data.transactions);
        if (data.communityMessages) setCommunityMessages(data.communityMessages);
        const current = storage.getCurrentUser();
        if (current && data.buyer && current.id === data.buyer.id) {
          setCurrentUser(data.buyer);
          storage.setCurrentUser(data.buyer);
        }
      }
    });

    // 4. Continuous Automated Background Sync between GitHub & AI Studio across connected nodes
    const continuousSyncInterval = setInterval(() => {
      network.syncPeers();
    }, 7000);

    return () => {
      unsubscribe();
      clearInterval(continuousSyncInterval);
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

  const handleNetworkChoice = (choice: NetworkChoice) => {
    setNetworkMode(choice);
    setShowNetworkPrompt(false);

    if (choice === 'enable') {
      localStorage.setItem('vc_network_choice', 'enable');
      network.reconnect();
      setShowStartupScreen(true);
    } else if (choice === 'for_this_time') {
      sessionStorage.setItem('vc_network_choice', 'for_this_time');
      network.reconnect();
      setShowStartupScreen(true);
    } else {
      sessionStorage.setItem('vc_network_choice', 'not_now');
      network.disconnect();
      setShowStartupScreen(false);
    }
  };

  // Compute how many real people are currently online
  const onlineCount = useMemo(() => {
    return members.filter((m) => m.status === 'online').length;
  }, [members]);

  // Handle Real-Time Community message sending with 0ms rapid millisecond optimistic dispatch
  const handleSendCommunityMessage = (text: string, imageUrl?: string, audioUrl?: string, audioDuration?: number) => {
    if (!currentUser) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: text || undefined,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      audioDuration: audioDuration || undefined,
      timestamp: Date.now(),
    };

    // 1. Immediate optimistic UI render (0 milliseconds) & local storage save
    setCommunityMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      const updated = [...prev, newMsg];
      storage.saveCommunityMessages(updated);
      return updated;
    });

    // 2. Immediate dual-channel network dispatch (WS + REST)
    network.sendCommunityMessage(newMsg);

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
          onOpenPhoneMesh={() => setShowPhoneMeshModal(true)}
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
                isLiveConnected && networkMode !== 'not_now' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {networkMode === 'not_now'
                ? 'Independent Local Mode'
                : isLiveConnected
                ? 'Online Server Connected'
                : 'Connecting to Live Server...'}
            </span>
            <span className="text-zinc-400">·</span>
            <button
              onClick={() => setShowPhoneMeshModal(true)}
              className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-cyan-400 cursor-pointer flex items-center gap-1 transition-colors"
              title="Click to view all connected phones and people"
            >
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{onlineCount}</strong> real person{onlineCount === 1 ? '' : 's'} online now
            </button>
            <span className="hidden sm:inline text-zinc-400">·</span>
            <button
              onClick={() => setShowPhoneMeshModal(true)}
              className="hidden sm:flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-mono"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Phone Mesh Relay Active</span>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Phone Mesh Status Button */}
              <button
                onClick={() => setShowPhoneMeshModal(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 transition-colors shadow-2xs cursor-pointer"
                title="View Connected Phones & Mesh Network"
              >
                <Radio className="w-2.5 h-2.5 text-cyan-500 animate-pulse" />
                <span>Phones ({onlineCount})</span>
              </button>

              {/* Independent Phone Network Status Button */}
              <button
                onClick={() => setShowNetworkPrompt(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
                title="Click to configure independent phone network connection"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${networkMode === 'not_now' ? 'bg-zinc-400' : 'bg-cyan-500'}`} />
                <span className="hidden xs:inline">
                  {networkMode === 'not_now'
                    ? 'Offline'
                    : networkMode === 'for_this_time'
                    ? 'Phone Direct (1x)'
                    : 'Phone Direct'}
                </span>
                <span className="xs:hidden">Net</span>
              </button>
            </div>
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

          {activeTab === 'cart' && currentUser && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: settings.smoothAnimations ? 0.22 : 0.1 }}
            >
              <VCCartView
                currentUser={currentUser}
                products={products}
                orders={orders}
                themeMode={settings.themeMode}
                onUpdateCurrentUser={setCurrentUser}
                onRefreshProducts={() => {
                  network.fetchProducts().then((prods) => {
                    if (prods && prods.length > 0) {
                      setProducts(prods);
                      storage.saveProducts(prods);
                    }
                  });
                }}
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
          network.setCurrentUser(user);
          network.setUserId(user.id);
          network.syncPeers();
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
            network.setCurrentUser(user);
            network.setUserId(user.id);
            network.syncPeers();
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
            network.syncPeers();
          }}
        />
      )}

      {/* Phone-to-Phone Mesh Network Modal */}
      <PhoneMeshModal
        isOpen={showPhoneMeshModal}
        onClose={() => setShowPhoneMeshModal(false)}
        currentUser={currentUser}
        members={members}
        connectedPeersCount={onlineCount}
      />

      {/* Independent Phone Network Access Prompt (Shows before opening sound and logo) */}
      <NetworkSetupModal
        isOpen={showNetworkPrompt}
        onSelect={handleNetworkChoice}
      />

      {/* Windows 7 Professional Style Startup Splash & Music */}
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
