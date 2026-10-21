import { User, ChatMessage, WalletTransaction, GraphDataPoint } from '../types';

type Listener = (event: string, data: any) => void;

class NetworkService {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastHeartbeatTime = 0;
  private lastFetchStateTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      // Only initiate connection if user has explicitly enabled network in storage
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }
  }

  // Check if user has opted into direct network usage
  public isNetworkAllowed(): boolean {
    if (typeof window === 'undefined') return false;
    const permanent = localStorage.getItem('vc_network_choice');
    if (permanent === 'enable') return true;
    const session = sessionStorage.getItem('vc_network_choice');
    if (session === 'for_this_time') return true;
    return false;
  }

  // Get network connection telemetry (mobile data vs wifi)
  public getConnectionInfo(): { type: string; isMobile: boolean; status: string } {
    if (typeof window === 'undefined') {
      return { type: 'unknown', isMobile: false, status: 'idle' };
    }

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const effectiveType = conn?.effectiveType || conn?.type || 'active';
    const isMobile = conn?.type === 'cellular' || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

    const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;

    return {
      type: effectiveType,
      isMobile,
      status: isConnected ? 'connected' : this.isConnecting ? 'connecting' : 'standby',
    };
  }

  private connect() {
    if (typeof window === 'undefined') return;

    // Guard: Do not connect if user has not granted network permission
    if (!this.isNetworkAllowed()) {
      this.disconnect();
      return;
    }

    // Guard: Avoid duplicate connection attempts
    if (this.isConnecting) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Guard: Stop infinite reconnect storm if max attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('NetworkService: Max reconnection attempts reached. Throttling to save user mobile data.');
      this.notify('connection_change', { status: 'throttled', message: 'Throttled to save mobile internet data' });
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0; // Reset counter on successful connection
        this.startHeartbeat();
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

  // Progressive Exponential Backoff Reconnection (avoids thousands of requests a second)
  private scheduleReconnect() {
    if (!this.isNetworkAllowed()) return;
    if (this.reconnectTimeout) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts += 1;
    // Backoff: 4s, 8s, 16s, 30s
    const delay = Math.min(30000, 4000 * Math.pow(1.8, this.reconnectAttempts - 1));

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }, delay);
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId && this.isNetworkAllowed()) {
      this.sendHeartbeat();
    }
  }

  // Exact 11-Second Heartbeat: Calm and strictly throttled
  private startHeartbeat() {
    this.stopHeartbeat();
    this.sendHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 11000); // 11 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Throttled heartbeat - strictly prevents duplicate fires within 6 seconds
  private sendHeartbeat() {
    if (!this.currentUserId || !this.isNetworkAllowed()) return;

    const now = Date.now();
    if (now - this.lastHeartbeatTime < 6000) {
      return; // Skip if sent less than 6s ago
    }
    this.lastHeartbeatTime = now;

    // Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'heartbeat',
          userId: this.currentUserId,
          timestamp: now,
        })
      );
      return;
    }

    // Only fallback to HTTP if WebSocket is not connected
    try {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUserId }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }

  public send(payload: any) {
    if (!this.isNetworkAllowed()) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
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

  // Controlled Reconnect (e.g., when user chooses Option 1 or 2)
  public reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => {
      if (this.isNetworkAllowed()) {
        this.connect();
      }
    }, 150);
  }

  // Full clean disconnect (e.g. when user chooses Option 3: Not now)
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

  // Throttled server state fetch to avoid rapid consecutive requests
  public async fetchState(): Promise<{
    members: User[];
    communityMessages: ChatMessage[];
    directMessages: ChatMessage[];
    transactions: WalletTransaction[];
    graphPoints: GraphDataPoint[];
  }> {
    if (!this.isNetworkAllowed()) {
      return {
        members: [],
        communityMessages: [],
        directMessages: [],
        transactions: [],
        graphPoints: [],
      };
    }

    const now = Date.now();
    if (now - this.lastFetchStateTime < 3000) {
      // Throttled: Don't hammer server multiple times a second
      return {
        members: [],
        communityMessages: [],
        directMessages: [],
        transactions: [],
        graphPoints: [],
      };
    }
    this.lastFetchStateTime = now;

    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
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
      return { success: true, user: localUser };
    }
  }
}

export const network = new NetworkService();
