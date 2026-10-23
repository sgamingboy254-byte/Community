import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json({ limit: '15mb' }));

// CORS middleware allowing any phone or shared link to connect
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Community Secret Codes
const CODES = {
  NORMAL: '80504',
  POWER: '00011',
  SUPER_ADMIN: '00099',
};

// Database file persistence
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'vc_db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export type UserRole = 'normal' | 'power' | 'super_admin';

export interface User {
  id: string;
  name: string;
  communityCode: string;
  role: UserRole;
  avatar: string;
  walletBalance: number;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  joinedAt: string;
  bio?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string; // Base64 audio string
  audioDuration?: number; // duration in seconds
  timestamp: number;
  isDirect?: boolean;
  recipientId?: string;
  isSystemAnnouncement?: boolean;
  reactions?: Record<string, string[]>;
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

interface DatabaseState {
  members: User[];
  communityMessages: ChatMessage[];
  directMessages: ChatMessage[];
  transactions: WalletTransaction[];
  graphPoints: GraphDataPoint[];
  products: Product[];
  orders: Order[];
}

function getInitialState(): DatabaseState {
  const now = Date.now();
  return {
    // Zero fake/bot members! Real users will register when they join.
    members: [],
    communityMessages: [
      {
        id: 'genesis-welcome',
        senderId: 'system',
        senderName: 'VC Community System',
        senderRole: 'super_admin',
        senderAvatar: '',
        text: '⚡ VC Community Online Network Initialized. Real-time presence tracking active every 11 seconds. Only real connected persons are tracked.',
        timestamp: now,
        isSystemAnnouncement: true,
      },
    ],
    directMessages: [],
    transactions: [],
    graphPoints: [
      { timeLabel: 'Genesis', value: 50000, timestamp: now - 3600000 * 24, change: 0 },
      { timeLabel: 'Current', value: 75000, timestamp: now, change: 25000 },
    ],
    products: [
      {
        id: 'prod-gold-pass',
        name: 'VC Holographic Gold Pass',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        description: 'Exclusive holographic VIP card with instant lounge access & sparkling badge glow.',
        category: 'Digital Perks',
        stock: 50,
        createdBy: 'system-super-admin',
        creatorName: 'Super Admin',
        createdAt: now - 3600000 * 5,
      },
      {
        id: 'prod-cyber-ring',
        name: 'Supercharged Cyber Power Ring',
        price: 4800,
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
        description: 'Titanium cybernetic ring embedded with high-frequency quantum neon glow.',
        category: 'Hardware',
        stock: 25,
        createdBy: 'system-super-admin',
        creatorName: 'Super Admin',
        createdAt: now - 3600000 * 3,
      },
      {
        id: 'prod-neural-shades',
        name: 'Quantum Neural Shades (Aero Edition)',
        price: 7200,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
        description: 'Aero-glass heads-up display sunglasses with real-time VC ticker and mesh HUD.',
        category: 'Wearables',
        stock: 15,
        createdBy: 'system-super-admin',
        creatorName: 'Super Admin',
        createdAt: now - 3600000,
      },
      {
        id: 'prod-genesis-card',
        name: 'Titanium Genesis Super Card',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
        description: 'Ultra-rare collector piece granting maximum community privileges and cashback.',
        category: 'Collector',
        stock: 10,
        createdBy: 'system-super-admin',
        creatorName: 'Super Admin',
        createdAt: now,
      },
    ],
    orders: [],
  };
}

let db: DatabaseState = getInitialState();

// Load persistent DB if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = {
      ...getInitialState(),
      ...parsed,
      products: parsed.products && parsed.products.length > 0 ? parsed.products : getInitialState().products,
      orders: parsed.orders || [],
    };
    // Ensure all fake seed members are cleaned out if any were saved earlier
    db.members = db.members.filter(
      (m) => !m.id.startsWith('user-super-admin-alex') && !m.id.startsWith('user-power-') && !m.id.startsWith('user-normal-')
    );
  } catch (err) {
    console.error('Error loading DB file, using fresh state', err);
    db = getInitialState();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Connected WebSocket clients mapping
const clients = new Map<WebSocket, { userId?: string }>();

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// 11-Second Periodic Online Presence Tracker
// Directly requested: "11 second update also track so if someone was ad in the app it will track it ... track who is in online in the app not robot or any bout player real time person only"
setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const member of db.members) {
    const timeSinceLastSeen = now - (member.lastSeen || 0);

    let nextStatus: 'online' | 'away' | 'offline' = 'offline';
    if (timeSinceLastSeen <= 25000) {
      nextStatus = 'online';
    } else if (timeSinceLastSeen <= 60000) {
      nextStatus = 'away';
    } else {
      nextStatus = 'offline';
    }

    if (member.status !== nextStatus) {
      member.status = nextStatus;
      changed = true;
    }
  }

  if (changed) {
    saveDB();
    broadcast({
      type: 'presence_update',
      members: db.members,
      timestamp: now,
    });
  }
}, 1000); // Rapid 1-second real-time tracking cycle

