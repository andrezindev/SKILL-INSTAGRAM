import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Edicao } from './Edicao';
import type { Edit } from './tipos';

// Lê public/edit.json (gerado pela skill editar-video) para definir duração, tamanho e fps.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Edicao"
    component={Edicao}
    durationInFrames={30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ edit: null as Edit | null }}
    calculateMetadata={async () => {
      const edit: Edit = await fetch(staticFile('edit.json')).then((r) => r.json());
      const fps = edit.fps || 30;
      return { durationInFrames: Math.max(1, Math.round(edit.duracao * fps)), fps, width: edit.largura || 1080, height: edit.altura || 1920, props: { edit } };
    }}
  />
);
