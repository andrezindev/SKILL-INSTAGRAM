// Analisa o vídeo bruto: informações técnicas, transcrição com tempo por palavra e silêncios.
// Uso: node analisar.mjs <video> <pasta-de-trabalho> [idioma=pt]
// Gera: info.json, palavras.json ([{w,t,f}]), silencios.json ([{ini,fim}]), transcricao.md (frases com tempo)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [video, work, lang = 'pt'] = process.argv.slice(2);
if (!video || !work) { console.error('uso: node analisar.mjs <video> <pasta> [idioma]'); process.exit(1); }
fs.mkdirSync(work, { recursive: true });
const sh = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, shell: process.platform === 'win32' && cmd === 'npx', ...o });

// 1) info
const pr = sh('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', video]);
const pj = JSON.parse(pr.stdout || '{}');
const v = (pj.streams || []).find((s) => s.codec_type === 'video') || {};
const [n, d] = String(v.r_frame_rate || '30/1').split('/').map(Number);
const info = { duracao: Number(pj.format?.duration || 0), largura: v.width, altura: v.height, fps: +(n / (d || 1)).toFixed(2), tem_audio: (pj.streams || []).some((s) => s.codec_type === 'audio') };
fs.writeFileSync(path.join(work, 'info.json'), JSON.stringify(info, null, 2));
console.log('info:', JSON.stringify(info));
if (!info.tem_audio) { console.error('O vídeo não tem áudio.'); process.exit(1); }

// 1b) vídeo girado por metadado (comum em vídeos de celular/WhatsApp) ou com taxa de quadros variável: normaliza para 30 fps e orientação real
const rot = sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream_side_data=rotation', '-of', 'csv=p=0', video]).stdout.trim();
if ((rot && rot !== '0') || Math.abs(info.fps - 30) > 0.5) {
  const norm = path.join(work, 'normalizado.mp4');
  const r = sh('ffmpeg', ['-v', 'error', '-y', '-i', video, '-r', '30', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', norm]);
  if (!fs.existsSync(norm)) { console.error('Falha ao normalizar:', (r.stderr || '').slice(0, 300)); process.exit(1); }
  const p2 = JSON.parse(sh('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height', '-of', 'json', norm]).stdout || '{}');
  const v2 = (p2.streams || []).find((s) => s.codec_type === 'video') || {};
  info.video_normalizado = norm; info.largura = v2.width; info.altura = v2.height; info.fps = 30; info.rotacao_original = rot || 'fps';
  fs.writeFileSync(path.join(work, 'info.json'), JSON.stringify(info, null, 2));
  console.log('vídeo normalizado (use este nos próximos passos):', norm, v2.width + 'x' + v2.height);
}

// 2) áudio 16 kHz mono
const wav = path.join(work, 'audio16.wav');
sh('ffmpeg', ['-v', 'error', '-y', '-i', video, '-ar', '16000', '-ac', '1', wav]);

// 3) silêncios
const sd = sh('ffmpeg', ['-i', wav, '-af', 'silencedetect=noise=-32dB:d=0.35', '-f', 'null', '-']);
const sil = []; let cur = null;
for (const m of (sd.stderr || '').matchAll(/silence_(start|end): ([0-9.]+)/g)) {
  if (m[1] === 'start') cur = +m[2]; else if (cur !== null) { sil.push({ ini: cur, fim: +m[2] }); cur = null; }
}
fs.writeFileSync(path.join(work, 'silencios.json'), JSON.stringify(sil, null, 2));
console.log('silêncios >0,35 s:', sil.length);

// 4) transcrição com palavras (modelo local Parakeet via hyperframes)
const tr = sh('npx', ['--yes', 'hyperframes@0.8.181', 'transcribe', wav, '--language', lang, '--json'], { timeout: 900000 });
const out = (tr.stdout || '').split(/\r?\n/);
let words = null;
for (const line of out) {
  if (line.startsWith('{"type":"words"')) { try { words = JSON.parse(line).words; } catch {} }
  if (!words && line.includes('"transcriptPath"')) {
    try { const p = JSON.parse(line).transcriptPath; const arr = JSON.parse(fs.readFileSync(p, 'utf8')); words = arr.map((x) => ({ text: x.text, start: x.start, end: x.end })); } catch {}
  }
}
if (!words) {
  console.error('Transcrição indisponível. Se o modelo não estiver instalado: npx hyperframes models install parakeet (~640 MB, peça licença antes).');
  console.error((tr.stdout || '').slice(-400));
  process.exit(2);
}
const palavras = words.map((x) => ({ w: x.text, t: +x.start, f: +x.end }));
fs.writeFileSync(path.join(work, 'palavras.json'), JSON.stringify(palavras, null, 2));

// 5) transcrição em frases com tempo
const frases = []; let atual = [];
const fecha = () => { if (atual.length) { frases.push(atual); atual = []; } };
palavras.forEach((p, i) => { const prev = atual[atual.length - 1]; if (prev && (p.t - prev.f > 0.6)) fecha(); atual.push(p); if (/[.!?]$/.test(p.w)) fecha(); if (i === palavras.length - 1) fecha(); });
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
const md = ['# Transcrição (tempo do vídeo bruto)', '', ...frases.map((f, i) => `${String(i + 1).padStart(2, '0')} [${fmt(f[0].t)}-${fmt(f[f.length - 1].f)}] ${f.map((x) => x.w).join(' ')}`)].join('\n');
fs.writeFileSync(path.join(work, 'transcricao.md'), md + '\n');
console.log('palavras:', palavras.length, '· frases:', frases.length, '· salvo em', work);
