'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, List, Maximize2, Minimize2, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useSession } from 'next-auth/react';

type PDVCategory = 'Todos' | 'Alimentos' | 'Geleias' | 'Cestas' | 'Artesanato' | 'Bebidas' | 'Orgânicos' | 'Outros';
type PDVProduct = {
  id: string;
  name: string;
  price: number;
  unitLabel?: string;
  description?: string;
  category: PDVCategory;
  imageUrl: string;
  stockCurrent?: number;
  barcode?: string | null;
};

type PDVCartItem = {
  productId: string;
  quantity: number;
};

const PDV_WEB_CATEGORIES: PDVCategory[] = ['Todos', 'Geleias', 'Cestas', 'Artesanato', 'Bebidas', 'Orgânicos', 'Outros'];
const PDV_MOBILE_CATEGORIES: PDVCategory[] = ['Todos', 'Alimentos', 'Artesanato', 'Bebidas'];

const PDV_STORE = {
  project: 'pdv_project_name',
  userName: 'pdv_user_display_name',
  avatar: 'pdv_user_avatar_url',
  layout: 'pdv_layout_mode',
  cardSize: 'pdv_card_size',
} as const;

type PdvLayoutMode = 'grid' | 'list';
type PdvCardSize = 'compact' | 'normal' | 'large';
type PdvSettingsSection = 'menu' | 'identidade' | 'exibicao' | 'pagamentos' | 'configurar_pix' | 'futuras';
type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito';

type SplitKeys = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito';

