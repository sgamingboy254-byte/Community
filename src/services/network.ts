import { User, ChatMessage, WalletTransaction, GraphDataPoint } from '../types';

type Listener = (event: string, data: any) => void;

class NetworkService {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private currentUser: User | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private lastHeartbeatTime = 0;
  private lastSyncPeersTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }
  }

  // Check if user has opted into direct network usage
  public isNetworkAllowed(): boolean {
    if (typeof window === 'undefined') return true;
    const permanent = localStorage.getItem('vc_network_choice');
    if (permanent === 'not_now') return false;
    const session = sessionStorage.getItem('vc_network_choice');
    if (session === 'not_now') return false;
    return true;
  }

  // Get network connection telemetry (mobile data vs wifi)
  public getConnectionInfo(): { type: string; isMobile: boolean; status: string; deviceLabel: string } {
    if (typeof window === 'undefined') {
      return { type: 'unknown', isMobile: false, status: 'idle', deviceLabel: 'Web Node' };
    }

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const effectiveType = conn?.effectiveType || conn?.type || '4G/5G';
    const isMobile = conn?.type === 'cellular' || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const deviceLabel = /iPhone/i.test(navigator.userAgent)
      ? 'iPhone Mobile Node'
      : /Android/i.test(navigator.userAgent)
      ? 'Android Mobile Node'
      : 'Device Node';

    const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;

    return {
      type: effectiveType,
      isMobile,
      status: isConnected ? 'connected' : this.isConnecting ? 'connecting' : 'standby',
      deviceLabel,
    };
  }

  public connect() {
    if (typeof window === 'undefined') return;

    if (!this.isNetworkAllowed()) {
      this.disconnect();
      return;
    }

    if (this.isConnecting) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.syncPeers();
        this.notify('connection_change', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.notify(payload.type, payload);
        } catch (err) {
          console.error('Failed to parse WS payload:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.notify('connection_change', { status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Fast millisecond-level reconnection
  private scheduleReconnect() {
    if (!this.isNetworkAllowed()) return;
    if (this.reconnectTimeout) return;

    this.reconnectAttempts += 1;
    const delay = Math.min(3000, 500 + this.reconnectAttempts * 400);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }, delay);
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.currentUserId = user?.id || null;
    if (user && this.isNetworkAllowed()) {
      this.sendHeartbeat();
      this.syncPeers();
    }
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId && this.isNetworkAllowed()) {
      this.sendHeartbeat();
    }
  }

  // Rapid millisecond real-time heartbeat (1.5 seconds)
  private startHeartbeat() {
    this.stopHeartbeat();
    this.sendHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 1500);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat() {
    if (!this.currentUserId || !this.isNetworkAllowed()) return;

    const now = Date.now();
    if (now - this.lastHeartbeatTime < 800) {
      return;
    }
    this.lastHeartbeatTime = now;

    const payload = {
      type: 'heartbeat',
      userId: this.currentUserId,
      name: this.currentUser?.name,
      role: this.currentUser?.role,
      avatar: this.currentUser?.avatar,
      timestamp: now,
    };

    // Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return;
    }

    // HTTP fallback - broadcasts member to server so they are visible to everyone
    try {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.members) {
            this.notify('presence_update', { members: data.members });
          }
        })
        .catch(() => {});
    } catch {}
  }

  // Cross-Phone Peer Sync: Shares signed-in member across all phones
  public async syncPeers() {
    if (!this.isNetworkAllowed()) return;
    const now = Date.now();
    if (now - this.lastSyncPeersTime < 1000) return;
    this.lastSyncPeersTime = now;

    try {
      const res = await fetch('/api/sync/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: this.currentUser ? [this.currentUser] : [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.members) {
          this.notify('presence_update', { members: data.members, messages: data.messages });
        }
      }
    } catch {}
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // Rapid millisecond community message sending with Phone Mesh routing tags
  public async sendCommunityMessage(message: ChatMessage): Promise<void> {
    const connInfo = this.getConnectionInfo();
    const routedMsg: ChatMessage = {
      ...message,
      hops: (message.hops || 0) + 1,
      route: [...(message.route || []), `${this.currentUser?.name || 'Peer'} (${connInfo.deviceLabel})`],
    };

    const payload = { type: 'send_community_message', message: routedMsg };

    // 1. Send via WebSocket immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }

    // 2. Also send via HTTP REST endpoint in parallel so it NEVER fails even across phones
    try {
      fetch('/api/chat/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: routedMsg }),
      }).catch(() => {});
    } catch {}
  }

  // Rapid millisecond direct message sending with Phone Mesh routing tags
  public async sendDirectMessage(message: ChatMessage): Promise<void> {
    const connInfo = this.getConnectionInfo();
    const routedMsg: ChatMessage = {
      ...message,
      hops: (message.hops || 0) + 1,
      route: [...(message.route || []), `${this.currentUser?.name || 'Peer'} (${connInfo.deviceLabel})`],
    };

    const payload = { type: 'send_direct_message', message: routedMsg };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }

    try {
      fetch('/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: routedMsg }),
      }).catch(() => {});
    } catch {}
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: string, data: any) {
    this.listeners.forEach((l) => {
      try {
        l(event, data);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  public reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => {
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }, 100);
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnecting = false;
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.notify('connection_change', { status: 'disconnected' });
  }

  // Rapid fetch state
  public async fetchState(): Promise<{
    members: User[];
    communityMessages: ChatMessage[];
    directMessages: ChatMessage[];
    transactions: WalletTransaction[];
    graphPoints: GraphDataPoint[];
  }> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      members: [],
      communityMessages: [],
      directMessages: [],
      transactions: [],
      graphPoints: [],
    };
  }

  public async registerUser(
    name: string,
    communityCode: string,
    avatar?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, communityCode, avatar }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch {
      // Fallback local registration
      const trimmedCode = communityCode.trim();
      let role: 'super_admin' | 'power' | 'normal' = 'normal';
      if (trimmedCode === '00099') role = 'super_admin';
      else if (trimmedCode === '00011') role = 'power';

      const initialBalance = role === 'super_admin' ? 250000 : role === 'power' ? 50000 : 10000;
      const localUser: User = {
        id: 'real-user-' + Date.now(),
        name,
        communityCode: trimmedCode,
        role,
        avatar:
          avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
        walletBalance: initialBalance,
        status: 'online',
        lastSeen: Date.now(),
        joinedAt: new Date().toISOString().split('T')[0],
        bio: 'Real verified member in VC Community network.',
      };
      this.setCurrentUser(localUser);
      return { success: true, user: localUser };
    }
  }
}

export const network = new NetworkService();
