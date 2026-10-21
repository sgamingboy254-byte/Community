import { User, ChatMessage, WalletTransaction, GraphDataPoint } from '../types';

type Listener = (event: string, data: any) => void;

class NetworkService {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined' || this.isConnecting) return;
    this.isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Start 11-second heartbeat immediately upon connection
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
        // Auto-reconnect after 3 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch (err) {
      this.isConnecting = false;
      if (!this.reconnectTimeout) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, 3000);
      }
    }
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      this.sendHeartbeat();
    }
  }

  // Exact 11-Second Update Heartbeat as requested:
  // "add working time app means 11 second update also track so if someone was ad in the app it will track it"
  private startHeartbeat() {
    this.stopHeartbeat();
    this.sendHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 11000); // 11-second interval
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat() {
    if (!this.currentUserId) return;

    // Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'heartbeat',
          userId: this.currentUserId,
          timestamp: Date.now(),
        })
      );
    }

    // Also send HTTP fallback
    try {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUserId }),
      }).catch(() => {});
    } catch {
      // Ignore network errors
    }
  }

  public send(payload: any) {
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
        console.error('Listener error:', err);
      }
    });
  }

  // Register real person on server
  public async registerUser(name: string, communityCode: string, avatar?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, communityCode, avatar }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.setUserId(data.user.id);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Failed to authenticate' };
    } catch (err) {
      return { success: false, error: 'Network error communicating with server' };
    }
  }

  // Fetch initial full server state
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
    } catch {
      // Network fallback
    }
    return {
      members: [],
      communityMessages: [],
      directMessages: [],
      transactions: [],
      graphPoints: [],
    };
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.notify('connection_change', { status: 'disconnected' });
  }
}

export const network = new NetworkService();