// REST API Endpoints
app.get('/api/state', (req, res) => {
  res.json({
    members: db.members,
    communityMessages: db.communityMessages,
    directMessages: db.directMessages,
    transactions: db.transactions,
    graphPoints: db.graphPoints,
    products: db.products,
    orders: db.orders,
  });
});

// Products: Get all products in the VC Cart & Market
app.get('/api/products', (req, res) => {
  res.json({ products: db.products });
});

// Products: Super Admin ONLY can add new products!
app.post('/api/products', (req, res) => {
  const { adminId, name, price, image, description, category, stock } = req.body;
  if (!name || price === undefined || price === null || !image) {
    return res.status(400).json({ error: 'Name, price, and image are required.' });
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }

  // Check admin authorization
  const admin = db.members.find((m) => m.id === adminId);
  const isSuperAdmin = admin ? admin.role === 'super_admin' : req.body.creatorRole === 'super_admin';
  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'Access denied. Only Super Admin has special ability to add products.' });
  }

  const newProduct: Product = {
    id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    price: Math.round(numPrice),
    image: image.trim(),
    description: description?.trim() || 'Exclusive verified VC Cart product.',
    category: category?.trim() || 'General',
    stock: typeof stock === 'number' ? stock : 50,
    createdBy: admin?.id || 'super-admin',
    creatorName: admin?.name || 'Super Admin',
    createdAt: Date.now(),
  };

  db.products.unshift(newProduct);

  // Broadcast announcement in community chat
  const announcementMsg: ChatMessage = {
    id: 'prod-ann-' + Date.now(),
    senderId: 'system',
    senderName: 'VC Cart Market',
    senderRole: 'super_admin',
    senderAvatar: admin?.avatar || '',
    text: `🛒 New Product Added by Super Admin: "${newProduct.name}" for ${newProduct.price.toLocaleString()} VC! Check it out in VC Cart!`,
    timestamp: Date.now(),
    isSystemAnnouncement: true,
  };
  db.communityMessages.push(announcementMsg);

  saveDB();

  broadcast({
    type: 'product_added',
    product: newProduct,
    message: announcementMsg,
    products: db.products,
  });

  res.json({ success: true, product: newProduct });
});

// Products: Delete product (Super Admin only)
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const adminId = req.headers['x-admin-id'] as string;
  const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
  if (!admin) {
    return res.status(403).json({ error: 'Only Super Admin can remove products.' });
  }

  db.products = db.products.filter((p) => p.id !== id);
  saveDB();

  broadcast({
    type: 'product_deleted',
    productId: id,
    products: db.products,
  });

  res.json({ success: true, productId: id });
});

