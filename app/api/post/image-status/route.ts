import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobid = searchParams.get('jobid');
    if (!jobid) return NextResponse.json({ error: 'jobid obrigatório' }, { status: 400 });

    const token = process.env.USEAPI_TOKEN;
    if (!token) return NextResponse.json({ error: 'Dreamina não configurado' }, { status: 500 });

    const res = await fetch(`https://api.useapi.net/v1/dreamina/images/${jobid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const job = await res.json();
    const status = String(job?.status || '').toLowerCase();

    if (status === 'completed') {
      const images = job.response?.images || [];
      const imageUrls = images.map((img: { imageUrl?: string }) => img.imageUrl).filter(Boolean);
      if (imageUrls.length) {
        return NextResponse.json({
          status: 'completed',
          imageUrl: imageUrls[0],
          imageUrls,
        });
      }
      return NextResponse.json({ status: 'failed', error: 'Sem imagens na resposta' });
    }
    if (status === 'failed') {
      return NextResponse.json({ status: 'failed', error: job.error || 'Job falhou' });
    }
    return NextResponse.json({ status: status || 'processing' });
  } catch (err) {
    console.error('Image status error:', err);
    return NextResponse.json({ error: 'Erro ao verificar imagem' }, { status: 500 });
  }
}
