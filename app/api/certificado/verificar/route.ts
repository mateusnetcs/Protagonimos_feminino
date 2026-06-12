import { NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/certificate-verify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('u') ?? undefined;
    const token = searchParams.get('t') ?? undefined;
    const result = await verifyCertificate(userId, token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: result.message.includes('incompleto') ? 400 : 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      authenticated: true,
      message: 'Certificado autêntico e válido.',
      participant: result.participant,
      program: result.program,
      offeredBy: result.offeredBy,
    });
  } catch (err) {
    console.error('Certificate verify error:', err);
    return NextResponse.json(
      { valid: false, message: 'Erro ao verificar certificado.' },
      { status: 500 }
    );
  }
}