/** Input de valor que usa estado local durante edição para evitar perda de foco no PDV */
function PaymentValueInput({
  paymentKey,
  value,
  onValueChange,
  onEditingValue,
  className,
  placeholder = '0,00',
}: {
  paymentKey: SplitKeys;
  value: number;
  onValueChange: (n: number) => void;
  onEditingValue?: (key: SplitKeys, n: number | null) => void;
  className?: string;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatVal = (n: number) => (n > 0 ? n.toFixed(2).replace('.', ',') : '');
  const displayValue = isFocused ? localValue : formatVal(value);

  useEffect(() => {
    if (isFocused && value >= 0) {
      setLocalValue(formatVal(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(formatVal(value));
  };

  const handleBlur = () => {
    const v = localValue.replace(',', '.');
    const n = parseFloat(v);
    const parsed = isNaN(n) ? 0 : Math.max(0, n);
    onValueChange(parsed);
    onEditingValue?.(paymentKey, null); // limpa valor em edição
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d,.]/g, '');
    setLocalValue(v.slice(0, 15));
    const n = parseFloat(v.replace(',', '.'));
    onEditingValue?.(paymentKey, isNaN(n) ? 0 : Math.max(0, n));
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
    />
  );
}

function desktopGridClass(size: PdvCardSize): string {
  switch (size) {
    case 'compact':
      return 'grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2';
    case 'large':
      return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4';
    default:
      return 'grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3';
  }
}

function mobileGridClass(size: PdvCardSize): string {
  switch (size) {
    case 'compact':
      return 'grid grid-cols-4 gap-1.5';
    case 'large':
      return 'grid grid-cols-2 gap-3';
    default:
      return 'grid grid-cols-3 sm:grid-cols-4 gap-2';
  }
}

type PDVViewProps = { initialSettingsOpen?: boolean; configOnly?: boolean; onCloseConfig?: () => void };

export default function PDVView({ initialSettingsOpen, configOnly, onCloseConfig }: PDVViewProps) {
  const { data: session } = useSession();
  const [pdvProducts, setPdvProducts] = useState<PDVProduct[]>([]);
  const [pdvProductsLoading, setPdvProductsLoading] = useState(true);

  useEffect(() => {
    setPdvProductsLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
        .then((data: { id: string; name: string; category: string; description?: string; price_sale: number; image_url?: string; stock_current?: number; barcode?: string | null }[]) => {
        if (Array.isArray(data)) {
          setPdvProducts(
            data.map((p) => ({
              id: String(p.id),
              name: p.name,
              price: Number(p.price_sale),
              unitLabel: 'Un.',
              description: p.description || '',
              category: (p.category || 'Outros') as PDVCategory,
              imageUrl: p.image_url || '',
              stockCurrent: Number(p.stock_current ?? 0),
              barcode: p.barcode || null,
            }))
          );
        } else {
          setPdvProducts([]);
        }
      })
      .catch(() => setPdvProducts([]))
      .finally(() => setPdvProductsLoading(false));
  }, []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PDVCategory>('Todos');
  const [cart, setCart] = useState<PDVCartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ pix: 0, dinheiro: 0, cartao_credito: 0, cartao_debito: 0 });
  const editingValuesRef = useRef<Partial<Record<SplitKeys, number>>>({});
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [saleMessage, setSaleMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const pdvContainerRef = useRef<HTMLDivElement>(null);
  const [pdvFullscreen, setPdvFullscreen] = useState(false);

  const [projectTitle, setProjectTitle] = useState('Inovação Imperatriz');
  const [userTitle, setUserTitle] = useState('Operador');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [layoutMode, setLayoutMode] = useState<PdvLayoutMode>('grid');
  const [cardSize, setCardSize] = useState<PdvCardSize>('normal');
  const [showPdvSettingsScreen, setShowPdvSettingsScreen] = useState(!!initialSettingsOpen || !!configOnly);
  const [pdvSettingsSection, setPdvSettingsSection] = useState<PdvSettingsSection>('menu');
  const [formProject, setFormProject] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formLayout, setFormLayout] = useState<PdvLayoutMode>('grid');
  const [formCardSize, setFormCardSize] = useState<PdvCardSize>('normal');

  const [pixConfig, setPixConfig] = useState<{ tipo_chave: string; chave: string; nome_beneficiario: string; cidade_beneficiario: string } | null>(null);
  const [formPixTipo, setFormPixTipo] = useState('email');
  const [formPixChave, setFormPixChave] = useState('');
  const [formPixNome, setFormPixNome] = useState('');
  const [formPixCidade, setFormPixCidade] = useState('');
  const [pixConfigSaving, setPixConfigSaving] = useState(false);
  const [pixTestPayload, setPixTestPayload] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PDV_STORE.project);
      if (p) setProjectTitle(p);
      const u = localStorage.getItem(PDV_STORE.userName);
      if (u) setUserTitle(u);
      const a = localStorage.getItem(PDV_STORE.avatar);
      if (a) setAvatarUrl(a);
      const l = localStorage.getItem(PDV_STORE.layout) as PdvLayoutMode;
      if (l === 'grid' || l === 'list') setLayoutMode(l);
      const c = localStorage.getItem(PDV_STORE.cardSize) as PdvCardSize;
      if (c === 'compact' || c === 'normal' || c === 'large') setCardSize(c);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (initialSettingsOpen && !showPdvSettingsScreen) setShowPdvSettingsScreen(true);
  }, [initialSettingsOpen]);

  useEffect(() => {
    if (!session?.user?.name) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(PDV_STORE.userName) : null;
    if (!stored) setUserTitle(session.user.name);
  }, [session?.user?.name]);

  const openPdvSettings = () => {
    setFormProject(projectTitle);
    setFormUser(userTitle);
    setFormAvatar(avatarUrl);
    setFormLayout(layoutMode);
    setFormCardSize(cardSize);
    setPdvSettingsSection('menu');
    setShowPdvSettingsScreen(true);
  };

  const closePdvSettingsWithoutSave = () => {
    setShowPdvSettingsScreen(false);
    setPdvSettingsSection('menu');
    if (configOnly && onCloseConfig) onCloseConfig();
  };

  const savePdvSettings = () => {
    const pt = formProject.trim() || 'PDV';
    const ut = formUser.trim() || 'Operador';
    const av = formAvatar.trim();
    try {
      localStorage.setItem(PDV_STORE.project, pt);
      localStorage.setItem(PDV_STORE.userName, ut);
      localStorage.setItem(PDV_STORE.avatar, av);
      localStorage.setItem(PDV_STORE.layout, formLayout);
      localStorage.setItem(PDV_STORE.cardSize, formCardSize);
    } catch {
      /* ignore */
    }
    setProjectTitle(pt);
    setUserTitle(ut);
    setAvatarUrl(av);
    setLayoutMode(formLayout);
    setCardSize(formCardSize);
    setPdvSettingsSection('menu');
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setShowPdvSettingsScreen(false);
    }
  };

  useEffect(() => {
    const sync = () => setPdvFullscreen(document.fullscreenElement === pdvContainerRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const togglePdvFullscreen = () => {
    const el = pdvContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => {});
    }
  };

  const products = pdvProducts;

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      category === 'Todos' ||
      (category === 'Alimentos' && ['Geleias', 'Cestas', 'Orgânicos'].includes(p.category)) ||
      p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const addToCartByBarcode = (rawBarcode: string) => {
    const code = String(rawBarcode || '').replace(/\D/g, '');
    if (code.length < 8) return false;
    const product = products.find((p) => p.barcode && String(p.barcode).replace(/\D/g, '') === code);
    if (product) {
      addToCart(product.id);
      return true;
    }
    return false;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const v = (e.target as HTMLInputElement).value;
    const digitsOnly = v.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && addToCartByBarcode(v)) {
      setSearch('');
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalValue = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + product.price * item.quantity;
  }, 0);
  const totalValue = Math.max(0, subtotalValue - discountAmount);
  const splitTotal = splitAmounts.pix + splitAmounts.dinheiro + splitAmounts.cartao_credito + splitAmounts.cartao_debito;
  const splitValid = Math.abs(splitTotal - totalValue) < 0.01;
  const pixAmount = splitAmounts.pix;
  const dinheiroAmount = splitAmounts.dinheiro;
  const changeAmount =
    dinheiroAmount > 0 && amountReceived
      ? Math.max(0, parseFloat(amountReceived.replace(',', '.')) - dinheiroAmount)
      : 0;

  const getProductById = (id: string) => products.find((p) => p.id === id)!;

  const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const cardSkin =
    cardSize === 'compact'
      ? {
          minH: 'min-h-[60px]',
          title: 'text-[10px]',
          desc: 'text-[9px]',
          price: 'text-xs',
          pad: 'p-1.5',
          est: 'text-[9px] px-1 py-0.5',
        }
      : cardSize === 'large'
        ? {
            minH: 'min-h-[96px]',
            title: 'text-sm',
            desc: 'text-xs',
            price: 'text-base',
            pad: 'p-3',
            est: 'text-[11px] px-2 py-0.5',
          }
        : {
            minH: 'min-h-[72px]',
            title: 'text-xs',
            desc: 'text-[10px]',
            price: 'text-sm',
            pad: 'p-2',
            est: 'text-[10px] px-1.5 py-0.5',
          };

  const renderPdvProductGridCard = (product: PDVProduct) => (
    <button
      key={product.id}
      type="button"
      onClick={() => addToCart(product.id)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer overflow-hidden border border-slate-100 group text-left flex flex-col active:scale-[0.98]"
    >
      <div className="aspect-square relative overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-slate-400">image</span>
          </div>
        )}
        <div
          className={`absolute bottom-1 left-1 bg-black/60 text-white rounded font-medium ${cardSkin.est}`}
        >
          Est: {product.stockCurrent ?? 0}
        </div>
      </div>
      <div className={`flex flex-col flex-1 ${cardSkin.minH} ${cardSkin.pad}`}>
        <h3 className={`font-bold text-slate-900 line-clamp-1 ${cardSkin.title}`}>{product.name}</h3>
        <p className={`text-slate-500 line-clamp-2 flex-1 min-h-0 mt-0.5 ${cardSkin.desc}`}>
          {product.description || '\u00A0'}
        </p>
        <p className={`text-primary font-bold mt-auto pt-1 ${cardSkin.price}`}>{formatPrice(product.price)}</p>
      </div>
    </button>
  );

  const renderPdvProductListRow = (product: PDVProduct) => (
    <button
      key={product.id}
      type="button"
      onClick={() => addToCart(product.id)}
      className="w-full flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-primary/30 hover:shadow-md text-left transition-all active:scale-[0.99]"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">image</span>
          </div>
        )}
        <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[9px] text-center py-0.5">
          Est: {product.stockCurrent ?? 0}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{product.description || '\u00A0'}</p>
      </div>
      <span className="font-black text-primary text-lg shrink-0">{formatPrice(product.price)}</span>
    </button>
  );

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setSplitAmounts({ pix: 0, dinheiro: 0, cartao_credito: 0, cartao_debito: 0 });
    editingValuesRef.current = {};
    setAmountReceived('');
    setPixPaymentSuccessPhase('none');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setAmountReceived('');
    setPaymentNote('');
    setPixPaymentSuccessPhase('none');
  };

  const setSplit = (key: keyof typeof splitAmounts, value: number) => {
    setSplitAmounts((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const fillRemaining = useCallback(
    (key: keyof typeof splitAmounts) => {
      const edits = editingValuesRef.current;
      const getVal = (k: keyof typeof splitAmounts) =>
        edits[k] !== undefined ? edits[k]! : (splitAmounts[k] ?? 0);
      const otherTotal =
        getVal('pix') + getVal('dinheiro') + getVal('cartao_credito') + getVal('cartao_debito') - getVal(key);
      const remaining = Math.max(0, totalValue - otherTotal);
      setSplit(key, Math.round(remaining * 100) / 100);
    },
    [splitAmounts, totalValue]
  );

  const handleEditingValue = useCallback((key: SplitKeys, n: number | null) => {
    if (n === null) delete editingValuesRef.current[key];
    else editingValuesRef.current[key] = n;
  }, []);

  useEffect(() => {
    if (!showPaymentModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey || e.key.startsWith('F')) {
        const map: Record<string, keyof typeof splitAmounts> = {
          '1': 'dinheiro',
          '2': 'cartao_debito',
          '3': 'pix',
          '4': 'cartao_credito',
          F1: 'dinheiro',
          F2: 'cartao_debito',
          F3: 'pix',
          F4: 'cartao_credito',
        };
        const k = e.altKey ? e.key : e.key;
        const method = map[k];
        if (method) {
          e.preventDefault();
          fillRemaining(method);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showPaymentModal, fillRemaining]);

  const getPrimaryPaymentMethod = (): string => {
    const entries = Object.entries(splitAmounts) as [keyof typeof splitAmounts, number][];
    const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a), ['dinheiro', 0] as [keyof typeof splitAmounts, number]);
    const used = entries.filter(([, v]) => v > 0);
    return used.length > 1 ? 'misto' : max[0];
  };

  const confirmPaymentAndFinishRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const confirmPaymentAndFinish = async () => {
    if (!splitValid) {
      setSaleMessage({ type: 'err', text: `A soma dos valores deve ser R$ ${totalValue.toFixed(2).replace('.', ',')}` });
      setTimeout(() => setSaleMessage(null), 3000);
      return;
    }
    if (dinheiroAmount > 0) {
      const received = parseFloat(amountReceived.replace(',', '.'));
      if (isNaN(received) || received < dinheiroAmount) {
        setSaleMessage({ type: 'err', text: `Valor recebido em dinheiro deve ser no mínimo R$ ${dinheiroAmount.toFixed(2).replace('.', ',')}` });
        setTimeout(() => setSaleMessage(null), 3000);
        return;
      }
    }
    setFinalizing(true);
    setSaleMessage(null);
    try {
      const items = cart.map((c) => {
        const p = products.find((x) => x.id === c.productId);
        if (!p) throw new Error('Produto não encontrado no carrinho');
        return {
          product_id: c.productId,
          quantity: c.quantity,
          unit_price: p.price,
        };
      });
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items,
          total: totalValue,
          payment_method: getPrimaryPaymentMethod(),
          payment_breakdown: splitAmounts,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar venda');
      clearCart();
      setDiscountAmount(0);
      closePaymentModal();
      setSaleMessage({ type: 'ok', text: 'Venda registrada com sucesso!' });
      setTimeout(() => setSaleMessage(null), 4000);
    } catch (e) {
      setSaleMessage({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erro ao registrar venda',
      });
    } finally {
      setFinalizing(false);
    }
  };
  confirmPaymentAndFinishRef.current = confirmPaymentAndFinish;

  const pixChave = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PDV_PIX_CHAVE
    ? process.env.NEXT_PUBLIC_PDV_PIX_CHAVE
    : '';

  const [pixPayload, setPixPayload] = useState('');
  const [mpConnected, setMpConnected] = useState(false);
  const [mpPixData, setMpPixData] = useState<{
    qr_code: string;
    qr_code_base64?: string;
    payment_id?: string;
  } | null>(null);
  const [mpPixLoading, setMpPixLoading] = useState(false);
  const [pixPaymentSuccessPhase, setPixPaymentSuccessPhase] = useState<'none' | 'processing' | 'success'>('none');

  const playSuccessSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      /* som opcional */
    }
  }, []);

  useEffect(() => {
    fetch('/api/pdv/mercadopago/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMpConnected(!!d?.connected))
      .catch(() => setMpConnected(false));
  }, [showPaymentModal, showPdvSettingsScreen]);

  useEffect(() => {
    if (showPdvSettingsScreen || showPaymentModal)
      fetch('/api/pdv/pix-config', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          setPixConfig(d.config || null);
          if (showPdvSettingsScreen && d.config) {
            setFormPixTipo(d.config.tipo_chave || 'email');
            setFormPixChave(d.config.chave || '');
            setFormPixNome(d.config.nome_beneficiario || '');
            setFormPixCidade(d.config.cidade_beneficiario || '');
          }
        })
        .catch(() => setPixConfig(null));
  }, [showPdvSettingsScreen, showPaymentModal, pdvSettingsSection]);

  useEffect(() => {
    if (pixAmount <= 0) {
      setPixPayload('');
      setMpPixData(null);
      return;
    }
    if (mpConnected) {
      setPixPayload('');
      setMpPixLoading(true);
      setMpPixData(null);
      fetch('/api/pdv/mercadopago/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: pixAmount,
          description: `Venda PDV - ${projectTitle}`,
        }),
      })
        .then(async (r) => {
          const d = await r.json();
          if (d.qr_code || d.qr_code_base64) {
            setMpPixData({
              qr_code: d.qr_code || '',
              qr_code_base64: d.qr_code_base64,
              payment_id: d.payment_id,
            });
            return;
          }
          if (!r.ok && (d.fallback_to_chave || pixConfig || pixChave)) {
            const params = new URLSearchParams({ amount: String(pixAmount), name: projectTitle });
            if (pixChave) params.set('chave', pixChave);
            const r2 = await fetch(`/api/pdv/pix-payload?${params.toString()}`, { credentials: 'include' });
            const d2 = await r2.json();
            if (d2.payload) setPixPayload(d2.payload);
          }
        })
        .catch(async () => {
          if (pixConfig || pixChave) {
            const params = new URLSearchParams({ amount: String(pixAmount), name: projectTitle });
            if (pixChave) params.set('chave', pixChave);
            const r2 = await fetch(`/api/pdv/pix-payload?${params.toString()}`, { credentials: 'include' });
            const d2 = await r2.json();
            if (d2.payload) setPixPayload(d2.payload);
          }
        })
        .finally(() => setMpPixLoading(false));
    } else {
      setMpPixData(null);
      const params = new URLSearchParams({ amount: String(pixAmount), name: projectTitle });
      if (pixChave) params.set('chave', pixChave);
      fetch(`/api/pdv/pix-payload?${params.toString()}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => (d.payload ? setPixPayload(d.payload) : setPixPayload('')))
        .catch(() => setPixPayload(''));
    }
  }, [pixChave, pixAmount, projectTitle, mpConnected, pixConfig]);

  // Confirmação automática do PIX quando o pagamento é aprovado (Mercado Pago)
  useEffect(() => {
    const paymentId = mpPixData?.payment_id;
    if (!paymentId || !splitValid || !showPaymentModal || finalizing || pixPaymentSuccessPhase !== 'none') return;

    const interval = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/pdv/mercadopago/payment-status?payment_id=${encodeURIComponent(paymentId)}`,
          { credentials: 'include' }
        );
        const d = await r.json();
        if (d.status === 'approved') {
          clearInterval(interval);
          setMpPixData(null);
          setPixPaymentSuccessPhase('processing');
        }
      } catch {
        /* ignora erros de polling */
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [mpPixData?.payment_id, splitValid, showPaymentModal, finalizing, pixPaymentSuccessPhase]);

  // Sequência da animação de sucesso: processing → success → finalizar
  useEffect(() => {
    if (pixPaymentSuccessPhase === 'processing') {
      const t = setTimeout(() => {
        setPixPaymentSuccessPhase('success');
        playSuccessSound();
      }, 700);
      return () => clearTimeout(t);
    }
    if (pixPaymentSuccessPhase === 'success') {
      const t = setTimeout(async () => {
        setPixPaymentSuccessPhase('none');
        await confirmPaymentAndFinishRef.current();
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [pixPaymentSuccessPhase, playSuccessSound]);

  const pdvSettingsTitle =
    pdvSettingsSection === 'menu'
      ? 'Configurações'
      : pdvSettingsSection === 'identidade'
        ? 'Identidade'
        : pdvSettingsSection === 'exibicao'
          ? 'Exibição dos produtos'
          : pdvSettingsSection === 'pagamentos'
            ? 'Configurar pagamento'
            : pdvSettingsSection === 'configurar_pix'
              ? 'Configurar PIX'
              : 'Outras opções';

  const renderPdvSettingsPanel = (rootClass: string) => (
    <div className={`flex flex-col bg-slate-100 min-h-0 ${rootClass}`}>
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
        {pdvSettingsSection !== 'menu' ? (
          <button
            type="button"
            onClick={() => setPdvSettingsSection(pdvSettingsSection === 'configurar_pix' ? 'pagamentos' : 'menu')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0"
            title="Voltar ao menu"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="p-2 rounded-xl border border-transparent text-primary shrink-0">
            <Settings size={22} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-slate-900 truncate">{pdvSettingsTitle}</h2>
          {pdvSettingsSection === 'menu' ? (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Personalize o ponto de venda. Escolha uma opção abaixo.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={closePdvSettingsWithoutSave}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 border border-slate-200 shrink-0"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {pdvSettingsSection === 'menu' && (
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setPdvSettingsSection('identidade')}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="font-bold text-slate-800">Identidade</span>
              <ChevronRight className="text-slate-400 shrink-0" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setPdvSettingsSection('exibicao')}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="font-bold text-slate-800">Exibição dos produtos</span>
              <ChevronRight className="text-slate-400 shrink-0" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setPdvSettingsSection('pagamentos')}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="font-bold text-slate-800">Configurar pagamento</span>
              <ChevronRight className="text-slate-400 shrink-0" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setPdvSettingsSection('futuras')}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-3.5 text-left hover:border-primary/30 transition-colors"
            >
              <span className="font-semibold text-slate-500">Mais opções (em breve)</span>
              <ChevronRight className="text-slate-300 shrink-0" size={20} />
            </button>
          </nav>
        )}

        {pdvSettingsSection === 'identidade' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Identidade</h3>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Nome do projeto (cabeçalho)
              </span>
              <input
                type="text"
                value={formProject}
                onChange={(e) => setFormProject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Ex: Inovação Imperatriz"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Seu nome (operador)
              </span>
              <input
                type="text"
                value={formUser}
                onChange={(e) => setFormUser(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Ex: Maria Silva"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                URL da sua foto (opcional)
              </span>
              <input
                type="url"
                value={formAvatar}
                onChange={(e) => setFormAvatar(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="https://..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se vazio, mostramos a inicial do seu nome.
              </p>
            </label>
          </section>
        )}

        {pdvSettingsSection === 'exibicao' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Exibição dos produtos</h3>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Organização
              </span>
              <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setFormLayout('grid')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    formLayout === 'grid'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid size={18} />
                  Grade
                </button>
                <button
                  type="button"
                  onClick={() => setFormLayout('list')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    formLayout === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <List size={18} />
                  Lista
                </button>
              </div>
            </div>
            {formLayout === 'grid' && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Tamanho na grade
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: 'compact' as const, label: 'Pequeno' },
                      { v: 'normal' as const, label: 'Médio' },
                      { v: 'large' as const, label: 'Grande' },
                    ] as const
                  ).map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormCardSize(v)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                        formCardSize === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {pdvSettingsSection === 'pagamentos' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Configurar pagamento</h3>

            <div className="rounded-xl border-2 border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                Integrar Mercado Pago (PIX com QR Code)
              </h4>
              <p className="text-sm text-slate-600">
                Conecte sua conta Mercado Pago para gerar QR Code PIX na tela do PDV, como no TudoNet. Cada operador pode conectar a própria conta.
              </p>
              {mpConnected ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Conectado
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch('/api/pdv/mercadopago/disconnect', { method: 'POST', credentials: 'include' });
                      if (r.ok) setMpConnected(false);
                    }}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <a
                  href="/api/pdv/mercadopago/connect"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0088c7] text-white font-bold text-sm transition-colors"
                >
                  <span className="material-symbols-outlined">link</span>
                  Conectar conta Mercado Pago
                </a>
              )}
            </div>

            <div className="rounded-xl border-2 border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                Configurar PIX (chave própria)
              </h4>
              <p className="text-sm text-slate-600">
                Receba pagamentos com PIX gerados automaticamente com o valor da compra. Configure sua chave PIX (CPF, CNPJ, e-mail ou telefone) para o PDV gerar o QR Code.
              </p>
              {pixConfig ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    PIX configurado
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPixTipo(pixConfig.tipo_chave);
                      setFormPixChave(pixConfig.chave);
                      setFormPixNome(pixConfig.nome_beneficiario);
                      setFormPixCidade(pixConfig.cidade_beneficiario);
                      setPdvSettingsSection('configurar_pix');
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Editar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPdvSettingsSection('configurar_pix')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
                >
                  <span className="material-symbols-outlined">settings</span>
                  Configurar PIX
                </button>
              )}
            </div>
          </section>
        )}

        {pdvSettingsSection === 'configurar_pix' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Configurar PIX</h3>
            <p className="text-sm text-slate-600 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">info</span>
              Receba pagamentos com PIX gerados automaticamente com o valor da compra. PIX com confirmação manual (cliente paga e você confirma).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo da chave</span>
                <select
                  value={formPixTipo}
                  onChange={(e) => setFormPixTipo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Telefone</option>
                </select>
              </label>
              <label className="block sm:col-span-2 sm:col-start-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chave PIX</span>
                <input
                  type="text"
                  value={formPixChave}
                  onChange={(e) => setFormPixChave(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder={formPixTipo === 'email' ? 'seu@email.com' : formPixTipo === 'cpf' ? '000.000.000-00' : formPixTipo === 'cnpj' ? '00.000.000/0001-00' : '(00) 00000-0000'}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nome do beneficiário</span>
                <input
                  type="text"
                  value={formPixNome}
                  onChange={(e) => setFormPixNome(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Seu nome ou razão social"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cidade do beneficiário</span>
                <input
                  type="text"
                  value={formPixCidade}
                  onChange={(e) => setFormPixCidade(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Cidade"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <button
                type="button"
                onClick={async () => {
                  if (!formPixChave?.trim() || !formPixNome?.trim() || !formPixCidade?.trim()) {
                    alert('Preencha chave, nome e cidade para testar');
                    return;
                  }
                  const url = `/api/pdv/pix-payload?chave=${encodeURIComponent(formPixChave)}&amount=0.01&name=${encodeURIComponent(formPixNome)}&city=${encodeURIComponent(formPixCidade)}`;
                  const res = await fetch(url, { credentials: 'include' });
                  const d = await res.json();
                  setPixTestPayload(d.payload || null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                <span className="material-symbols-outlined">qr_code_2</span>
                Testar QR Code PIX
              </button>
              {pixTestPayload && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <QRCodeSVG value={pixTestPayload} size={80} level="M" />
                  <span className="text-sm text-emerald-700 font-medium">QR Code de teste (R$ 0,01) gerado!</span>
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={pixConfigSaving || !formPixChave?.trim() || !formPixNome?.trim() || !formPixCidade?.trim()}
              onClick={async () => {
                setPixConfigSaving(true);
                try {
                  const r = await fetch('/api/pdv/pix-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      tipo_chave: formPixTipo,
                      chave: formPixChave.trim(),
                      nome_beneficiario: formPixNome.trim(),
                      cidade_beneficiario: formPixCidade.trim(),
                    }),
                  });
                  const d = await r.json();
                  if (r.ok) {
                    setPixConfig({ tipo_chave: formPixTipo, chave: formPixChave.trim(), nome_beneficiario: formPixNome.trim(), cidade_beneficiario: formPixCidade.trim() });
                    setPdvSettingsSection('pagamentos');
                  } else {
                    alert(d.error || 'Erro ao salvar');
                  }
                } finally {
                  setPixConfigSaving(false);
                }
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pixConfigSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </section>
        )}

        {pdvSettingsSection === 'futuras' && (
          <section className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm">
            Espaço reservado para futuras configurações (impressora, atalhos, etc.)
          </section>
        )}
      </div>

      {pdvSettingsSection !== 'configurar_pix' && (
        <footer className="shrink-0 border-t border-slate-200 bg-white p-4 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={closePdvSettingsWithoutSave}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm"
            >
              Voltar sem salvar
            </button>
            <button
              type="button"
              onClick={savePdvSettings}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 text-sm shadow-lg shadow-primary/20"
            >
              Salvar alterações
            </button>
          </div>
        </footer>
      )}
    </div>
  );

  if (configOnly && showPdvSettingsScreen) {
    return (
      <div className="w-full min-h-[calc(100vh-8rem)] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl flex flex-col">
        {renderPdvSettingsPanel('flex-1 min-h-0 w-full')}
      </div>
    );
  }

  return (
    <div
      ref={pdvContainerRef}
      className={`w-full ${pdvFullscreen ? 'bg-slate-50 min-h-screen overflow-auto p-2' : ''}`}
    >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <>
      {showPdvSettingsScreen && (
        <div className="fixed inset-0 z-[200] flex flex-col lg:hidden">
          {renderPdvSettingsPanel('h-full w-full')}
        </div>
      )}
      {saleMessage && (
        <div
          className={`mb-4 mx-auto max-w-md lg:max-w-none px-4 py-3 rounded-xl text-sm font-medium ${
            saleMessage.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {saleMessage.text}
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[300] flex flex-col">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePaymentModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-100 w-full h-full min-h-0 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Overlay de sucesso PIX: animação + som */}
              {pixPaymentSuccessPhase !== 'none' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-4">
                    {pixPaymentSuccessPhase === 'processing' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-24 h-24 rounded-full border-4 border-primary/30 border-t-primary"
                      />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40"
                      >
                        <span className="material-symbols-outlined text-white text-5xl">check</span>
                      </motion.div>
                    )}
                    <p className="text-lg font-bold text-slate-700">
                      {pixPaymentSuccessPhase === 'processing'
                        ? 'Confirmando pagamento…'
                        : 'Pagamento confirmado!'}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="shrink-0 p-4 sm:p-6 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900">Pagamento</h3>
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total a pagar</p>
                    <p className="text-lg font-black text-slate-900">{formatPrice(totalValue)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total pago</p>
                    <p className="text-lg font-black text-slate-900">{formatPrice(splitTotal)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Em aberto</p>
                    <p className="text-lg font-black text-slate-900">{formatPrice(Math.max(0, totalValue - splitTotal))}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Troco em dinheiro</p>
                    <p className="text-lg font-black text-slate-900">{formatPrice(changeAmount)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="sm:w-48 shrink-0">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendedor</label>
                    <div className="rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-sm font-medium text-slate-700">
                      {userTitle || 'Operador'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Informação adicional</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Observação (opcional)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
                <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-3 min-w-0">
                  <div className="space-y-3">
                    {[
                      { key: 'dinheiro' as const, label: '1 - Dinheiro', icon: 'payments', shortcut: 'F1' },
                      { key: 'cartao_debito' as const, label: '2 - Cartão Débito', icon: 'credit_card', shortcut: 'F2' },
                      { key: 'pix' as const, label: '4 - PIX', icon: 'qr_code_2', shortcut: 'F3' },
                      { key: 'cartao_credito' as const, label: '3 - Cartão Crédito', icon: 'credit_card', shortcut: 'F4' },
                    ].map(({ key, label, icon, shortcut }) => (
                      <div key={key} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fillRemaining(key)}
                          className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm hover:bg-primary/20"
                          title={`Preencher restante (${shortcut})`}
                        >
                          <span className="material-symbols-outlined text-lg">{icon}</span>
                        </button>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-600 w-16 shrink-0">Valor:</span>
                          <PaymentValueInput
                            paymentKey={key}
                            value={splitAmounts[key]}
                            onValueChange={(n) => setSplit(key, n)}
                            onEditingValue={handleEditingValue}
                            placeholder="0,00"
                            className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <span className="text-sm text-slate-500 shrink-0 hidden sm:inline">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 pt-2">Integrações e outros pagamentos</p>
                  {dinheiroAmount > 0 && (
                    <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                      <label className="block text-sm font-bold text-slate-700">Valor recebido (dinheiro)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value.replace(/[^\d,.]/g, ''))}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="lg:w-[min(100%,28rem)] xl:w-[min(100%,32rem)] shrink-0 flex flex-col gap-4 p-4 sm:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white">
                  <div className="rounded-xl border border-slate-200 p-4 sm:p-6 flex flex-col items-center">
                    <h4 className="text-base font-bold text-slate-900 mb-4">Pagar com PIX</h4>
                    {pixAmount > 0 && (pixChave || mpConnected || pixConfig) ? (
                      (pixPayload || mpPixData) ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          {mpPixData?.qr_code_base64 ? (
                            <img
                              src={`data:image/png;base64,${mpPixData.qr_code_base64}`}
                              alt="QR PIX"
                              className="w-[min(88vw,320px)] h-[min(88vw,320px)] object-contain"
                            />
                          ) : (mpPixData?.qr_code || pixPayload) ? (
                            <QRCodeSVG value={mpPixData?.qr_code || pixPayload || ''} size={300} level="M" />
                          ) : null}
                          <p className="text-sm font-bold text-slate-700 text-center">{formatPrice(pixAmount)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600 py-4">{mpPixLoading ? 'Gerando…' : 'Aguarde…'}</p>
                      )
                    ) : pixAmount > 0 ? (
                      <p className="text-xs text-amber-600 text-center py-4">Configure o PIX nas configurações</p>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">Informe valor em PIX</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 text-center">TEF</h4>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500">Cod. Autorização (NSU)</label>
                      <input type="text" placeholder="—" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" readOnly />
                      <label className="block text-xs font-bold text-slate-500">Maquininha</label>
                      <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                        <option>—</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row gap-3">
                <div className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${splitValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  Total informado: {formatPrice(splitTotal)} {!splitValid && splitTotal > 0 && `(falta ${formatPrice(Math.max(0, totalValue - splitTotal))})`}
                </div>
                <button
                  type="button"
                  onClick={() => void confirmPaymentAndFinish()}
                  disabled={finalizing || !splitValid}
                  className="bg-primary hover:bg-primary/90 text-white py-3 px-8 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {finalizing ? 'Registrando…' : 'Confirmar e finalizar'}
                  <span className="material-symbols-outlined">check_circle</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== MOBILE: layout atual (celular) ========== */}
      <div className="lg:hidden w-full flex justify-center">
        <div className="w-full max-w-md mx-auto rounded-3xl border border-primary/10 bg-background-light shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col">
          <header className="sticky top-0 z-10 bg-background-light/90 backdrop-blur-md px-3 py-3 flex items-center justify-between gap-2 border-b border-primary/10">
            <h1 className="text-sm font-black text-slate-900 truncate flex-1 min-w-0">{projectTitle}</h1>
            <div className="flex items-center gap-1 shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                  {userTitle.slice(0, 1).toUpperCase() || '?'}
                </div>
              )}
              <span className="hidden sm:inline max-w-[80px] truncate text-xs font-semibold text-slate-700">
                {userTitle}
              </span>
              <button
                type="button"
                onClick={openPdvSettings}
                title="Configurações do PDV"
                className="p-2 rounded-full bg-white shadow-sm border border-primary/10 text-slate-600 hover:bg-primary/5"
              >
                <Settings size={18} />
              </button>
              <button
                type="button"
                onClick={togglePdvFullscreen}
                title={pdvFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                className="p-2 rounded-full bg-white shadow-sm border border-primary/10 text-slate-700 hover:bg-primary/5"
              >
                {pdvFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button type="button" className="relative p-2 rounded-full bg-white shadow-sm border border-primary/10">
                <span className="material-symbols-outlined text-slate-700 text-xl">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background-light">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </header>
          <div className="px-4 pt-4 space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-primary">search</span>
              </div>
              <input
                type="text"
                placeholder="Buscar produtos ou passar código de barras..."
                className="block w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary shadow-sm text-sm placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {PDV_MOBILE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-xs font-semibold transition-colors ${
                    category === cat ||
                    (cat === 'Alimentos' && ['Geleias', 'Cestas', 'Orgânicos'].includes(category))
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white text-slate-600 border border-primary/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <main className="flex-1 px-4 py-3 overflow-y-auto">
            {pdvProductsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center mt-8">
                {products.length === 0
                  ? 'Nenhum produto cadastrado. Cadastre produtos na aba Produtos.'
                  : 'Nenhum produto encontrado para esses filtros.'}
              </p>
            ) : (
              <div
                className={
                  layoutMode === 'grid' ? mobileGridClass(cardSize) : 'flex flex-col gap-2'
                }
              >
                {filteredProducts.map((product) =>
                  layoutMode === 'grid'
                    ? renderPdvProductGridCard(product)
                    : renderPdvProductListRow(product)
                )}
              </div>
            )}
          </main>
          <div className="sticky bottom-0 bg-white border-t border-primary/10 px-4 pt-3 pb-5 space-y-3 rounded-t-lg shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotalValue)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-500">Desconto</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={discountAmount > 0 ? discountAmount.toFixed(2).replace('.', ',') : ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(',', '.');
                    const n = parseFloat(v);
                    setDiscountAmount(isNaN(n) || n < 0 ? 0 : n);
                  }}
                  className="w-20 text-right rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-lg font-black text-primary">{formatPrice(totalValue)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Finalizar Venda</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========== WEB: layout completo (desktop) ========== */}
      <div className="hidden lg:flex flex-col flex-1 min-h-[calc(100vh-8rem)] min-h-0 bg-background-light rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {showPdvSettingsScreen && (
            <aside className="w-[min(100%,360px)] max-w-[32vw] shrink-0 border-r border-slate-200 bg-slate-100 flex flex-col min-h-0 shadow-inner">
              {renderPdvSettingsPanel('h-full w-full')}
            </aside>
          )}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 py-3 px-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-black text-slate-900 truncate min-w-0 flex-1">{projectTitle}</h1>
            <div className="flex items-center gap-3 shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                  {userTitle.slice(0, 1).toUpperCase() || '?'}
                </div>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-medium">Operador</p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{userTitle}</p>
              </div>
              <button
                type="button"
                onClick={togglePdvFullscreen}
                title={pdvFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                {pdvFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              </button>
              <button
                type="button"
                onClick={openPdvSettings}
                title="Configurações do PDV"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <Settings size={22} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-200 flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {PDV_WEB_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium shrink-0 ${
                    category === cat
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-slate-100 hover:bg-primary/10 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div
                className={
                  layoutMode === 'grid' ? desktopGridClass(cardSize) : 'flex flex-col gap-2'
                }
              >
                {pdvProductsLoading ? (
                  Array.from({ length: layoutMode === 'list' ? 8 : 20 }).map((_, i) =>
                    layoutMode === 'list' ? (
                      <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                    ) : (
                      <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100">
                        <div className="aspect-square bg-slate-200" />
                        <div className="p-2">
                          <div className="h-3 w-3/4 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-1/2 bg-slate-200 rounded" />
                        </div>
                      </div>
                    )
                  )
                ) : filteredProducts.length === 0 ? (
                  <p className="text-slate-500 col-span-full text-center py-8 text-sm w-full">
                    {products.length === 0
                      ? 'Nenhum produto cadastrado. Cadastre produtos na aba Produtos.'
                      : 'Nenhum produto encontrado.'}
                  </p>
                ) : (
                  filteredProducts.map((product) =>
                    layoutMode === 'grid'
                      ? renderPdvProductGridCard(product)
                      : renderPdvProductListRow(product)
                  )
                )}
              </div>
            </div>
          </section>

          <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <span className="material-symbols-outlined text-primary">shopping_basket</span>
                  Carrinho Atual
                </h2>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Itens'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-base">person</span>
                <span>Consumidor Final</span>
                <button type="button" className="text-primary hover:underline ml-auto">
                  Trocar
                </button>
              </div>
            </div>
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Buscar na vitrine
              </p>
              <div className="relative flex items-center w-full">
                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Buscar produtos ou passar código de barras..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/30 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-0">
              {cart.length === 0 ? (
                <p className="text-slate-400 text-sm italic">
                  Nenhum item no carrinho. Adicione produtos no catálogo.
                </p>
              ) : (
                cart.map((item) => {
                  const product = getProductById(item.productId);
                  const itemTotal = product.price * item.quantity;
                  return (
                    <div key={item.productId} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">{product.name}</h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-slate-400 hover:text-red-500 shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                        <p className="text-slate-500 text-xs mb-2">Un: {formatPrice(product.price)}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="px-2 text-slate-500 hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="px-2 text-slate-500 hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-sm">{formatPrice(itemTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalValue)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Desconto</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={discountAmount > 0 ? discountAmount.toFixed(2).replace('.', ',') : ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(',', '.');
                      const n = parseFloat(v);
                      setDiscountAmount(isNaN(n) || n < 0 ? 0 : n);
                    }}
                    className="w-24 text-right rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-primary">{formatPrice(totalValue)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openPaymentModal}
                  disabled={cart.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar Venda
                  <span className="material-symbols-outlined">check_circle</span>
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium"
                >
                  Cancelar Pedido
                </button>
              </div>
            </div>
          </aside>
        </main>

        <footer className="bg-slate-100 h-8 flex items-center px-6 border-t border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 px-1 rounded border border-slate-300 text-slate-600">F1</span>
            Buscar Cliente
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 px-1 rounded border border-slate-300 text-slate-600">F2</span>
            Aplicar Desconto
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 px-1 rounded border border-slate-300 text-slate-600">F5</span>
            Nova Venda
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 px-1 rounded border border-slate-300 text-slate-600">ESC</span>
            Sair
          </div>
          <div className="ml-auto text-primary">
            SISTEMA OPERACIONAL • INOVAÇÃO IMPERATRIZ © 2024
          </div>
        </footer>
          </div>
        </div>
      </div>
      </>
    </motion.div>
    </div>
  );
}