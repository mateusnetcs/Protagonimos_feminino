import type { Metadata } from 'next';
import CapacitacaoSlideshow from '@/components/capacitacao/CapacitacaoSlideshow';

export const metadata: Metadata = {
  title: 'Capacitação | Jornada do Produtor',
  description: 'Apresentação em slides sobre os módulos da plataforma.',
};

export default function CapacitacaoPage() {
  return <CapacitacaoSlideshow />;
}
