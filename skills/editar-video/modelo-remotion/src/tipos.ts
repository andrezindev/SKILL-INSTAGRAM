export type Palavra = { w: string; t: number; f: number };

export type Linha = { tipo: 'cmd' | 'out' | 'ok' | 'dim'; texto: string };

// Todos os overlays: t = início (s), d = duração (s). pip = o apresentador vira uma janelinha 9:16 (sem cortar o quadro) enquanto a tela é mostrada.
export type Overlay =
  | { tipo: 'titulo'; t: number; d: number; texto: string; sub?: string; estilo?: 'kinetic' | 'card'; posicao?: 'topo' | 'meio' } // *palavra* = destaque
  | { tipo: 'palavra'; t: number; d: number; texto: string } // palavra gigante vazada que se preenche
  | { tipo: 'terminal'; t: number; d: number; cps?: number; titulo?: string; linhas: Linha[]; pip?: boolean }
  | { tipo: 'lista'; t: number; d: number; titulo?: string; itens: string[]; pip?: boolean }
  | { tipo: 'passos'; t: number; d: number; titulo?: string; itens: string[]; pip?: boolean }
  | { tipo: 'github'; t: number; d: number; repo: string; desc?: string; chips?: string[]; pip?: boolean }
  | { tipo: 'numero'; t: number; d: number; numero: string; rotulo: string }
  | { tipo: 'callout'; t: number; d: number; texto: string; x?: number; y?: number }
  | { tipo: 'imagem'; t: number; d: number; arquivo: string; legenda?: string; pip?: boolean }
  | { tipo: 'video'; t: number; d: number; arquivo: string; legenda?: string; inicio?: number; volume?: number; pip?: boolean } // gravação de tela ou clipe (b-roll)
  | { tipo: 'emoji'; t: number; d: number; emoji: string; x?: number; y?: number; tamanho?: number } // figurinha que pula na tela (x/y de 0 a 1)
  | { tipo: 'comparativo'; t: number; d: number; titulo?: string; antes: { rotulo?: string; itens: string[] }; depois: { rotulo?: string; itens: string[] }; pip?: boolean } // antes x depois
  | { tipo: 'progresso'; t: number; d: number; texto: string; de?: number; ate?: number } // barra que enche (ex.: 'Pronto em 1 minuto')
  | { tipo: 'cta'; t: number; d: number; texto: string; palavra?: string; url?: string; y?: number }; // tela final: com "palavra", simula o comentário sendo digitado

export type Edit = {
  fps?: number;
  largura?: number;
  altura?: number;
  duracao: number;
  video: string; // arquivo em public/
  ajuste?: 'cover' | 'contain';
  faixa?: { left: number; top: number; w: number; h: number; r: number; posY?: number }; // (opcional, não recomendado) vídeo numa faixa
  tema?: { bg?: string; fg?: string; acc?: string; acc2?: string; card?: string; muted?: string };
  legendas?: { ativo?: boolean; posicao?: 'baixo' | 'meio'; top?: number; tamanho?: number; max?: number; destaques?: string[]; maiuscula?: boolean; estilo?: 'pilula' | 'caixa' | 'karaoke'; emojis?: Record<string, string>; palavras: Palavra[] };
  zooms?: { t: number; d: number; escala?: number; x?: number; y?: number }[]; // zoom suave de ênfase
  jumpcuts?: { t: number; escala: number; x?: number; y?: number }[]; // troca seca de enquadramento (vale até o próximo)
  transicoes?: { t: number; tipo: 'flash' | 'wipe' | 'zoom' | 'glitch' }[];
  punch?: number[]; // 'soco' de zoom rápido (0,5 s) nas palavras fortes
  acabamento?: { cor?: boolean; vinheta?: boolean; barra?: boolean }; // padrão: tudo ligado
  overlays?: Overlay[];
  musica?: { arquivo: string; volume?: number; abaixa?: boolean } | null;
  sfx?: { t: number; nome: string; g?: number; auto?: boolean }[];
  sfx_auto?: boolean; // padrão true: montar.mjs gera digitação, dings e pops
  estilo?: string;
  _notas?: unknown;
};
