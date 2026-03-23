/**
 * Extrai dados de uma NF-e (XML) no formato brasileiro.
 * Uso: no navegador com FileReader + DOMParser.
 */

export type NfeItem = {
  itemIndex: number;
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
};

export type NfeParsed = {
  supplierCnpj: string;
  supplierName: string;
  items: NfeItem[];
};

const NF_NS = 'http://www.portalfiscal.inf.br/nfe';

function getText(el: Element | null, tag: string): string {
  if (!el) return '';
  const child = el.getElementsByTagNameNS(NF_NS, tag)[0] ?? el.getElementsByTagName(tag)[0];
  return child?.textContent?.trim() ?? '';
}

function getTextNum(el: Element | null, tag: string): number {
  const s = getText(el, tag);
  if (!s) return 0;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/**
 * Parse NF-e XML string. Funciona no browser (DOMParser).
 */
export function parseNfeXml(xmlString: string): NfeParsed | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) return null;

  const nfe = doc.querySelector('NFe') ?? doc.querySelector('nfe') ?? doc.documentElement;
  if (!nfe) return null;

  const infNFe = nfe.querySelector('infNFe') ?? nfe.querySelector('infnfe');
  if (!infNFe) return null;

  const emit = infNFe.querySelector('emit');
  const supplierCnpj = (getText(emit, 'CNPJ') || getText(emit, 'cnpj')).replace(/\D/g, '');
  const supplierName = getText(emit, 'xNome') || getText(emit, 'xnome') || 'Fornecedor';

  const detList = infNFe.querySelectorAll('det');
  const items: NfeItem[] = [];

  detList.forEach((det, idx) => {
    const prod = det.querySelector('prod');
    if (!prod) return;

    const cProd = getText(prod, 'cProd') || getText(prod, 'cprod') || String(idx + 1);
    const cEAN = (getText(prod, 'cEAN') || getText(prod, 'cean') || '').replace(/\D/g, '');
    const xProd = getText(prod, 'xProd') || getText(prod, 'xprod') || 'Produto';
    const NCM = getText(prod, 'NCM') || getText(prod, 'ncm') || '';
    const uCom = getText(prod, 'uCom') || getText(prod, 'ucom') || 'UN';
    const qCom = getTextNum(prod, 'qCom') || getTextNum(prod, 'qcom') || 0;
    const vUnCom = getTextNum(prod, 'vUnCom') || getTextNum(prod, 'vuncom') || 0;
    const vProd = getTextNum(prod, 'vProd') || getTextNum(prod, 'vprod') || qCom * vUnCom;

    if (xProd && qCom > 0) {
      items.push({
        itemIndex: idx + 1,
        cProd,
        cEAN,
        xProd,
        NCM,
        uCom,
        qCom,
        vUnCom,
        vProd,
      });
    }
  });

  if (items.length === 0) return null;

  return {
    supplierCnpj,
    supplierName,
    items,
  };
}
