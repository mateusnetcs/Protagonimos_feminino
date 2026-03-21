'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'motion/react';

type CartItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

type CustomerSession = {
  id: number;
  email: string;
  name: string;
  last_name: string;
  photo_url?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  cep?: string | null;
  complemento?: string | null;
};

const formatPrice = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

type Props = {
  items: CartItem[];
  onClose: () => void;
  onSuccess: (customerName?: string) => void;
  customer?: CustomerSession | null;
};

declare global {
  interface Window {
    MercadoPago?: new (key: string) => {
      createCardToken: (cardData: object) => Promise<{ id: string }>;
      getPaymentMethod: (params: object) => Promise<{ body: { id: string } }>;
    };
  }
}

export default function CheckoutModal({ items, onClose, onSuccess, customer }: Props) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixResult, setPixResult] = useState<{ qr_code_base64: string; qr_code: string; payment_id?: string } | null>(null);
  const isLoggedIn = !!customer;
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    last_name: customer?.last_name ?? '',
    email: customer?.email ?? '',
    cidade: customer?.cidade ?? '',
    bairro: customer?.bairro ?? '',
    rua: customer?.rua ?? '',
    numero: customer?.numero ?? '',
    cep: customer?.cep ?? '',
    complemento: customer?.complemento ?? '',
    card_number: '',
    card_expiration: '',
    card_cvv: '',
    card_name: '',
  });
  useEffect(() => {
    if (!pixResult?.payment_id) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/catalog/payment-status?payment_id=${encodeURIComponent(pixResult.payment_id!)}`);
        const d = await r.json();
        if (d.status === 'approved') {
          const name = form.name || customer?.name || '';
          setPixResult(null);
          onSuccess(name);
          onClose();
        }
      } catch {
        /* ignora erros de polling */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pixResult?.payment_id, onSuccess, onClose]);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: customer.name ?? '',
        last_name: customer.last_name ?? '',
        email: customer.email ?? '',
        cidade: customer.cidade ?? '',
        bairro: customer.bairro ?? '',
        rua: customer.rua ?? '',
        numero: customer.numero ?? '',
        cep: customer.cep ?? '',
        complemento: customer.complemento ?? '',
      }));
    }
  }, [customer]);

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';

  const maxStep = isLoggedIn ? 3 : 4;
  const stepTitles: Record<number, string> = isLoggedIn
    ? { 1: 'Endereço de entrega', 2: 'Forma de pagamento', 3: 'Resumo' }
    : { 1: 'Identificação', 2: 'Endereço de entrega', 3: 'Forma de pagamento', 4: 'Resumo' };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let cardToken: string | undefined;
      let paymentMethodId = 'visa';

      if (paymentMethod === 'cartao' && publicKey && window.MercadoPago) {
        const mp = new window.MercadoPago(publicKey);
        const exp = form.card_expiration.replace(/\D/g, '');
        const [month, year] = exp.length >= 4 ? [exp.slice(0, 2), '20' + exp.slice(2)] : ['', ''];
        try {
          const result = await mp.createCardToken({
            cardNumber: form.card_number.replace(/\D/g, ''),
            cardholderName: form.card_name,
            cardExpirationMonth: month,
            cardExpirationYear: year,
            securityCode: form.card_cvv,
          });
          cardToken = result.id;
          const pm = await mp.getPaymentMethod({ bin: form.card_number.replace(/\D/g, '').slice(0, 6) });
          paymentMethodId = pm?.body?.id || 'visa';
        } catch (e) {
          throw new Error('Dados do cartão inválidos. Verifique e tente novamente.');
        }
      } else if (paymentMethod === 'cartao') {
        throw new Error('Pagamento com cartão não disponível. Use Pix ou configure a chave pública do Mercado Pago.');
      }

      const body: Record<string, unknown> = {
        customer: {
          name: form.name,
          last_name: form.last_name,
          email: form.email,
          customer_id: isLoggedIn ? customer!.id : undefined,
        },
        address: {
          cidade: form.cidade,
          bairro: form.bairro,
          rua: form.rua,
          numero: form.numero,
          cep: form.cep || '',
          complemento: form.complemento || '',
        },
        items: items.map((i) => ({
          product_id: i.product_id,
          title: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        payment_method: paymentMethod,
      };
      if (cardToken) {
        body.card_token = cardToken;
        body.payment_method_id = paymentMethodId;
      }

      const res = await fetch('/api/catalog/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao processar');

      if (data.type === 'pix' && data.qr_code_base64) {
        setPixResult({ qr_code_base64: data.qr_code_base64, qr_code: data.qr_code || '', payment_id: data.payment_id });
        return;
      }
      if (data.type === 'cartao') {
        if (data.status === 'approved') {
          const name = form.name || customer?.name || '';
          onSuccess(name);
          onClose();
        } else {
          throw new Error('Pagamento não aprovado. Tente novamente ou use Pix.');
        }
        return;
      }
      throw new Error('Resposta inválida');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepTitle = isLoggedIn ? (step === 1 ? 'Endereço' : step === 2 ? 'Pagamento' : 'Resumo') : stepTitles[step];

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="lazyOnload" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{pixResult ? 'Pague com Pix' : currentStepTitle}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {pixResult ? (
              <div className="text-center space-y-4">
                <p className="text-slate-600">Escaneie o QR Code ou copie o código abaixo para pagar:</p>
                <div className="flex justify-center">
                  <img
                    src={pixResult.qr_code_base64?.startsWith('data:') ? pixResult.qr_code_base64 : `data:image/png;base64,${pixResult.qr_code_base64}`}
                    alt="Pix QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Código Pix (copiar e colar):</p>
                  <input
                    type="text"
                    readOnly
                    value={pixResult.qr_code}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pixResult.qr_code);
                      alert('Código copiado!');
                    }}
                    className="mt-2 text-sm text-primary font-semibold"
                  >
                    Copiar código
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Após pagar, o pagamento será confirmado automaticamente. Você pode fechar quando desejar.
                </p>
                <p className="text-xs text-emerald-600 font-medium">Verificando pagamento a cada 3 segundos...</p>
                <button type="button" onClick={() => { const name = form.name || customer?.name || ''; setPixResult(null); onSuccess(name); onClose(); }} className="text-primary font-semibold">
                  Já paguei, finalizar
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {step === 1 && !isLoggedIn && (
                    <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <p className="text-sm text-slate-600">Informe seus dados para a entrega. Você não precisa criar conta.</p>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Nome *</span><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Seu nome" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Sobrenome *</span><input type="text" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Seu sobrenome" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Email *</span><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="seu@email.com" /></label>
                    </motion.div>
                  )}
                  {(step === (isLoggedIn ? 1 : 2)) && (
                    <motion.div key="s2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      {isLoggedIn && <p className="text-sm text-slate-600">Olá, {form.name}! Confira ou atualize seu endereço.</p>}
                      <label className="block"><span className="text-sm font-medium text-slate-700">Cidade *</span><input type="text" value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Sua cidade" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Bairro *</span><input type="text" value={form.bairro} onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Seu bairro" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Rua *</span><input type="text" value={form.rua} onChange={(e) => setForm((f) => ({ ...f, rua: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Nome da rua" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Número *</span><input type="text" value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Nº" /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">CEP</span><input type="text" value={form.cep} onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value.replace(/\D/g, '') }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="00000-000" maxLength={9} /></label>
                      <label className="block"><span className="text-sm font-medium text-slate-700">Complemento</span><input type="text" value={form.complemento} onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Apto, bloco, etc." /></label>
                    </motion.div>
                  )}
                  {(step === (isLoggedIn ? 2 : 3)) && (
                    <motion.div key="s3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <p className="text-sm text-slate-600 mb-4">Escolha como deseja pagar:</p>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setPaymentMethod('pix')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold ${paymentMethod === 'pix' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600'}`}>
                          <span className="material-symbols-outlined">qr_code_2</span> Pix
                        </button>
                        <button type="button" onClick={() => setPaymentMethod('cartao')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold ${paymentMethod === 'cartao' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600'}`}>
                          <span className="material-symbols-outlined">credit_card</span> Cartão
                        </button>
                      </div>
                      {paymentMethod === 'cartao' && publicKey && (
                        <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
                          <label className="block"><span className="text-sm font-medium text-slate-700">Número do cartão *</span><input type="text" value={form.card_number} onChange={(e) => setForm((f) => ({ ...f, card_number: e.target.value.replace(/\D/g, '').slice(0, 16) }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="0000 0000 0000 0000" /></label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className="text-sm font-medium text-slate-700">Validade *</span><input type="text" value={form.card_expiration} onChange={(e) => setForm((f) => ({ ...f, card_expiration: e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})/, '$1/') }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="MM/AA" /></label>
                            <label className="block"><span className="text-sm font-medium text-slate-700">CVV *</span><input type="text" value={form.card_cvv} onChange={(e) => setForm((f) => ({ ...f, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="123" /></label>
                          </div>
                          <label className="block"><span className="text-sm font-medium text-slate-700">Nome no cartão *</span><input type="text" value={form.card_name} onChange={(e) => setForm((f) => ({ ...f, card_name: e.target.value }))} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Como está no cartão" /></label>
                          <p className="text-xs text-slate-500">Pagamento processado com segurança pelo Mercado Pago.</p>
                        </div>
                      )}
                      {paymentMethod === 'cartao' && !publicKey && (
                        <p className="mt-4 text-sm text-amber-600">Pagamento com cartão em breve. Use Pix por enquanto.</p>
                      )}
                    </motion.div>
                  )}
                  {(step === (isLoggedIn ? 3 : 4)) && (
                    <motion.div key="s4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {items.map((i) => (
                          <div key={i.product_id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{i.name} x{i.quantity}</span>
                            <span className="font-semibold">{formatPrice(i.quantity * i.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {paymentMethod === 'pix' ? 'Após confirmar, um QR Code Pix será exibido para você pagar aqui mesmo.' : 'O pagamento será processado de forma segura.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
              </>
            )}
          </div>
          {!pixResult && (
            <div className="p-6 border-t border-slate-100 flex gap-3">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">Voltar</button>
              ) : (
                <button type="button" onClick={onClose} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">Cancelar</button>
              )}
              <button
                type="button"
                onClick={() => (step < maxStep ? setStep(step + 1) : handleSubmit())}
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-70"
              >
                {loading ? 'Processando...' : step < maxStep ? 'Continuar' : paymentMethod === 'pix' ? 'Gerar Pix' : 'Pagar'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
