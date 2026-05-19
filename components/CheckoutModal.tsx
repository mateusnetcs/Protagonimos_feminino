'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatWhatsAppInput, isValidWhatsApp, whatsappDigits } from '@/lib/phone';

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

type DeliveryType = 'entrega' | 'retirada';
type PayMethod = 'dinheiro' | 'pix' | 'cartao';
type StepId = 'delivery' | 'ident' | 'payment' | 'cash' | 'address' | 'summary';

const formatPrice = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

type Props = {
  items: CartItem[];
  onClose: () => void;
  onSuccess: (customerName?: string) => void;
  customer?: CustomerSession | null;
  sellerUserId?: string;
};

function buildSteps(isLoggedIn: boolean, delivery: DeliveryType | null, pay: PayMethod | null): StepId[] {
  const steps: StepId[] = ['delivery'];
  if (!delivery) return steps;

  if (!isLoggedIn) steps.push('ident');
  steps.push('payment');
  if (!pay) return steps;

  if (pay === 'dinheiro') {
    steps.push('cash');
    if (delivery === 'entrega') steps.push('address');
  } else if (delivery === 'entrega') {
    steps.push('address');
  }
  if (pay === 'pix' || pay === 'cartao') steps.push('summary');
  return steps;
}

const STEP_TITLES: Record<StepId, string> = {
  delivery: 'Entrega ou retirada',
  ident: 'Identificação',
  payment: 'Forma de pagamento',
  cash: 'Pagamento em dinheiro',
  address: 'Endereço',
  summary: 'Resumo',
};

