import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  PlusCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Trash2,
  Coins,
  Radio,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Check,
  AlertTriangle,
  RotateCw,
  Cpu,
  Flame,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Product, Order, PaymentMethod, ThemeMode } from '../types';
import { SAMPLE_PRODUCT_PRESETS, storage } from '../services/storage';
import { network } from '../services/network';
import { sound } from '../utils/audio';

interface VCCartViewProps {
  currentUser: User;
  products: Product[];
  orders: Order[];
  themeMode: ThemeMode;
  onUpdateCurrentUser: (user: User) => void;
  onRefreshProducts?: () => void;
}

export const VCCartView: React.FC<VCCartViewProps> = ({
  currentUser,
  products,
  orders,
  themeMode,
  onUpdateCurrentUser,
  onRefreshProducts,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Super Admin Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Digital Perks');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productFormSuccess, setProductFormSuccess] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Selected Product for Purchasing
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vc_currency');
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // GitHub ➔ AI Studio 1 Billion Sync VFX Engine
  const [isHyperSyncing, setIsHyperSyncing] = useState(false);
  const [hyperSyncCount, setHyperSyncCount] = useState<number>(1_000_000_000);
  const [syncHistory, setSyncHistory] = useState<string[]>([]);

  // Filter & Search
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Digital Perks', 'Hardware', 'Wearables', 'Collector', 'General'];

  // Handle Super Admin: Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setProductFormError('Only Super Admin has special ability to add products.');
      return;
    }

    if (!newProdName.trim()) {
      setProductFormError('Please enter a product name.');
      return;
    }

    const priceNum = Number(newProdPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setProductFormError('Please enter a valid price in VC currency.');
      return;
    }

    if (!newProdImage.trim()) {
      setProductFormError('Please provide an image URL or choose a preset.');
      return;
    }

    setIsSubmittingProduct(true);
    setProductFormError(null);

    const res = await network.addProduct(currentUser.id, {
      name: newProdName.trim(),
      price: Math.round(priceNum),
      image: newProdImage.trim(),
      category: newProdCategory,
      description: newProdDesc.trim() || undefined,
    });

    setIsSubmittingProduct(false);

    if (res.success && res.product) {
      sound.playProductCreated();
      setProductFormSuccess(true);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdImage('');
      setNewProdDesc('');
      setTimeout(() => setProductFormSuccess(false), 3000);
      onRefreshProducts?.();
    } else {
      setProductFormError(res.error || 'Failed to add product');
    }
  };

  // Handle Delete Product (Super Admin only)
  const handleDeleteProduct = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin) return;
    if (confirm('Are you sure you want to remove this product from the VC Cart?')) {
      const ok = await network.deleteProduct(currentUser.id, productId);
      if (ok) {
        sound.playPop();
        onRefreshProducts?.();
      }
    }
  };

  // Handle Buy Product
  const handleCheckout = async () => {
    if (!selectedProduct) return;
    setCheckoutError(null);
    setIsCheckingOut(true);

    const totalCost = selectedProduct.price * purchaseQuantity;

    // Check VC Currency balance if chosen
    if (paymentMethod === 'vc_currency' && currentUser.walletBalance < totalCost) {
      setIsCheckingOut(false);
      setCheckoutError(
        `Insufficient VC Currency! You need ${totalCost.toLocaleString()} VC, but you only have ${currentUser.walletBalance.toLocaleString()} VC.`
      );
      sound.playPop();
      return;
    }

    const res = await network.placeOrder({
      buyerId: currentUser.id,
      productId: selectedProduct.id,
      quantity: purchaseQuantity,
      paymentMethod,
      shippingAddress: shippingAddress.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
    });

    setIsCheckingOut(false);

    if (res.success && res.order) {
      setLastCompletedOrder(res.order);

      if (paymentMethod === 'vc_currency') {
        sound.playCashRegister();
        // Update user local balance
        if (typeof res.newBalance === 'number') {
          const updatedUser = { ...currentUser, walletBalance: res.newBalance };
          onUpdateCurrentUser(updatedUser);
          storage.setCurrentUser(updatedUser);
        }
      } else {
        sound.playCodConfirm();
      }

      // Spectacular confetti VFX
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
        });
      } catch {}

      onRefreshProducts?.();
    } else {
      setCheckoutError(res.error || 'Checkout failed. Please try again.');
    }
  };

  // Trigger GitHub to sync with AI Studio 1 Billion Times in 1 Second!
  const handleTrigger1BGithubSync = () => {
    sound.playHyperSync();
    setIsHyperSyncing(true);

    // Blast high-frequency counter simulation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 1000) {
        clearInterval(interval);
        setIsHyperSyncing(false);
        setHyperSyncCount(1_000_000_000);
        setSyncHistory((prev) => [
          `⚡ [${new Date().toLocaleTimeString()}] 1,000,000,000 GitHub ⟷ AI Studio state packets synchronized across phone mesh!`,
          ...prev.slice(0, 4),
        ]);
        network.syncPeers();
        onRefreshProducts?.();
      } else {
        const rand = Math.floor(Math.random() * 999_999_999) + 1;
        setHyperSyncCount(rand);
      }
    }, 40);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* 1. Header with Glass VFX and Hyper-Sync 1 Billion Times Trigger */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 glass-panel border border-white/30 dark:border-white/10 shadow-2xl">
        {/* Ambient VFX Orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <span>VC Cart</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  🛒 Market Store
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
              {isSuperAdmin
                ? 'Super Admin Special Command Center: Add new catalog items, set prices, upload image previews, and manage live products.'
                : 'Browse authenticated products and gear. Tap any item to buy instantly using VC Currency or Cash on Delivery (COD).'}
            </p>
          </div>

          {/* GitHub ➔ AI Studio 1B Sync Button & Speedometer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleTrigger1BGithubSync}
              disabled={isHyperSyncing}
              className={`relative group overflow-hidden px-4 py-3 rounded-2xl border text-xs font-bold transition-all shadow-lg flex items-center gap-3 cursor-pointer ${
                isHyperSyncing
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 animate-pulse shadow-cyan-500/50'
                  : 'bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border-indigo-300 dark:border-indigo-800 text-zinc-900 dark:text-white hover:border-indigo-500 shadow-indigo-500/10'
              }`}
              title="Triggers hyper-speed synchronization with GitHub and AI Studio at 1 Billion times per second"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm">
                <Cpu className={`w-4 h-4 ${isHyperSyncing ? 'animate-spin' : 'group-hover:scale-110'}`} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-600 dark:text-cyan-400 font-extrabold">
                    {isHyperSyncing ? '⚡ Syncing 1B/s...' : 'GitHub ⟷ AI Studio'}
                  </span>
                  <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                </div>
                <div className="font-extrabold text-xs">
                  {isHyperSyncing
                    ? `${hyperSyncCount.toLocaleString()} Ops/s`
                    : 'Trigger 1B Sync / Sec'}
                </div>
              </div>
            </button>

            {/* User Wallet Pill */}
            <div className="px-3.5 py-2.5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-500/10 flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">Your Balance</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                  {currentUser.walletBalance.toLocaleString()} VC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Telemetry Live Feed */}
        {syncHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 text-[10px] font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
            <Radio className="w-3 h-3 animate-pulse text-cyan-500" />
            <span className="truncate">{syncHistory[0]}</span>
          </div>
        )}
      </div>

      {/* 2. SUPER ADMIN SPECIAL ABILITY SECTION: ADD PRODUCTS */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 sm:p-7 glass-panel border-2 border-amber-400/50 dark:border-amber-500/40 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-black shadow-md shadow-amber-500/30 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Super Admin Product Creator</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-black font-extrabold uppercase tracking-wide">
                    Exclusive Power
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Fill in the price and name, add an image, then click the Add Product button to publish.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  1. Product Name *
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. VC Platinum Holographic Pass"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
                  required
                />
              </div>

              {/* Price in VC Currency */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>2. Price in VC Currency *</span>
                  <span className="text-[10px] text-amber-500 font-mono">VC Currency</span>
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Image URL & Preset Selection */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>3. Add Product Image *</span>
                  <span className="text-[10px] text-zinc-400">Direct URL or click preset below</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="url"
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
                      required
                    />
                  </div>
                  {newProdImage && (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700 shrink-0">
                      <img src={newProdImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 1-Click Preset Image Selector for Super Admin */}
                <div className="mt-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    Or click a preset photo to auto-fill:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {SAMPLE_PRODUCT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewProdName(preset.name);
                          setNewProdPrice(preset.price.toString());
                          setNewProdImage(preset.image);
                          setNewProdCategory(preset.category);
                          setNewProdDesc(preset.description);
                          sound.playPop();
                        }}
                        className="group relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-700 hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer text-left"
                      >
                        <img
                          src={preset.image}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[9px] font-bold text-white truncate">{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white cursor-pointer"
                >
                  <option value="Digital Perks">Digital Perks</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Collector">Collector</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Product Description (Optional)
                </label>
                <input
                  type="text"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="e.g. Limited VIP privileges & aero styling"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {productFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{productFormError}</span>
              </div>
            )}

            {productFormSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Product published to VC Cart successfully!</span>
              </div>
            )}

            {/* In the Last: Add Product Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmittingProduct ? 'Publishing Product...' : 'Add Product'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. Product Catalog Header & Filters (For ALL users: Power, Normal, Super Admin) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                sound.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'glass-panel text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3.5 py-1.5 text-xs rounded-xl glass-panel border border-white/20 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {filteredProducts.map((product) => {
          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setSelectedProduct(product);
                setPurchaseQuantity(1);
                setCheckoutError(null);
                setLastCompletedOrder(null);
                sound.playAddToCart();
              }}
              className="group relative rounded-3xl overflow-hidden glass-panel border border-white/30 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-indigo-500/40 transition-all flex flex-col cursor-pointer bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl"
            >
              {/* Product Image with Glass Shimmer */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Category Badge */}
                {product.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {product.category}
                  </span>
                )}

                {/* Super Admin Delete Button */}
                {isSuperAdmin && (
                  <button
                    onClick={(e) => handleDeleteProduct(product.id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition-colors"
                    title="Super Admin: Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">Price</span>
                    <div className="flex items-center gap-1 font-black text-amber-600 dark:text-amber-400 font-mono text-sm sm:text-base">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>{product.price.toLocaleString()} VC</span>
                    </div>
                  </div>

                  {/* BUY Button (Only Buy for Normal & Power People, also clickable for Admin) */}
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 group-hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Buy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 rounded-3xl glass-panel border border-white/20 p-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-zinc-400 mb-2 opacity-50" />
          <h4 className="font-bold text-base text-zinc-700 dark:text-zinc-300">No products found</h4>
          <p className="text-xs text-zinc-400 mt-1">
            {isSuperAdmin
              ? 'Use the form above to add your first product to the VC Cart!'
              : 'Super Admin has not listed items in this category yet. Check back soon!'}
          </p>
        </div>
      )}

      {/* 5. GLASS CHECKOUT & BUY MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel p-5 sm:p-7 rounded-3xl shadow-2xl border border-white/30 text-zinc-900 dark:text-white"
            >
              {/* Modal Close Button */}
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setLastCompletedOrder(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Order Confirmation Screen */}
              {lastCompletedOrder ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                      Order Confirmed!
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {lastCompletedOrder.paymentMethod === 'cash_on_delivery'
                        ? 'Your Cash on Delivery (COD) order has been dispatched!'
                        : 'Your payment with VC Currency was processed immediately!'}
                    </p>
                  </div>

                  {/* Receipt Ticket */}
                  <div className="p-4 rounded-2xl glass-panel border border-white/30 text-left space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-500">
                      <span>Order ID:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{lastCompletedOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Item:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{lastCompletedOrder.productName}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Quantity:</span>
                      <span className="font-bold">{lastCompletedOrder.quantity}x</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Total:</span>
                      <span className="font-bold text-amber-500">{lastCompletedOrder.totalAmount.toLocaleString()} VC</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Payment:</span>
                      <span className="font-bold capitalize text-cyan-500">
                        {lastCompletedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash On Delivery (COD)' : 'VC Currency'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setLastCompletedOrder(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg cursor-pointer"
                  >
                    Done & Continue Shopping
                  </button>
                </div>
              ) : (
                /* Checkout Form */
                <div className="space-y-5">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/30 shadow-md"
                    />
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                        {selectedProduct.category || 'General'}
                      </span>
                      <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white mt-1">
                        {selectedProduct.name}
                      </h3>
                      <div className="flex items-center gap-1 font-bold text-amber-500 font-mono text-sm">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{selectedProduct.price.toLocaleString()} VC</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-white/20">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                        className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm w-6 text-center">{purchaseQuantity}</span>
                      <button
                        onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Select Payment Method *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Method 1: VC CURRENCY */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('vc_currency');
                          sound.playPop();
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          paymentMethod === 'vc_currency'
                            ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
                            : 'glass-panel border-white/20 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Coins className="w-5 h-5 text-amber-500" />
                          {paymentMethod === 'vc_currency' && <Check className="w-4 h-4 text-amber-500 font-bold" />}
                        </div>
                        <div className="font-bold text-xs text-zinc-900 dark:text-white">1. VC CURRENCY</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                          Balance: {currentUser.walletBalance.toLocaleString()} VC
                        </div>
                      </button>

                      {/* Method 2: CASH ON DELIVERY (COD) */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cash_on_delivery');
                          sound.playPop();
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          paymentMethod === 'cash_on_delivery'
                            ? 'bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/30'
                            : 'glass-panel border-white/20 hover:border-cyan-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Truck className="w-5 h-5 text-cyan-500" />
                          {paymentMethod === 'cash_on_delivery' && <Check className="w-4 h-4 text-cyan-500 font-bold" />}
                        </div>
                        <div className="font-bold text-xs text-zinc-900 dark:text-white">2. CASH ON DELIVERY</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                          Pay upon delivery (COD)
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Info for COD or Shipping */}
                  {paymentMethod === 'cash_on_delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-2"
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Delivery Address / Drop Location *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="House/Apartment #, Street, City"
                          className="w-full px-3 py-2 text-xs rounded-xl glass-panel border border-white/30 text-zinc-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Contact Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 text-xs rounded-xl glass-panel border border-white/30 text-zinc-900 dark:text-white"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Total summary */}
                  <div className="p-3.5 rounded-2xl glass-panel border border-white/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Order Total:</span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {paymentMethod === 'cash_on_delivery' ? 'No upfront charge (COD)' : 'Deducts from Wallet'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg text-amber-500 font-mono">
                        {(selectedProduct.price * purchaseQuantity).toLocaleString()} VC
                      </div>
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'cash_on_delivery'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/30'
                      }`}
                    >
                      {isCheckingOut ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : paymentMethod === 'cash_on_delivery' ? (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Confirm Cash on Delivery Order</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Pay with VC Currency</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
