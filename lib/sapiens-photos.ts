/**
 * Fotos do projeto exibidas na página pública /sapiens (destino do QR Code do banner).
 * Arquivos em public/sapiens/fotos/. Para incluir uma foto, copie o .jpg para lá e acrescente aqui.
 */

export type SapiensPhoto = { src: string; w: number; h: number; alt: string };
export type SapiensPhotoGroup = { id: string; title: string; description: string; photos: SapiensPhoto[] };

const f = (name: string, w: number, h: number, alt: string): SapiensPhoto => ({
  src: `/sapiens/fotos/${name}.jpg`,
  w,
  h,
  alt,
});

export const SAPIENS_PHOTO_GROUPS: SapiensPhotoGroup[] = [
  {
    id: 'oficinas',
    title: 'Oficinas no laboratório',
    description: 'Participantes aprendendo a usar a plataforma Jornada do Produtor nos laboratórios de informática.',
    photos: [
      f('oficina-1', 1280, 960, 'Participantes usando computadores durante oficina no laboratório de informática'),
      f('oficina-2', 1280, 960, 'Participantes acompanhando a plataforma nas telas do laboratório'),
      f('oficina-3', 1600, 900, 'Vista do laboratório com participantes e equipe durante a oficina'),
    ],
  },
  {
    id: 'feira',
    title: 'Ação na feira',
    description: 'Equipe do projeto na Feirinha da Prefs e no Empreende Mulher, junto às empreendedoras locais.',
    photos: [
      f('feira-1', 1200, 1600, 'Equipe do projeto na entrada da feira, sob o pórtico do evento'),
      f('feira-2', 960, 1280, 'Equipe do projeto em frente ao pórtico da Feirinha da Prefs'),
      f('feira-3', 960, 1280, 'Integrantes da equipe conversando com uma empreendedora entre as barracas da feira'),
      f('feira-4', 1280, 960, 'Equipe do projeto ao lado do painel do Empreende Mulher'),
    ],
  },
  {
    id: 'encerramento',
    title: 'Encerramento e certificação',
    description: 'Entrega dos certificados de participação e encontro de encerramento na UEMASUL.',
    photos: [
      f('encerramento-1', 1280, 960, 'Participantes com seus certificados no auditório da UEMASUL'),
      f('encerramento-2', 1600, 900, 'Equipe e convidados à frente do auditório durante o encerramento'),
      f('encerramento-3', 720, 1280, 'Equipe e convidados reunidos no auditório'),
      f('encerramento-4', 1280, 960, 'Plateia de participantes no auditório durante o encerramento'),
      f('encerramento-5', 960, 1280, 'Integrantes da equipe do projeto em sala de aula'),
    ],
  },
];
