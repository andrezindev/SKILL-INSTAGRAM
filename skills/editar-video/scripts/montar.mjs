// Prepara (ou atualiza) o projeto de edição Remotion numa pasta de trabalho.
// Uso: node montar.mjs <pasta-de-trabalho> <video-cortado.mp4> <edit.json> [--sem-install] [--manter-video]
// - Copia o modelo (src sempre atualizado), reencoda o vídeo para render estável, copia sons, música e arquivos dos overlays.
// - Dependências: instaladas UMA vez na pasta da skill e ligadas ao projeto (junction), sem npm install a cada vídeo.
// - sfx_auto (padrão): acrescenta sozinho digitação e "ding" no terminal, digitação e "chaching" no CTA de comentário, "pop" nos balões.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SK = path.join(HERE, '..');
const MOD = path.join(SK, 'modelo-remotion');
const [work, video, editPath, ...rest] = process.argv.slice(2);
if (!work || !video || !editPath) { console.error('uso: node montar.mjs <pasta> <video.mp4> <edit.json> [--sem-install] [--manter-video]'); process.exit(1); }
const R = path.join(path.resolve(work), 'remotion');
const cp = (a, b) => fs.cpSync(a, b, { recursive: true });

// 1) modelo: config sempre; src sempre atualizado (o modelo é a fonte da verdade)
fs.mkdirSync(R, { recursive: true });
for (const f of ['package.json', 'tsconfig.json', 'remotion.config.ts']) cp(path.join(MOD, f), path.join(R, f));
fs.rmSync(path.join(R, 'src'), { recursive: true, force: true });
cp(path.join(MOD, 'src'), path.join(R, 'src'));
fs.mkdirSync(path.join(R, 'public', 'sfx'), { recursive: true });
for (const f of fs.readdirSync(path.join(SK, 'assets', 'sfx'))) {
  if (f === 'music.wav') cp(path.join(SK, 'assets', 'sfx', f), path.join(R, 'public', 'music.wav'));
  else cp(path.join(SK, 'assets', 'sfx', f), path.join(R, 'public', 'sfx', f));
}

// 2) dependências compartilhadas
const depsSK = path.join(MOD, 'node_modules');
if (!fs.existsSync(depsSK) && !rest.includes('--sem-install')) {
  console.log('instalando dependências na skill (só da primeira vez, 1 a 3 min)...');
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: MOD, stdio: 'inherit', shell: true });
  if (r.status !== 0) { console.error('npm install falhou'); process.exit(1); }
}
const depsR = path.join(R, 'node_modules');
if (fs.existsSync(depsSK)) {
  let ok = false;
  try { ok = fs.lstatSync(depsR).isSymbolicLink() || fs.existsSync(path.join(depsR, 'remotion')); } catch {}
  if (!ok) { fs.rmSync(depsR, { recursive: true, force: true }); fs.symlinkSync(depsSK, depsR, 'junction'); }
}

// 3) vídeo (reencodado: quadro-chave a cada 1 s e timescale fixo evitam "No frame found at position")
const vdst = path.join(R, 'public', 'video.mp4');
if (!(rest.includes('--manter-video') && fs.existsSync(vdst))) {
  const enc = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-r', '30', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0', '-video_track_timescale', '30000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', vdst], { encoding: 'utf8' });
  if (enc.status !== 0) { console.error('ffmpeg falhou ao preparar o vídeo (ffmpeg no PATH?):', (enc.stderr || '').slice(0, 300)); process.exit(1); }
}

// 4) edit.json: arquivos dos overlays e sons automáticos
const edit = JSON.parse(fs.readFileSync(editPath, 'utf8'));
edit.video = 'video.mp4';
const base = path.dirname(path.resolve(editPath));
const traz = (nome) => { const src = path.isAbsolute(nome) ? nome : path.join(base, nome); if (fs.existsSync(src)) cp(src, path.join(R, 'public', path.basename(nome))); else console.warn('arquivo não encontrado:', src); return path.basename(nome); };
for (const o of edit.overlays || []) if (o.arquivo) o.arquivo = traz(o.arquivo);
if (edit.musica?.arquivo && edit.musica.arquivo !== 'music.wav') edit.musica.arquivo = traz(edit.musica.arquivo);
if (edit.sfx_auto !== false) {
  const sfx = (edit.sfx || []).filter((s) => !s.auto);
  for (const o of edit.overlays || []) {
    if (o.tipo === 'terminal') {
      const cps = o.cps || 30; let clock = 0;
      for (const l of o.linhas) {
        const st = o.t + 0.4 + clock;
        if (l.tipo === 'cmd') { const d = l.texto.length / cps; for (let k = 0; k < Math.floor(d / 0.085); k++) sfx.push({ t: +(st + k * 0.085).toFixed(3), nome: 'tick', g: 0.18, auto: true }); clock += d + 0.3; }
        else { if (l.tipo === 'ok') sfx.push({ t: +st.toFixed(3), nome: 'ding', g: 0.3, auto: true }); clock += 0.34; }
      }
    }
    if (o.tipo === 'cta' && o.palavra) {
      for (let k = 0; k < o.palavra.length; k++) sfx.push({ t: +(o.t + 0.7 + k / 7).toFixed(3), nome: 'tick', g: 0.3, auto: true });
      sfx.push({ t: +(o.t + 0.9 + o.palavra.length / 7).toFixed(3), nome: 'chaching', g: 0.5, auto: true });
    }
    if (o.tipo === 'callout' || o.tipo === 'palavra' || o.tipo === 'github' || o.tipo === 'emoji') sfx.push({ t: o.t, nome: 'pop', g: o.tipo === 'emoji' ? 0.35 : 0.5, auto: true });
    if (o.tipo === 'comparativo') { sfx.push({ t: o.t + 0.15, nome: 'pop', g: 0.35, auto: true }); sfx.push({ t: +(o.t + 0.5 + o.antes.itens.length * 0.22).toFixed(3), nome: 'ding', g: 0.3, auto: true }); }
    if (o.tipo === 'progresso') sfx.push({ t: +(o.t + 0.3 + Math.max(0.6, o.d - 1.0)).toFixed(3), nome: 'ding', g: 0.3, auto: true });
  }
  edit.sfx = sfx.sort((a, b) => a.t - b.t);
}
fs.writeFileSync(path.join(R, 'public', 'edit.json'), JSON.stringify(edit, null, 2));
console.log('projeto pronto em', R, '·', (edit.sfx || []).length, 'efeitos sonoros');
console.log('prévia rápida:  cd "' + R + '" && npx remotion render src/index.ts Edicao out/previa.mp4 --scale=0.5 --crf=28');
console.log('final:          cd "' + R + '" && npx remotion render src/index.ts Edicao out/final.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --audio-codec=aac');
console.log('só o áudio:     cd "' + R + '" && npx remotion render src/index.ts Edicao out/audio.wav --codec=wav');