export default function CheckoutModal({ items, onClose, onSuccess, customer, sellerUserId }: Props) {
  const isLoggedIn = !!customer;
  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const [step, setStep] = useState<StepId>('delivery');
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cashPaidInput, setCashPaidInput] = useState('');
  const [pixResult, setPixResult] = useState<{
    qr_code_base64: string;
    qr_code: string;
    payment_id?: string;
  } | null>(null);

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
    whatsapp: '',
  });

  const steps = useMemo(
    () => buildSteps(isLoggedIn, deliveryType, paymentMethod),
    [isLoggedIn, deliveryType, paymentMethod]
  );
  const stepIndex = steps.indexOf(step);
  const isLastStep = stepIndex === steps.length - 1;

  const cashPaid = parseFloat(cashPaidInput.replace(',', '.')) || 0;
  const cashChange = paymentMethod === 'dinheiro' && cashPaid >= total ? cashPaid - total : null;

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

  useEffect(() => {
    if (!pixResult?.payment_id) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/catalog/payment-status?payment_id=${encodeURIComponent(pixResult.payment_id!)}`
        );
        const d = await r.json();
        if (d.status === 'approved') {
          const name = form.name || customer?.name || '';
          setPixResult(null);
          onSuccess(name);
          onClose();
        }
      } catch {
        /* polling */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pixResult?.payment_id, onSuccess, onClose, form.name, customer?.name]);

  const goNext = () => {
    setError('');
    if (step === 'delivery') {
      if (!deliveryType) {
        setError('Escolha entrega ou retirada.');
        return;
      }
      const next = steps[stepIndex + 1];
      if (next) setStep(next);
      return;
    }
    if (step === 'ident') {
      if (!form.name || !form.last_name || !form.email) {
        setError('Preencha nome, sobrenome e e-mail.');
        return;
      }
      const next = steps[stepIndex + 1];
      if (next) setStep(next);
      return;
    }
    if (step === 'payment') {
      if (!paymentMethod) {
        setError('Escolha a forma de pagamento.');
        return;
      }
      const next = steps[stepIndex + 1];
      if (next) setStep(next);
      return;
    }
    if (step === 'cash') {
      if (cashPaid < total) {
        setError(`Informe um valor igual ou maior que ${formatPrice(total)}.`);
        return;
      }
      if (deliveryType === 'retirada') {
        void submitOrder();
        return;
      }
    }
    if (step === 'address') {
      if (!form.cidade || !form.bairro || !form.rua || !form.numero) {
        setError('Preencha Cidade, Bairro, Rua e Número.');
        return;
      }
      if (deliveryType === 'entrega' && !isValidWhatsApp(form.whatsapp)) {
        setError('Informe o WhatsApp no formato (99) 99999-9999.');
        return;
      }
      if (paymentMethod === 'dinheiro') {
        void submitOrder();
        return;
      }
    }
    if (isLastStep && paymentMethod) {
      void submitOrder();
      return;
    }
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setError('');
    if (stepIndex > 0) setStep(steps[stepIndex - 1]);
    else onClose();
  };

  const submitOrder = async () => {
    setError('');
    setLoading(true);
    try {
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
        delivery_type: deliveryType,
        seller_user_id: sellerUserId ? Number(sellerUserId) : undefined,
        cash_paid_amount: paymentMethod === 'dinheiro' ? cashPaid : undefined,
        customer_whatsapp:
          deliveryType === 'entrega' ? whatsappDigits(form.whatsapp) : undefined,
      };

      const res = await fetch('/api/catalog/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao processar');

      if (data.type === 'dinheiro') {
        onSuccess(form.name || customer?.name || '');
        onClose();
        return;
      }
      if (data.type === 'pix' && data.qr_code_base64) {
        setPixResult({
          qr_code_base64: data.qr_code_base64,
          qr_code: data.qr_code || '',
          payment_id: data.payment_id,
        });
        return;
      }
      if (data.type === 'redirect' && data.init_point) {
        window.location.href = data.init_point;
        return;
      }
      throw new Error('Resposta inválida');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = () => {
    if (loading) return 'Processando...';
    if (step === 'cash' && deliveryType === 'retirada') return 'Confirmar pedido';
    if (step === 'address' && paymentMethod === 'dinheiro') return 'Confirmar pedido';
    if (isLastStep) {
      if (paymentMethod === 'pix') return 'Gerar Pix';
      if (paymentMethod === 'cartao') return 'Pagar com cartão';
      return 'Confirmar';
    }
    return 'Continuar';
  };

  const title = pixResult ? 'Pague com Pix' : STEP_TITLES[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {pixResult ? (
            <div className="text-center space-y-4">
              <p className="text-slate-600">Escaneie o QR Code ou copie o código Pix:</p>
              <div className="flex justify-center">
                <img
                  src={
                    pixResult.qr_code_base64?.startsWith('data:')
                      ? pixResult.qr_code_base64
                      : `data:image/png;base64,${pixResult.qr_code_base64}`
                  }
                  alt="Pix QR Code"
                  className="w-48 h-48"
                />
              </div>
              <input
                type="text"
                readOnly
                value={pixResult.qr_code}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(pixResult.qr_code)}
                className="text-sm text-primary font-semibold"
              >
                Copiar código
              </button>
              <p className="text-xs text-emerald-600 font-medium">Verificando pagamento a cada 3 segundos...</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                {step === 'delivery' && (
                  <motion.div key="delivery" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className="text-sm text-slate-600">Como você prefere receber seu pedido?</p>
                    <motion.div layout className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('entrega')}
                        className={`py-5 px-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 ${
                          deliveryType === 'entrega'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">local_shipping</span>
                        Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('retirada')}
                        className={`py-5 px-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 ${
                          deliveryType === 'retirada'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">store</span>
                        Retirada
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {step === 'ident' && (
                  <motion.div key="ident" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className="text-sm text-slate-600">Informe seus dados. Não é necessário criar conta.</p>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Nome *</span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Sobrenome *</span>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">E-mail *</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                  </motion.div>
                )}

                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className="text-sm text-slate-600">Escolha como deseja pagar:</p>
                    <div className="grid grid-cols-1 gap-3">
                      {(['dinheiro', 'pix', 'cartao'] as PayMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`flex items-center gap-3 py-4 px-4 rounded-xl border-2 font-semibold ${
                            paymentMethod === m
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="material-symbols-outlined">
                            {m === 'dinheiro' ? 'payments' : m === 'pix' ? 'qr_code_2' : 'credit_card'}
                          </span>
                          {m === 'dinheiro' ? 'Dinheiro' : m === 'pix' ? 'Pix' : 'Cartão'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'cash' && (
                  <motion.div key="cash" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Total do pedido: <strong className="text-primary">{formatPrice(total)}</strong>
                    </p>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Com qual nota/cédula vai pagar? *</span>
                      <input
                        type="number"
                        min={total}
                        step="0.01"
                        value={cashPaidInput}
                        onChange={(e) => setCashPaidInput(e.target.value)}
                        placeholder={`Ex: ${Math.ceil(total)}`}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold"
                      />
                    </label>
                    {cashChange != null && cashChange >= 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-emerald-800 font-medium">Troco</p>
                        <p className="text-2xl font-black text-emerald-700">{formatPrice(cashChange)}</p>
                      </div>
                    )}
                    {deliveryType === 'retirada' && (
                      <p className="text-xs text-slate-500">
                        Retirada no local — ao confirmar, o pedido já entra como confirmado no painel.
                      </p>
                    )}
                  </motion.div>
                )}

                {step === 'address' && (
                  <motion.div key="address" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    {isLoggedIn && (
                      <p className="text-sm text-slate-600">Olá, {form.name}! Confira ou atualize seu endereço.</p>
                    )}
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Cidade *</span>
                      <input
                        type="text"
                        value={form.cidade}
                        onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Bairro *</span>
                      <input
                        type="text"
                        value={form.bairro}
                        onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Rua *</span>
                      <input
                        type="text"
                        value={form.rua}
                        onChange={(e) => setForm((f) => ({ ...f, rua: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Número *</span>
                      <input
                        type="text"
                        value={form.numero}
                        onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">CEP</span>
                      <input
                        type="text"
                        value={form.cep}
                        onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value.replace(/\D/g, '') }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                        maxLength={9}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Complemento</span>
                      <input
                        type="text"
                        value={form.complemento}
                        onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">WhatsApp *</span>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, whatsapp: formatWhatsAppInput(e.target.value) }))
                        }
                        placeholder="(99) 99999-9999"
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Usado para contato sobre a entrega e no painel do lojista.
                      </p>
                    </label>
                  </motion.div>
                )}

                {step === 'summary' && (
                  <motion.div key="summary" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <motion.div layout className="space-y-2 max-h-40 overflow-y-auto">
                      {items.map((i) => (
                        <div key={i.product_id} className="flex justify-between text-sm">
                          <span>
                            {i.name} x{i.quantity}
                          </span>
                          <span className="font-semibold">{formatPrice(i.quantity * i.unit_price)}</span>
                        </div>
                      ))}
                    </motion.div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {deliveryType === 'retirada' ? 'Retirada no local' : 'Entrega'} ·{' '}
                      {paymentMethod === 'pix'
                        ? 'Será gerado um QR Code Pix.'
                        : 'Você será redirecionado ao Mercado Pago para pagar com cartão.'}
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
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600"
            >
              {stepIndex === 0 ? 'Cancelar' : 'Voltar'}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-70"
            >
              {primaryLabel()}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