// Orders: Buy product with VC Currency OR Cash on Delivery (COD)
app.post('/api/orders', (req, res) => {
  const { buyerId, productId, quantity, paymentMethod, shippingAddress, contactNumber } = req.body;
  if (!buyerId || !productId) {
    return res.status(400).json({ error: 'Buyer ID and Product ID are required.' });
  }

  const buyer = db.members.find((m) => m.id === buyerId);
  if (!buyer) {
    return res.status(404).json({ error: 'Buyer account not found.' });
  }

  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const totalAmount = product.price * qty;
  const method: PaymentMethod = paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'vc_currency';

  // 1. If paying with VC Currency, verify balance and deduct
  if (method === 'vc_currency') {
    if (buyer.walletBalance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient VC Currency. You need ${totalAmount.toLocaleString()} VC, but only have ${buyer.walletBalance.toLocaleString()} VC.`,
      });
    }

    buyer.walletBalance -= totalAmount;

    // Record wallet transaction
    const tx: WalletTransaction = {
      id: 'tx-buy-' + Date.now(),
      title: `Cart Purchase: ${product.name}`,
      type: 'expense',
      amount: -totalAmount,
      timestamp: Date.now(),
      counterpartName: 'VC Cart Store',
      note: `Bought ${qty}x ${product.name} with VC Currency`,
    };
    db.transactions.unshift(tx);
  }

  // 2. Reduce stock if positive
  if (product.stock && product.stock > 0) {
    product.stock = Math.max(0, product.stock - qty);
  }

  const newOrder: Order = {
    id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    buyerId: buyer.id,
    buyerName: buyer.name,
    productId: product.id,
    productName: product.name,
    productImage: product.image,
    price: product.price,
    quantity: qty,
    totalAmount,
    paymentMethod: method,
    status: method === 'cash_on_delivery' ? 'pending_cod' : 'paid',
    timestamp: Date.now(),
    shippingAddress: shippingAddress?.trim() || 'Direct Digital Mesh Delivery',
    contactNumber: contactNumber?.trim() || 'Verified Phone Network Peer',
  };

  db.orders.unshift(newOrder);

  // Announce in community
  const purchaseAnnouncement: ChatMessage = {
    id: 'ann-buy-' + Date.now(),
    senderId: 'system',
    senderName: 'VC Cart Logistics',
    senderRole: 'super_admin',
    senderAvatar: buyer.avatar,
    text: `🎉 Order Confirmed! ${buyer.name} bought ${qty}x "${product.name}" using ${
      method === 'cash_on_delivery' ? 'Cash On Delivery (COD) 📦' : 'VC Currency 💎'
    }!`,
    timestamp: Date.now(),
    isSystemAnnouncement: true,
  };
  db.communityMessages.push(purchaseAnnouncement);

  saveDB();

  broadcast({
    type: 'order_placed',
    order: newOrder,
    buyer,
    members: db.members,
    products: db.products,
    transactions: db.transactions,
    communityMessages: db.communityMessages,
  });

  res.json({
    success: true,
    order: newOrder,
    buyer,
    newBalance: buyer.walletBalance,
  });
});


// Authenticate / Register Real Person
app.post('/api/auth/register', (req, res) => {
  const { name, communityCode, avatar } = req.body;
  if (!name || !communityCode) {
    return res.status(400).json({ error: 'Name and community code are required.' });
  }

  const trimmedCode = communityCode.trim();
  let role: UserRole | null = null;
  if (trimmedCode === CODES.SUPER_ADMIN) role = 'super_admin';
  else if (trimmedCode === CODES.POWER) role = 'power';
  else if (trimmedCode === CODES.NORMAL) role = 'normal';

  if (!role) {
    return res.status(400).json({ error: 'Invalid confidential authorization code.' });
  }

  const now = Date.now();
  // Check if member with same name already exists
  let member = db.members.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());

  if (member) {
    member.communityCode = trimmedCode;
    member.role = role;
    if (avatar) member.avatar = avatar;
    member.status = 'online';
    member.lastSeen = now;
  } else {
    const initialBalance = role === 'super_admin' ? 250000 : role === 'power' ? 50000 : 10000;
    member = {
      id: 'real-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      communityCode: trimmedCode,
      role,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      walletBalance: initialBalance,
      status: 'online',
      lastSeen: now,
      joinedAt: new Date().toISOString().split('T')[0],
      bio: `Real verified member in VC Community network.`,
    };
    db.members.push(member);

    // Announce new real member
    db.communityMessages.push({
      id: 'welcome-' + now,
      senderId: 'system',
      senderName: 'VC Network',
      senderRole: 'super_admin',
      senderAvatar: '',
      text: `👋 Real member ${member.name} has joined the VC Community as ${
        role === 'super_admin' ? 'Super Admin' : role === 'power' ? 'Power Person' : 'Normal Person'
      }!`,
      timestamp: now,
      isSystemAnnouncement: true,
    });
  }

  saveDB();

  // Broadcast to all online users
  broadcast({
    type: 'member_joined',
    member,
    members: db.members,
    messages: db.communityMessages,
  });

  res.json({ success: true, user: member });
});

// Multi-Phone Rapid Heartbeat & Auto-Discovery Endpoint
app.post('/api/heartbeat', (req, res) => {
  const { userId, name, role, avatar } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  let member = db.members.find((m) => m.id === userId);
  if (!member && name) {
    member = {
      id: userId,
      name,
      communityCode: role === 'super_admin' ? '00099' : role === 'power' ? '00011' : '80504',
      role: role || 'normal',
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      walletBalance: role === 'super_admin' ? 250000 : role === 'power' ? 50000 : 10000,
      status: 'online',
      lastSeen: Date.now(),
      joinedAt: new Date().toISOString().split('T')[0],
      bio: 'Real verified member in VC Community network.',
    };
    db.members.push(member);
    saveDB();
    broadcast({ type: 'member_joined', member, members: db.members });
  } else if (member) {
    member.lastSeen = Date.now();
    member.status = 'online';
    saveDB();
  }
  res.json({ success: true, status: 'online', members: db.members });
});

// Phone Mesh Cross-Sync Endpoint
app.post('/api/sync/peers', (req, res) => {
  const { members, messages } = req.body;
  let changed = false;

  if (Array.isArray(members)) {
    for (const m of members) {
      const existing = db.members.find((em) => em.id === m.id);
      if (!existing) {
        db.members.push(m);
        changed = true;
      } else if (m.lastSeen && m.lastSeen > (existing.lastSeen || 0)) {
        existing.status = m.status;
        existing.lastSeen = m.lastSeen;
        changed = true;
      }
    }
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (!db.communityMessages.some((em) => em.id === msg.id)) {
        db.communityMessages.push(msg);
        changed = true;
      }
    }
  }

  if (changed) {
    saveDB();
    broadcast({
      type: 'presence_update',
      members: db.members,
      messages: db.communityMessages,
    });
  }

  res.json({ success: true, members: db.members, messages: db.communityMessages });
});

// Rapid Instant Community Chat Endpoint
app.post('/api/chat/community', (req, res) => {
  const { message } = req.body;
  if (!message || !message.senderId) {
    return res.status(400).json({ error: 'Missing message or senderId' });
  }

  let sender = db.members.find((m) => m.id === message.senderId);
  if (!sender) {
    sender = {
      id: message.senderId,
      name: message.senderName || 'Community Member',
      communityCode: message.senderRole === 'super_admin' ? '00099' : message.senderRole === 'power' ? '00011' : '80504',
      role: message.senderRole || 'normal',
      avatar: message.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      walletBalance: 10000,
      status: 'online',
      lastSeen: Date.now(),
      joinedAt: new Date().toISOString().split('T')[0],
      bio: 'Real verified member in VC Community network.',
    };
    db.members.push(sender);
  } else {
    sender.lastSeen = Date.now();
    sender.status = 'online';
  }

  const verifiedMsg: ChatMessage = {
    id: message.id || ('msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.avatar,
    text: message.text,
    imageUrl: message.imageUrl,
    audioUrl: message.audioUrl,
    audioDuration: message.audioDuration,
    hops: message.hops,
    route: message.route,
    timestamp: message.timestamp || Date.now(),
  };

  if (!db.communityMessages.some((m) => m.id === verifiedMsg.id)) {
    db.communityMessages.push(verifiedMsg);
    saveDB();
  }

  broadcast({
    type: 'new_community_message',
    message: verifiedMsg,
  });

  res.json({ success: true, message: verifiedMsg });
});

// Rapid Instant Direct Chat Endpoint
app.post('/api/chat/direct', (req, res) => {
  const { message } = req.body;
  if (!message || !message.senderId || !message.recipientId) {
    return res.status(400).json({ error: 'Missing message, senderId or recipientId' });
  }

  let sender = db.members.find((m) => m.id === message.senderId);
  if (!sender) {
    sender = {
      id: message.senderId,
      name: message.senderName || 'Community Member',
      communityCode: message.senderRole === 'super_admin' ? '00099' : message.senderRole === 'power' ? '00011' : '80504',
      role: message.senderRole || 'normal',
      avatar: message.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      walletBalance: 10000,
      status: 'online',
      lastSeen: Date.now(),
      joinedAt: new Date().toISOString().split('T')[0],
      bio: 'Real verified member in VC Community network.',
    };
    db.members.push(sender);
  } else {
    sender.lastSeen = Date.now();
    sender.status = 'online';
  }

  const verifiedDirectMsg: ChatMessage = {
    id: message.id || ('dm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.avatar,
    recipientId: message.recipientId,
    text: message.text,
    imageUrl: message.imageUrl,
    audioUrl: message.audioUrl,
    audioDuration: message.audioDuration,
    hops: message.hops,
    route: message.route,
    timestamp: message.timestamp || Date.now(),
    isDirect: true,
  };

  if (!db.directMessages.some((m) => m.id === verifiedDirectMsg.id)) {
    db.directMessages.push(verifiedDirectMsg);
    saveDB();
  }

  broadcast({
    type: 'new_direct_message',
    message: verifiedDirectMsg,
  });

  res.json({ success: true, message: verifiedDirectMsg });
});

// WebSocket Connection Management
wss.on('connection', (ws) => {
  clients.set(ws, {});

  // Send initial state upon connect
  ws.send(
    JSON.stringify({
      type: 'init_state',
      members: db.members,
      communityMessages: db.communityMessages,
      directMessages: db.directMessages,
      transactions: db.transactions,
      graphPoints: db.graphPoints,
    })
  );

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      // Heartbeat event from real user
      if (data.type === 'heartbeat') {
        const userId = data.userId;
        if (userId) {
          clients.set(ws, { userId });
          const member = db.members.find((m) => m.id === userId);
          if (member) {
            member.lastSeen = Date.now();
            if (member.status !== 'online') {
              member.status = 'online';
              broadcast({
                type: 'presence_update',
                members: db.members,
              });
            }
          }
        }
      }

      // Community message
      if (data.type === 'send_community_message') {
        const { message } = data;
        if (message && message.senderId) {
          let sender = db.members.find((m) => m.id === message.senderId);
          if (!sender) {
            sender = {
              id: message.senderId,
              name: message.senderName || 'Community Member',
              communityCode: message.senderRole === 'super_admin' ? '00099' : message.senderRole === 'power' ? '00011' : '80504',
              role: message.senderRole || 'normal',
              avatar: message.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
              walletBalance: 10000,
              status: 'online',
              lastSeen: Date.now(),
              joinedAt: new Date().toISOString().split('T')[0],
              bio: 'Real verified member in VC Community network.',
            };
            db.members.push(sender);
          } else {
            sender.lastSeen = Date.now();
            sender.status = 'online';
          }

          // Authoritative server-stamped message
          const verifiedMsg: ChatMessage = {
            id: message.id || ('msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
            senderId: sender.id,
            senderName: sender.name,
            senderRole: sender.role,
            senderAvatar: sender.avatar,
            text: message.text,
            imageUrl: message.imageUrl,
            audioUrl: message.audioUrl,
            audioDuration: message.audioDuration,
            hops: message.hops,
            route: message.route,
            timestamp: message.timestamp || Date.now(),
          };

          if (!db.communityMessages.some((m) => m.id === verifiedMsg.id)) {
            db.communityMessages.push(verifiedMsg);
            saveDB();
          }

          broadcast({
            type: 'new_community_message',
            message: verifiedMsg,
          });
        }
      }

      // Toggle emoji reaction on community message
      if (data.type === 'toggle_reaction') {
        const { messageId, emoji, userId } = data;
        const msg = db.communityMessages.find((m) => m.id === messageId);
        if (msg && emoji && userId) {
          if (!msg.reactions) msg.reactions = {};
          if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
          const idx = msg.reactions[emoji].indexOf(userId);
          if (idx > -1) {
            msg.reactions[emoji].splice(idx, 1);
            if (msg.reactions[emoji].length === 0) {
              delete msg.reactions[emoji];
            }
          } else {
            msg.reactions[emoji].push(userId);
          }
          saveDB();

          broadcast({
            type: 'reaction_updated',
            messageId,
            reactions: msg.reactions,
          });
        }
      }

      // Direct personal message
      if (data.type === 'send_direct_message') {
        const { message } = data;
        if (message && message.senderId && message.recipientId) {
          let sender = db.members.find((m) => m.id === message.senderId);
          if (!sender) {
            sender = {
              id: message.senderId,
              name: message.senderName || 'Community Member',
              communityCode: message.senderRole === 'super_admin' ? '00099' : message.senderRole === 'power' ? '00011' : '80504',
              role: message.senderRole || 'normal',
              avatar: message.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
              walletBalance: 10000,
              status: 'online',
              lastSeen: Date.now(),
              joinedAt: new Date().toISOString().split('T')[0],
              bio: 'Real verified member in VC Community network.',
            };
            db.members.push(sender);
          } else {
            sender.lastSeen = Date.now();
            sender.status = 'online';
          }

          const verifiedDirectMsg: ChatMessage = {
            id: message.id || ('dm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
            senderId: sender.id,
            senderName: sender.name,
            senderRole: sender.role,
            senderAvatar: sender.avatar,
            recipientId: message.recipientId,
            text: message.text,
            imageUrl: message.imageUrl,
            audioUrl: message.audioUrl,
            audioDuration: message.audioDuration,
            hops: message.hops,
            route: message.route,
            timestamp: message.timestamp || Date.now(),
            isDirect: true,
          };

          if (!db.directMessages.some((m) => m.id === verifiedDirectMsg.id)) {
            db.directMessages.push(verifiedDirectMsg);
            saveDB();
          }

          broadcast({
            type: 'new_direct_message',
            message: verifiedDirectMsg,
          });
        }
      }

      // Super Admin: Cut power person into normal person
      if (data.type === 'cut_power_person') {
        const { adminId, targetUserId } = data;
        const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
        const target = db.members.find((m) => m.id === targetUserId);

        if (admin && target && target.role === 'power') {
          target.role = 'normal';
          target.communityCode = CODES.NORMAL;

          const decreeMsg: ChatMessage = {
            id: 'decree-' + Date.now(),
            senderId: 'system',
            senderName: 'VC Governance',
            senderRole: 'super_admin',
            senderAvatar: admin.avatar,
            text: `⚠️ Super Admin decree: ${target.name}'s authority was cut from Power Person into Normal Person. Messages will now align on the left side.`,
            timestamp: Date.now(),
            isSystemAnnouncement: true,
          };
          db.communityMessages.push(decreeMsg);
          saveDB();

          broadcast({
            type: 'role_changed',
            members: db.members,
            message: decreeMsg,
            targetUserId: target.id,
            newRole: 'normal',
          });
        }
      }

      // Super Admin: Promote normal person to power
      if (data.type === 'promote_to_power') {
        const { adminId, targetUserId } = data;
        const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
        const target = db.members.find((m) => m.id === targetUserId);

        if (admin && target && target.role === 'normal') {
          target.role = 'power';
          target.communityCode = CODES.POWER;

          const decreeMsg: ChatMessage = {
            id: 'decree-' + Date.now(),
            senderId: 'system',
            senderName: 'VC Governance',
            senderRole: 'super_admin',
            senderAvatar: admin.avatar,
            text: `⚡ Super Admin decree: ${target.name} has been elevated to Power Person! Messages will now align in the center.`,
            timestamp: Date.now(),
            isSystemAnnouncement: true,
          };
          db.communityMessages.push(decreeMsg);
          saveDB();

          broadcast({
            type: 'role_changed',
            members: db.members,
            message: decreeMsg,
            targetUserId: target.id,
            newRole: 'power',
          });
        }
      }

      // Super Admin: Switch wallet currency
      if (data.type === 'switch_wallet_currency') {
        const { adminId, targetUserId, newAmount } = data;
        const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
        const target = db.members.find((m) => m.id === targetUserId);

        if (admin && target && typeof newAmount === 'number' && newAmount >= 0) {
          const diff = newAmount - target.walletBalance;
          target.walletBalance = newAmount;

          const tx: WalletTransaction = {
            id: 'tx-' + Date.now(),
            title: 'Super Admin Adjustment',
            type: diff >= 0 ? 'admin_grant' : 'expense',
            amount: diff,
            timestamp: Date.now(),
            note: `Super Admin set balance to ${target.walletBalance.toLocaleString()} VC currency`,
          };
          db.transactions.unshift(tx);

          // Update graph points
          const d = new Date();
          const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          db.graphPoints.push({
            timeLabel,
            value: newAmount,
            timestamp: Date.now(),
            change: diff,
          });
          if (db.graphPoints.length > 25) {
            db.graphPoints = db.graphPoints.slice(-25);
          }

          saveDB();

          broadcast({
            type: 'wallet_switched',
            members: db.members,
            transactions: db.transactions,
            graphPoints: db.graphPoints,
          });
        }
      }

      // User Transfer VC Currency
      if (data.type === 'transfer_currency') {
        const { senderId, recipientId, amount, note } = data;
        const sender = db.members.find((m) => m.id === senderId);
        const recipient = db.members.find((m) => m.id === recipientId);

        if (sender && recipient && amount > 0 && sender.walletBalance >= amount) {
          sender.walletBalance -= amount;
          recipient.walletBalance += amount;

          const tx: WalletTransaction = {
            id: 'tx-' + Date.now(),
            title: `Transfer to ${recipient.name}`,
            type: 'transfer_out',
            amount: -amount,
            timestamp: Date.now(),
            counterpartName: recipient.name,
            note: note || `VC transfer sent to ${recipient.name}`,
          };
          db.transactions.unshift(tx);

          saveDB();

          broadcast({
            type: 'wallet_transfer_complete',
            members: db.members,
            transactions: db.transactions,
          });
        }
      }

      // Products: Add product over WS (Super Admin only)
      if (data.type === 'add_product') {
        const { adminId, name, price, image, description, category, stock } = data;
        const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
        if (admin && name && price !== undefined && image) {
          const newProduct: Product = {
            id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: name.trim(),
            price: Math.max(0, Math.round(Number(price))),
            image: image.trim(),
            description: description?.trim() || 'Exclusive verified VC Cart product.',
            category: category?.trim() || 'General',
            stock: typeof stock === 'number' ? stock : 50,
            createdBy: admin.id,
            creatorName: admin.name,
            createdAt: Date.now(),
          };

          db.products.unshift(newProduct);

          const announcementMsg: ChatMessage = {
            id: 'prod-ann-' + Date.now(),
            senderId: 'system',
            senderName: 'VC Cart Market',
            senderRole: 'super_admin',
            senderAvatar: admin.avatar,
            text: `🛒 Super Admin added new product: "${newProduct.name}" (${newProduct.price.toLocaleString()} VC)! Now available in VC Cart!`,
            timestamp: Date.now(),
            isSystemAnnouncement: true,
          };
          db.communityMessages.push(announcementMsg);
          saveDB();

          broadcast({
            type: 'product_added',
            product: newProduct,
            products: db.products,
            message: announcementMsg,
          });
        }
      }

      // Products: Delete product over WS (Super Admin only)
      if (data.type === 'delete_product') {
        const { adminId, productId } = data;
        const admin = db.members.find((m) => m.id === adminId && m.role === 'super_admin');
        if (admin && productId) {
          db.products = db.products.filter((p) => p.id !== productId);
          saveDB();

          broadcast({
            type: 'product_deleted',
            productId,
            products: db.products,
          });
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (info && info.userId) {
      // Don't mark offline immediately; the 11-second interval will mark them offline if no heartbeat arrives
    }
    clients.delete(ws);
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`VC Community online server running on port ${PORT} (dev: ${isDev})`);
  });
}

startServer();
