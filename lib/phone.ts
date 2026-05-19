/** Máscara (99) 99999-9999 — DDD + 9 dígitos (celular BR) */
export function formatWhatsAppInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function whatsappDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 11);
}

export function isValidWhatsApp(formatted: string): boolean {
  return whatsappDigits(formatted).length === 11;
}

/** Link wa.me com DDI 55 */
export function whatsappLink(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (!d) return '';
  const full = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${full}`;
}
