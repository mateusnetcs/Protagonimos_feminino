import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function fetchJobImageUrls(jobid: string, token: string): Promise<{ status: string; urls: string[]; error?: string }> {
  const res = await fetch(`https://api.useapi.net/v1/dreamina/images/${jobid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const job = await res.json();
  const status = String(job?.status || '').toLowerCase();

  if (status === 'completed') {
    const images = job.response?.images || [];
    const urls = images.map((img: { imageUrl?: string }) => img.imageUrl).filter(Boolean) as string[];
    return { status: 'completed', urls };
  }
  if (status === 'failed') {
    return { status: 'failed', urls: [], error: job.error || 'Job falhou' };
  }
  return { status: status || 'processing', urls: [] };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobid = searchParams.get('jobid');
    const jobidsParam = searchParams.get('jobids');
    const jobids = jobidsParam
      ? jobidsParam.split(',').map((j) => j.trim()).filter(Boolean)
      : jobid
        ? [jobid]
        : [];

    if (jobids.length === 0) return NextResponse.json({ error: 'jobid obrigatório' }, { status: 400 });

    const token = process.env.USEAPI_TOKEN;
    if (!token) return NextResponse.json({ error: 'Dreamina não configurado' }, { status: 500 });

    const results = await Promise.all(jobids.map((id) => fetchJobImageUrls(id, token)));

    const allCompleted = results.every((r) => r.status === 'completed');
    const anyFailed = results.some((r) => r.status === 'failed');
    const anyProcessing = results.some((r) => r.status !== 'completed' && r.status !== 'failed');

    if (allCompleted) {
      const imageUrls = results.flatMap((r) => r.urls);
      if (imageUrls.length) {
        return NextResponse.json({
          status: 'completed',
          imageUrl: imageUrls[0],
          imageUrls,
        });
      }
      return NextResponse.json({ status: 'failed', error: 'Sem imagens na resposta' });
    }

    if (anyFailed && !anyProcessing) {
      const err = results.find((r) => r.error)?.error || 'Um ou mais jobs falharam';
      return NextResponse.json({ status: 'failed', error: err });
    }

    return NextResponse.json({ status: 'processing' });
  } catch (err) {
    console.error('Image status error:', err);
    return NextResponse.json({ error: 'Erro ao verificar imagem' }, { status: 500 });
  }
}
