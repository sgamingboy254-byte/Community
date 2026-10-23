export type UserRole = 'normal' | 'power' | 'super_admin';

export interface User {
  id: string;
  name: string;
  communityCode: string; // '80504' | '00011' | '00099'
  role: UserRole;
  avatar: string;
  walletBalance: number;
  status: 'online' | 'away' | 'offline';
  joinedAt: string;
  bio?: string;
  lastSeen?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string; // Base64 audio string (data:audio/webm;base64,...)
  audioDuration?: number; // Duration in seconds
  timestamp: number;
  isDirect?: boolean;
  recipientId?: string; // For personal chat
  isSystemAnnouncement?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  hops?: number;
  route?: string[];
}

export interface WalletTransaction {
  id: string;
  title: string;
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'admin_grant' | 'community_reward';
  amount: number;
  timestamp: number;
  counterpartName?: string;
  note?: string;
}

export interface GraphDataPoint {
  timeLabel: string;
  value: number;
  timestamp: number;
  change: number;
}

export type ThemeMode = 'normal' | 'dark' | 'neon';

export type NeonColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'pink';

export type ChatBubbleTheme = 'classic' | 'neon' | 'sunset' | 'emerald' | 'noir' | 'ocean';

export interface AppSettings {
  themeMode: ThemeMode;
  neonColor: NeonColor;
  chatBubbleTheme: ChatBubbleTheme;
  smoothAnimations: boolean;
  soundEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  stock?: number;
  createdBy: string;
  creatorName: string;
  createdAt: number;
}

export type PaymentMethod = 'vc_currency' | 'cash_on_delivery';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending_cod' | 'delivered';
  timestamp: number;
  shippingAddress?: string;
  contactNumber?: string;
}
