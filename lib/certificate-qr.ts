import QRCode from 'qrcode';

export async function createCertificateQrDataUri(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    width: 140,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1a1510',
      light: '#ffffff',
    },
  });
}
