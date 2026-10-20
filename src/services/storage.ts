import { User, ChatMessage, WalletTransaction, GraphDataPoint, AppSettings, UserRole } from '../types';
import { network } from './network';

export const COMMUNITY_CODES = {
  NORMAL: '80504',
  POWER: '00011',
  SUPER_ADMIN: '00099',
} as const;

export function getRoleFromCode(code: string): UserRole | null {
  const trimmed = code.trim();
  if (trimmed === COMMUNITY_CODES.NORMAL) return 'normal';
  if (trimmed === COMMUNITY_CODES.POWER) return 'power';
  if (trimmed === COMMUNITY_CODES.SUPER_ADMIN) return 'super_admin';
  return null;
}

export function getRoleTitle(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'power':
      return 'Power Person';
    case 'normal':
      return 'Normal Person';
  }
}

// Preset avatars for profile creation
export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
];

// Sample colourful images for community and personal chat
export const SAMPLE_CHAT_IMAGES = [
  {
    name: 'Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden ocean waves at dusk 🌅',
  },
  {
    name: 'Neon Cyber City',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    caption: 'Vibrant neon reflections in the district 🏙️',
  },
  {
    name: 'Emerald Aurora',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop&q=80',
    caption: 'Northern lights over the crystalline summit 🌌',
  },
  {
    name: 'Chromatic Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    caption: 'Minimalist colorful geometry & light 🎨',
  },
  {
    name: 'Tropical Flora',
    url: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop&q=80',
    caption: 'Lush tropical greenery in full bloom 🌿',
  },
];

// ZERO FAKE PERSONS: Real people register when they open and sign in to the app!
const INITIAL_MEMBERS: User[] = [];

const now = Date.now();
const INITIAL_COMMUNITY_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-genesis',
    senderId: 'system',
    senderName: 'VC Network',
    senderRole: 'super_admin',
    senderAvatar: '',
    text: '⚡ Welcome to the live VC Community! Real online presence tracking is active every 11 seconds. When real members join or talk, it updates live in front of you.',
    timestamp: now,
    isSystemAnnouncement: true,
  },
];

export const INITIAL_GRAPH_POINTS: GraphDataPoint[] = [
  { timeLabel: 'Genesis', value: 25000, timestamp: now - 3600000 * 12, change: 0 },
  { timeLabel: 'Active', value: 45000, timestamp: now, change: 20000 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'normal',
  neonColor: 'cyan',
  chatBubbleTheme: 'classic',
  smoothAnimations: true,
  soundEnabled: true,
};

class AppStorage {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('vc_community_channel');
        this.channel.onmessage = () => {
          this.notify();
        };
      } catch {
        // BroadcastChannel unsupported fallback
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private postSync() {
    try {
      this.channel?.postMessage({ timestamp: Date.now() });
    } catch {
      // Ignore
    }
    this.notify();
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('vc_current_user');
    if (!data) return null;
    try {
      const user = JSON.parse(data);
      // Clean up if it was a legacy fake bot user
      if (user.id?.startsWith('user-super-admin-alex') || user.id?.startsWith('user-power-') || user.id?.startsWith('user-normal-')) {
        localStorage.removeItem('vc_current_user');
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('vc_current_user', JSON.stringify(user));
      network.setUserId(user.id);
    } else {
      localStorage.removeItem('vc_current_user');
      network.setUserId(null);
    }
    this.postSync();
  }

  getMembers(): User[] {
    if (typeof window === 'undefined') return INITIAL_MEMBERS;
    const data = localStorage.getItem('vc_members');
    if (!data) return INITIAL_MEMBERS;
    try {
      const list: User[] = JSON.parse(data);
      // Filter out legacy fake persons
      return list.filter(
        (m) => !m.id.startsWith('user-super-admin-alex') && !m.id.startsWith('user-power-') && !m.id.startsWith('user-normal-')
      );
    } catch {
      return INITIAL_MEMBERS;
    }
  }

  saveMembers(members: User[]) {
    if (typeof window === 'undefined') return;
    const cleaned = members.filter(
      (m) => !m.id.startsWith('user-super-admin-alex') && !m.id.startsWith('user-power-') && !m.id.startsWith('user-normal-')
    );
    localStorage.setItem('vc_members', JSON.stringify(cleaned));
    this.postSync();
  }

  cutPowerPersonToNormal(userId: string): { success: boolean; message: string } {
    const current = this.getCurrentUser();
    if (!current || current.role !== 'super_admin') {
      return { success: false, message: 'Only Super Admin can cut power persons.' };
    }

    network.send({
      type: 'cut_power_person',
      adminId: current.id,
      targetUserId: userId,
    });

    return { success: true, message: 'Super Admin decree broadcasted.' };
  }

  promoteToPowerPerson(userId: string): { success: boolean; message: string } {
    const current = this.getCurrentUser();
    if (!current || current.role !== 'super_admin') {
      return { success: false, message: 'Only Super Admin can elevate members.' };
    }

    network.send({
      type: 'promote_to_power',
      adminId: current.id,
      targetUserId: userId,
    });

    return { success: true, message: 'Promotion broadcasted.' };
  }

  updateWalletBalance(userId: string, newBalance: number, note?: string): boolean {
    const current = this.getCurrentUser();
    if (!current) return false;

    // Update local member
    const members = this.getMembers();
    const target = members.find((m) => m.id === userId);
    if (target) {
      target.walletBalance = newBalance;
      this.saveMembers(members);
    }

    if (current.id === userId) {
      current.walletBalance = newBalance;
      this.setCurrentUser(current);
    }

    network.send({
      type: 'switch_wallet_currency',
      adminId: current.id,
      targetUserId: userId,
      newAmount: newBalance,
      note,
    });

    return true;
  }

  addTransaction(tx: WalletTransaction) {
    const txs = this.getTransactions();
    this.saveTransactions([tx, ...txs]);
  }

  addPersonalMessage(otherUserId: string, msg: ChatMessage) {
    const msgs = this.getPersonalMessages(otherUserId);
    this.savePersonalMessages(otherUserId, [...msgs, msg]);
  }

  getCommunityMessages(): ChatMessage[] {
    if (typeof window === 'undefined') return INITIAL_COMMUNITY_MESSAGES;
    const data = localStorage.getItem('vc_community_messages');
    if (!data) return INITIAL_COMMUNITY_MESSAGES;
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_COMMUNITY_MESSAGES;
    }
  }

  saveCommunityMessages(msgs: ChatMessage[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vc_community_messages', JSON.stringify(msgs));
    this.postSync();
  }

  getPersonalMessages(otherUserId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    const key = `vc_dm_${otherUserId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  savePersonalMessages(otherUserId: string, msgs: ChatMessage[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`vc_dm_${otherUserId}`, JSON.stringify(msgs));
    this.postSync();
  }

  getTransactions(): WalletTransaction[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('vc_transactions');
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveTransactions(txs: WalletTransaction[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vc_transactions', JSON.stringify(txs));
    this.postSync();
  }

  getGraphPoints(): GraphDataPoint[] {
    if (typeof window === 'undefined') return INITIAL_GRAPH_POINTS;
    const data = localStorage.getItem('vc_graph_points');
    if (!data) return INITIAL_GRAPH_POINTS;
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_GRAPH_POINTS;
    }
  }

  saveGraphPoints(pts: GraphDataPoint[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vc_graph_points', JSON.stringify(pts));
    this.postSync();
  }

  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const data = localStorage.getItem('vc_settings');
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: AppSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vc_settings', JSON.stringify(settings));
    this.postSync();
  }

  resetAll() {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    this.postSync();
  }
}

export const storage = new AppStorage();
