import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import type { Edit, Overlay, Palavra } from './tipos';

const { fontFamily: INTER } = loadInter('normal', { weights: ['600', '800', '900'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: MONO } = loadMono('normal', { weights: ['500', '700'], subsets: ['latin', 'latin-ext'] });

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
const STROKE = { WebkitTextStroke: '10px rgba(0,0,0,.85)', paintOrder: 'stroke fill' } as React.CSSProperties;

type Th = { bg: string; fg: string; acc: string; acc2: string; card: string; muted: string };
type Ctx = { fps: number; th: Th; dur: number };
const defaultTheme: Th = { bg: '#0B1020', fg: '#EAF0FF', acc: '#6C8CFF', acc2: '#B26CFF', card: '#131A33', muted: '#9AA7CC' };
const sp = (f: number, at: number, fps: number, cfg: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
  spring({ frame: f - Math.round(at * fps), fps, config: { damping: 13, stiffness: 180, mass: 0.7, ...cfg } });

// Texto com *destaque*
const Rico: React.FC<{ s: string; cor: string }> = ({ s, cor }) => (
  <>{s.split(/(\*[^*]+\*)/g).map((p, i) => (p.startsWith('*') ? <span key={i} style={{ color: cor }}>{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}</>
);

// ---------- fundo (aparece atrás do apresentador quando ele vira janelinha)
const Fundo: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const d = Math.sin(f / 70) * 70;
  return (
    <AbsoluteFill style={{ background: ctx.th.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${-100 + d}px 260px, ${ctx.th.acc}55, transparent 62%), radial-gradient(1000px 1000px at ${1180 - d}px 1700px, ${ctx.th.acc2}44, transparent 62%)` }} />
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${ctx.th.fg}10 2px, transparent 2px), linear-gradient(90deg, ${ctx.th.fg}10 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0px ${(f * 0.7) % 90}px` }} />
    </AbsoluteFill>
  );
};

// ---------- vídeo do apresentador: quadro inteiro, jump cuts, zooms, correção de cor e janelinha 9:16 (sem cortar)
const PIP = { left: 696, top: 930, w: 336, h: 597, r: 34 };
const Video: React.FC<{ edit: Edit; pip: number; bump: number; ctx: Ctx }> = ({ edit, pip, bump, ctx }) => {
  const f = useCurrentFrame();
  const t = f / ctx.fps;
  let js = 1, jx = 0.5, jy = 0.42;
  for (const j of edit.jumpcuts || []) if (t >= j.t) { js = j.escala; jx = j.x ?? 0.5; jy = j.y ?? 0.42; }
  let zs = 1;
  for (const z of edit.zooms || []) {
    const k = easeOut(Math.min(clamp((t - z.t) / 0.3), clamp((z.t + z.d - t) / 0.3)));
    if (k > 0) { zs += ((z.escala || 1.15) - 1) * k; jx = z.x ?? jx; jy = z.y ?? jy; }
  }
  for (const pt of edit.punch || []) { const u = t - pt; if (u >= 0 && u < 0.5) zs += 0.09 * Math.sin(Math.PI * Math.min(1, u / 0.5)) * (1 - u); }
  const W = edit.largura || 1080, H = edit.altura || 1920;
  const B = edit.faixa || { left: 0, top: 0, w: W, h: H, r: 0, posY: 50 };
  const L = (a: number, b: number) => a + (b - a) * pip;
  const cor = edit.acabamento?.cor !== false;
  const moldura = pip > 0.01 || !!edit.faixa;
  return (
    <div style={{ position: 'absolute', left: L(B.left, PIP.left), top: L(B.top, PIP.top), width: L(B.w, PIP.w), height: L(B.h, PIP.h), borderRadius: L(B.r, PIP.r), overflow: 'hidden',
      border: moldura ? `4px solid ${ctx.th.acc}` : 'none', boxShadow: moldura ? `0 0 0 8px ${ctx.th.acc}22, 0 30px 90px rgba(0,0,0,.6), 0 0 80px ${ctx.th.acc}55` : 'none' }}>
      <div style={{ width: '100%', height: '100%', transform: `scale(${js * zs * (1 + bump * 0.06)})`, transformOrigin: `${jx * 100}% ${jy * 100}%` }}>
        <OffthreadVideo src={staticFile(edit.video)} style={{ width: '100%', height: '100%', objectFit: edit.ajuste || 'cover', objectPosition: `50% ${B.posY ?? 50}%`, filter: cor ? 'contrast(1.07) saturate(1.14) brightness(1.02)' : 'none' }} />
      </div>
    </div>
  );
};

// ---------- legendas palavra a palavra, com a palavra falada numa pílula
type Chunk = { palavras: Palavra[]; ini: number; fim: number };
const agrupar = (ps: Palavra[], max = 3): Chunk[] => {
  const out: Chunk[] = []; let cur: Palavra[] = [];
  const flush = () => { if (cur.length) { out.push({ palavras: cur, ini: cur[0].t, fim: cur[cur.length - 1].f }); cur = []; } };
  ps.forEach((p, i) => {
    const prev = cur[cur.length - 1];
    if (prev && (p.t - prev.f > 0.45 || cur.length >= max || /[.!?,]$/.test(prev.w))) flush();
    cur.push(p);
    if (i === ps.length - 1) flush();
  });
  return out;
};
const Legendas: React.FC<{ edit: Edit; pip: number; esconder: number; ctx: Ctx }> = ({ edit, pip, esconder, ctx }) => {
  const f = useCurrentFrame(); const t = f / ctx.fps;
  const cfg = edit.legendas;
  const chunks = React.useMemo(() => agrupar(cfg?.palavras || [], cfg?.max || 3), [cfg]);
  if (!cfg || cfg.ativo === false || esconder > 0.5) return null;
  const c = chunks.find((x) => t >= x.ini - 0.05 && t <= x.fim + 0.2);
  if (!c) return null;
  const s = sp(f, c.ini - 0.05, ctx.fps, { damping: 14, stiffness: 240, mass: 0.6 });
  const emPip = pip > 0.5;
  const dest = (cfg.destaques || []).map((d) => d.toLowerCase());
  const tam = emPip ? 60 : cfg.tamanho || 80;
  const box: React.CSSProperties = emPip
    ? { left: 50, width: 620, top: 1000, justifyContent: 'flex-start', textAlign: 'left' }
    : { left: 50, right: 50, top: cfg.top ?? (cfg.posicao === 'meio' ? 960 : 1330), justifyContent: 'center', textAlign: 'center' };
  return (
    <div style={{ position: 'absolute', ...box, display: 'flex', flexWrap: 'wrap', gap: '10px 22px', fontFamily: INTER, fontWeight: 900, fontSize: tam, lineHeight: 1.05, transform: `translateY(${(1 - Math.min(1, s)) * 24}px) scale(${0.9 + 0.1 * Math.min(1.05, s)})`, opacity: clamp(s * 2) }}>
      {c.palavras.map((p, i) => {
        const ativa = t >= p.t - 0.03 && t <= p.f + 0.06;
        const txt = cfg.maiuscula === false ? p.w : p.w.toUpperCase();
        const especial = dest.includes(p.w.toLowerCase().replace(/[.,!?]/g, ''));
        const est = cfg.estilo || 'pilula';
        if (est === 'karaoke') return <span key={i} style={{ color: t >= p.t - 0.03 ? (especial ? ctx.th.acc2 : ctx.th.acc) : '#fff', ...STROKE, textShadow: '0 6px 0 rgba(0,0,0,.4)', display: 'inline-block', padding: '2px 0 6px', transform: ativa ? 'scale(1.1)' : 'none' }}>{txt}</span>;
        if (est === 'caixa') return <span key={i} style={{ color: ativa ? (especial ? ctx.th.acc2 : ctx.th.acc) : '#fff', background: 'rgba(0,0,0,.78)', padding: '4px 14px 8px', borderRadius: 12, display: 'inline-block' }}>{txt}</span>;
        if (ativa) return <span key={i} style={{ background: especial ? ctx.th.acc2 : ctx.th.acc, color: '#060914', padding: '2px 16px 6px', borderRadius: 18, transform: 'rotate(-2deg) scale(1.06)', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>{txt}</span>;
        return <span key={i} style={{ color: especial ? ctx.th.acc2 : '#fff', ...STROKE, textShadow: '0 6px 0 rgba(0,0,0,.4)', display: 'inline-block', padding: '2px 0 6px' }}>{txt}</span>;
      })}
      {(() => { const em = c.palavras.map((p) => cfg.emojis?.[p.w.toLowerCase().replace(/[.,!?]/g, '')]).find(Boolean); if (!em) return null;
        const k = sp(f, c.ini, ctx.fps, { damping: 9, stiffness: 220 });
        return <span style={{ fontSize: tam * 1.05, display: 'inline-block', transform: `scale(${Math.min(1.15, k)}) rotate(${(1 - Math.min(1, k)) * 30}deg)` }}>{em}</span>; })()}
    </div>
  );
};

// ---------- overlays
const useJanela = (t0: number, d: number, ctx: Ctx) => {
  const f = useCurrentFrame(); const t = f / ctx.fps;
  const s = sp(f, t0, ctx.fps);
  const out = clamp((t0 + d - t) / 0.25);
  return { f, t, s, op: clamp(s * 2) * out, sai: 1 - out };
};
const Vidro: React.FC<{ ctx: Ctx; style?: React.CSSProperties; children: React.ReactNode }> = ({ ctx, style, children }) => (
  <div style={{ background: `linear-gradient(160deg, ${ctx.th.card}F2, ${ctx.th.bg}F2)`, border: `2px solid ${ctx.th.acc}77`, borderRadius: 36, boxShadow: `0 30px 90px rgba(0,0,0,.55), 0 0 60px ${ctx.th.acc}33`, ...style }}>{children}</div>
);

const Titulo: React.FC<{ o: Extract<Overlay, { tipo: 'titulo' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, s, op, sai } = useJanela(o.t, o.d, ctx);
  const top = o.posicao === 'meio' ? 760 : 280;
  if (o.estilo === 'card') {
    return (
      <div style={{ position: 'absolute', left: 60, right: 60, top, opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * -50}px)` }}>
        <Vidro ctx={ctx} style={{ padding: '30px 40px', borderLeft: `12px solid ${ctx.th.acc}` }}>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, lineHeight: 1, color: ctx.th.fg, letterSpacing: -2 }}><Rico s={o.texto} cor={ctx.th.acc} /></div>
          {o.sub && <div style={{ marginTop: 14, fontFamily: INTER, fontWeight: 600, fontSize: 36, color: ctx.th.muted }}>{o.sub}</div>}
        </Vidro>
      </div>
    );
  }
  const palavras = o.texto.split(' ');
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, opacity: 1 - sai, transform: `translateY(${sai * -30}px)` }}>
      {o.sub && (() => { const k = sp(f, o.t, ctx.fps, { damping: 12 }); return (
        <div style={{ display: 'inline-block', marginBottom: 16, background: ctx.th.acc, color: '#060914', fontFamily: INTER, fontWeight: 900, fontSize: 30, letterSpacing: 3, textTransform: 'uppercase', padding: '8px 20px', borderRadius: 12, transform: `scale(${Math.min(1.05, k)}) rotate(-2deg)`, opacity: clamp(k * 2) }}>{o.sub}</div>
      ); })()}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 22px', fontFamily: INTER, fontWeight: 900, fontSize: 86, lineHeight: 1.02, letterSpacing: -2 }}>
        {palavras.map((w, i) => {
          const k = sp(f, o.t + 0.12 + i * 0.07, ctx.fps, { damping: 12, stiffness: 200 });
          const dest = w.startsWith('*');
          return <span key={i} style={{ color: dest ? ctx.th.acc2 : '#fff', ...STROKE, textShadow: '0 8px 0 rgba(0,0,0,.35)', display: 'inline-block', opacity: clamp(k * 2), transform: `translateY(${(1 - Math.min(1, k)) * 50}px) rotate(${(1 - Math.min(1, k)) * 6}deg)` }}>{w.replace(/\*/g, '')}</span>;
        })}
      </div>
    </div>
  );
};

const PalavraGigante: React.FC<{ o: Extract<Overlay, { tipo: 'palavra' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, t, op } = useJanela(o.t, o.d, ctx);
  const fill = easeIO(clamp((t - o.t - 0.25) / 0.6));
  const tam = Math.min(190, Math.floor(1800 / Math.max(4, o.texto.length)));
  const letras = o.texto.split('');
  const camada = (cheio: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'center', fontFamily: INTER, fontWeight: 900, fontSize: tam, letterSpacing: -4, lineHeight: 1 }}>
      {letras.map((l, i) => { const k = sp(f, o.t + i * 0.035, ctx.fps, { damping: 11, stiffness: 220 });
        return <span key={i} style={{ display: 'inline-block', color: cheio ? ctx.th.acc : 'transparent', WebkitTextStroke: cheio ? '0' : `4px ${ctx.th.acc}`, transform: `translateY(${(1 - Math.min(1, k)) * 80}px) scale(${0.6 + 0.4 * Math.min(1.08, k)})`, opacity: clamp(k * 2) }}>{l === ' ' ? ' ' : l}</span>; })}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, opacity: op, filter: `drop-shadow(0 10px 30px rgba(0,0,0,.5))` }}>
      {camada(false)}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}>{camada(true)}</div>
    </div>
  );
};

const Terminal: React.FC<{ o: Extract<Overlay, { tipo: 'terminal' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, t, s, op } = useJanela(o.t, o.d, ctx);
  const cps = o.cps || 30;
  const local = Math.max(0, t - o.t - 0.4);
  let clock = 0; const shown: { l: (typeof o.linhas)[number]; chars: number; vis: boolean; typing: boolean }[] = [];
  for (const l of o.linhas) {
    const dur = l.tipo === 'cmd' ? l.texto.length / cps : 0.22;
    const k = clamp((local - clock) / dur);
    shown.push({ l, chars: l.tipo === 'cmd' ? Math.floor(k * l.texto.length) : l.texto.length, vis: local >= clock, typing: l.tipo === 'cmd' && k > 0 && k < 1 });
    clock += dur + (l.tipo === 'cmd' ? 0.3 : 0.12);
  }
  const cor = { cmd: ctx.th.fg, out: ctx.th.muted, ok: '#3BE38B', dim: '#5d6788' } as const;
  const piscar = Math.floor(f / 8) % 2 === 0;
  const ultimo = [...shown].reverse().find((x) => x.vis);
  return (
    <div style={{ position: 'absolute', left: 44, right: 44, top: 270, opacity: op, transform: `perspective(1400px) rotateX(${(1 - Math.min(1, s)) * 18}deg) translateY(${(1 - Math.min(1, s)) * 90}px) scale(${0.94 + 0.06 * Math.min(1, s)})` }}>
      <Vidro ctx={ctx} style={{ background: '#070B17F7', overflow: 'hidden', borderRadius: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 26px', background: '#0E1428', borderBottom: `2px solid ${ctx.th.acc}33` }}>
          {['#FF5F56', '#FFBD2E', '#27C93F'].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
          <div style={{ marginLeft: 14, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: ctx.th.fg }}>{o.titulo || 'Claude Code'}</div>
          <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 22, color: '#060914', background: ctx.th.acc, padding: '4px 12px', borderRadius: 10, fontWeight: 700 }}>ao vivo</div>
        </div>
        <div style={{ padding: '26px 30px 30px', minHeight: 380, fontFamily: MONO, fontWeight: 500, fontSize: 31, lineHeight: 1.42 }}>
          {shown.map(({ l, chars, vis }, i) => vis ? (
            <div key={i} style={{ color: cor[l.tipo], marginBottom: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', textShadow: l.tipo === 'ok' ? '0 0 18px #3BE38B66' : 'none' }}>
              {l.tipo === 'cmd' && <span style={{ color: ctx.th.acc, fontWeight: 700 }}>{'❯ '}</span>}
              {l.tipo === 'ok' && <span>{'✓ '}</span>}
              {l.texto.slice(0, chars)}
              {ultimo && ultimo.l === l && piscar && <span style={{ display: 'inline-block', width: 16, height: 32, background: ctx.th.acc, marginLeft: 4, verticalAlign: 'middle' }} />}
            </div>
          ) : null)}
        </div>
      </Vidro>
    </div>
  );
};

const Lista: React.FC<{ o: Extract<Overlay, { tipo: 'lista' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, s, op } = useJanela(o.t, o.d, ctx);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 280, opacity: op }}>
      {o.titulo && <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 70, color: '#fff', ...STROKE, letterSpacing: -2, marginBottom: 24, transform: `translateY(${(1 - Math.min(1, s)) * 40}px)` }}><Rico s={o.titulo} cor={ctx.th.acc2} /></div>}
      {o.itens.map((it, i) => {
        const k = sp(f, o.t + 0.3 + i * 0.32, ctx.fps, { damping: 12, stiffness: 200, mass: 0.6 });
        const chk = clamp((f / ctx.fps - (o.t + 0.45 + i * 0.32)) / 0.25);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18, padding: '22px 28px', borderRadius: 28, background: `linear-gradient(90deg, ${ctx.th.card}F5, ${ctx.th.bg}E6)`, border: `2px solid ${ctx.th.acc}55`, boxShadow: '0 16px 40px rgba(0,0,0,.4)', opacity: clamp(k * 2), transform: `translateX(${(1 - Math.min(1, k)) * -160}px)` }}>
            <div style={{ flex: 'none', width: 62, height: 62, borderRadius: 31, background: `linear-gradient(135deg, ${ctx.th.acc}, ${ctx.th.acc2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#060914', fontWeight: 900, fontSize: 38, transform: `scale(${0.4 + 0.6 * chk})` }}>✓</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, lineHeight: 1.1, color: ctx.th.fg }}>{it}</div>
          </div>
        );
      })}
    </div>
  );
};

const Passos: React.FC<{ o: Extract<Overlay, { tipo: 'passos' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, t, op } = useJanela(o.t, o.d, ctx);
  const n = o.itens.length; const passo = 0.55;
  const prog = clamp((t - o.t - 0.3) / (passo * n));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 280, opacity: op }}>
      {o.titulo && <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 66, color: '#fff', ...STROKE, marginBottom: 26, letterSpacing: -2 }}><Rico s={o.titulo} cor={ctx.th.acc2} /></div>}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 38, top: 40, width: 6, height: (n - 1) * 118, background: `${ctx.th.fg}22`, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: 38, top: 40, width: 6, height: (n - 1) * 118 * prog, background: `linear-gradient(${ctx.th.acc}, ${ctx.th.acc2})`, borderRadius: 3, boxShadow: `0 0 20px ${ctx.th.acc}` }} />
        {o.itens.map((it, i) => {
          const k = sp(f, o.t + 0.3 + i * passo, ctx.fps, { damping: 12 });
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26, height: 118, opacity: clamp(k * 2) }}>
              <div style={{ flex: 'none', width: 82, height: 82, borderRadius: 41, background: ctx.th.bg, border: `5px solid ${ctx.th.acc}`, color: '#fff', fontFamily: INTER, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${Math.min(1.1, k)})`, boxShadow: `0 0 30px ${ctx.th.acc}66` }}>{i + 1}</div>
              <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, color: '#fff', ...STROKE, transform: `translateX(${(1 - Math.min(1, k)) * 60}px)` }}>{it}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GitHub: React.FC<{ o: Extract<Overlay, { tipo: 'github' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, t, s, op } = useJanela(o.t, o.d, ctx);
  const [dono, nome] = o.repo.split('/');
  const pulso = 1 + Math.max(0, Math.sin((t - o.t) * 6)) * 0.04;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 290, opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * 90}px) rotate(${(1 - Math.min(1, s)) * -3}deg)` }}>
      <Vidro ctx={ctx} style={{ padding: '34px 36px', background: '#0D1117F7', borderColor: '#30363D' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="48" height="48" viewBox="0 0 16 16"><path fill="#8B949E" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" /></svg>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 40, color: '#58A6FF' }}>{dono} / <b style={{ fontWeight: 900 }}>{nome}</b></div>
          <div style={{ marginLeft: 'auto', fontFamily: INTER, fontWeight: 700, fontSize: 24, color: '#8B949E', border: '2px solid #30363D', borderRadius: 30, padding: '4px 14px' }}>Public</div>
        </div>
        {o.desc && <div style={{ marginTop: 20, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: '#C9D1D9', lineHeight: 1.3 }}>{o.desc}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
          {(o.chips || []).map((c, i) => { const k = sp(f, o.t + 0.4 + i * 0.15, ctx.fps, { damping: 10 }); return <div key={i} style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#58A6FF', background: '#388BFD26', padding: '8px 18px', borderRadius: 30, transform: `scale(${Math.min(1.1, k)})`, opacity: clamp(k * 2) }}>{c}</div>; })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, color: '#fff', background: '#238636', padding: '16px 30px', borderRadius: 16, transform: `scale(${pulso})`, boxShadow: '0 0 40px #23863688' }}>⤓ Code</div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, color: '#C9D1D9', background: '#21262D', border: '2px solid #30363D', padding: '14px 28px', borderRadius: 16 }}>☆ Star</div>
        </div>
      </Vidro>
    </div>
  );
};

const Numero: React.FC<{ o: Extract<Overlay, { tipo: 'numero' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { t, s, op } = useJanela(o.t, o.d, ctx);
  const alvo = parseFloat(o.numero.replace(',', '.'));
  const k = easeOut(clamp((t - o.t) / 0.7));
  const n = isNaN(alvo) ? o.numero : o.numero.replace(/[\d.,]+/, String(Math.round(alvo * k)));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', opacity: op, transform: `scale(${0.7 + 0.3 * Math.min(1.05, s)})` }}>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 260, lineHeight: 0.9, color: ctx.th.acc, letterSpacing: -10, ...STROKE, filter: `drop-shadow(0 0 40px ${ctx.th.acc}88)` }}>{n}</div>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: '#fff', marginTop: 6, ...STROKE }}>{o.rotulo}</div>
    </div>
  );
};

const Callout: React.FC<{ o: Extract<Overlay, { tipo: 'callout' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { t, s, op } = useJanela(o.t, o.d, ctx);
  const bob = Math.sin((t - o.t) * 5) * 6;
  return (
    <div style={{ position: 'absolute', left: (o.x ?? 0.5) * 1080, top: (o.y ?? 0.2) * 1920 + bob, transform: `translate(-50%, -50%) scale(${0.5 + 0.5 * Math.min(1.12, s)}) rotate(-3deg)`, opacity: op }}>
      <div style={{ background: `linear-gradient(90deg, ${ctx.th.acc}, ${ctx.th.acc2})`, color: '#060914', fontFamily: INTER, fontWeight: 900, fontSize: 56, padding: '18px 38px', borderRadius: 60, boxShadow: `0 20px 50px rgba(0,0,0,.45), 0 0 40px ${ctx.th.acc}66`, whiteSpace: 'nowrap' }}>{o.texto}</div>
      <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderTop: `22px solid ${ctx.th.acc2}` }} />
    </div>
  );
};

const Imagem: React.FC<{ o: Extract<Overlay, { tipo: 'imagem' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { s, op } = useJanela(o.t, o.d, ctx);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 280, opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * 80}px) rotate(${(1 - Math.min(1, s)) * -4}deg)` }}>
      <Vidro ctx={ctx} style={{ overflow: 'hidden', padding: 0 }}>
        <Img src={staticFile(o.arquivo)} style={{ width: '100%', display: 'block' }} />
        {o.legenda && <div style={{ padding: '20px 28px', fontFamily: INTER, fontWeight: 800, fontSize: 38, color: ctx.th.fg }}>{o.legenda}</div>}
      </Vidro>
    </div>
  );
};

const VideoInset: React.FC<{ o: Extract<Overlay, { tipo: 'video' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { s, op } = useJanela(o.t, o.d, ctx);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 280, opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * 80}px) scale(${0.94 + 0.06 * Math.min(1, s)})` }}>
      <Vidro ctx={ctx} style={{ overflow: 'hidden', padding: 0 }}>
        <Sequence from={Math.round(o.t * ctx.fps)} layout="none">
          <OffthreadVideo src={staticFile(o.arquivo)} startFrom={Math.round((o.inicio || 0) * ctx.fps)} volume={o.volume ?? 0} style={{ width: '100%', display: 'block', maxHeight: 640, objectFit: 'contain', background: '#000' }} />
        </Sequence>
        {o.legenda && <div style={{ padding: '18px 26px', fontFamily: INTER, fontWeight: 800, fontSize: 36, color: ctx.th.fg }}>{o.legenda}</div>}
      </Vidro>
    </div>
  );
};

const Emoji: React.FC<{ o: Extract<Overlay, { tipo: 'emoji' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { t, s, op } = useJanela(o.t, o.d, ctx);
  const bob = Math.sin((t - o.t) * 4) * 10;
  const tam = o.tamanho || 170;
  return (
    <div style={{ position: 'absolute', left: (o.x ?? 0.78) * 1080, top: (o.y ?? 0.3) * 1920 + bob, transform: `translate(-50%, -50%) scale(${0.3 + 0.7 * Math.min(1.15, s)}) rotate(${(1 - Math.min(1, s)) * -25 + Math.sin((t - o.t) * 3) * 6}deg)`, opacity: op, fontSize: tam, lineHeight: 1, filter: 'drop-shadow(0 14px 24px rgba(0,0,0,.5))' }}>{o.emoji}</div>
  );
};

const Comparativo: React.FC<{ o: Extract<Overlay, { tipo: 'comparativo' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, s, op } = useJanela(o.t, o.d, ctx);
  const lado = (l: { rotulo?: string; itens: string[] }, bom: boolean, atraso: number) => {
    const k = sp(f, o.t + atraso, ctx.fps, { damping: 12 });
    return (
      <div style={{ flex: 1, borderRadius: 30, padding: '26px 24px', background: bom ? `linear-gradient(160deg, ${ctx.th.acc}33, ${ctx.th.card}F2)` : `${ctx.th.card}E6`, border: `3px solid ${bom ? ctx.th.acc : '#ffffff22'}`, opacity: clamp(k * 2), transform: `translateY(${(1 - Math.min(1, k)) * 70}px) scale(${bom ? 1 + 0.03 * Math.min(1, k) : 0.97})`, boxShadow: bom ? `0 0 50px ${ctx.th.acc}55` : 'none' }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, letterSpacing: 2, textTransform: 'uppercase', color: bom ? ctx.th.acc : ctx.th.muted, marginBottom: 16 }}>{l.rotulo || (bom ? 'Depois' : 'Antes')}</div>
        {l.itens.map((it, i) => { const k2 = sp(f, o.t + atraso + 0.25 + i * 0.22, ctx.fps, { damping: 12 });
          return <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, opacity: clamp(k2 * 2), fontFamily: INTER, fontWeight: 800, fontSize: 36, lineHeight: 1.15, color: bom ? ctx.th.fg : ctx.th.muted }}>
            <span style={{ color: bom ? '#3BE38B' : '#FF5F56', flex: 'none' }}>{bom ? '✓' : '✗'}</span><span style={{ textDecoration: bom ? 'none' : 'line-through', textDecorationColor: '#FF5F56' }}>{it}</span></div>; })}
      </div>
    );
  };
  return (
    <div style={{ position: 'absolute', left: 44, right: 44, top: 280, opacity: op }}>
      {o.titulo && <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: '#fff', ...STROKE, letterSpacing: -2, marginBottom: 22, transform: `translateY(${(1 - Math.min(1, s)) * 40}px)` }}><Rico s={o.titulo} cor={ctx.th.acc2} /></div>}
      <div style={{ display: 'flex', gap: 22 }}>{lado(o.antes, false, 0.15)}{lado(o.depois, true, 0.5 + o.antes.itens.length * 0.22)}</div>
    </div>
  );
};

const Progresso: React.FC<{ o: Extract<Overlay, { tipo: 'progresso' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { t, s, op } = useJanela(o.t, o.d, ctx);
  const k = easeIO(clamp((t - o.t - 0.3) / Math.max(0.6, o.d - 1.0)));
  const v = (o.de ?? 0) + ((o.ate ?? 100) - (o.de ?? 0)) * k;
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 320, opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * 50}px)` }}>
      <Vidro ctx={ctx} style={{ padding: '30px 34px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontWeight: 900, fontSize: 46, color: ctx.th.fg, marginBottom: 20 }}><span>{o.texto}</span><span style={{ color: ctx.th.acc }}>{Math.round(v)}%</span></div>
        <div style={{ height: 34, borderRadius: 17, background: '#ffffff1A', overflow: 'hidden' }}>
          <div style={{ width: `${v}%`, height: '100%', borderRadius: 17, background: `linear-gradient(90deg, ${ctx.th.acc}, ${ctx.th.acc2})`, boxShadow: `0 0 24px ${ctx.th.acc}` }} />
        </div>
      </Vidro>
    </div>
  );
};

const Cta: React.FC<{ o: Extract<Overlay, { tipo: 'cta' }>; ctx: Ctx }> = ({ o, ctx }) => {
  const { f, t, s, op } = useJanela(o.t, o.d, ctx);
  if (!o.palavra) {
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: o.y ?? 1090, textAlign: 'center', opacity: op, transform: `translateY(${(1 - Math.min(1, s)) * 80}px)` }}>
        <div style={{ display: 'inline-block', background: `linear-gradient(90deg, ${ctx.th.acc}, ${ctx.th.acc2})`, color: '#060914', fontFamily: INTER, fontWeight: 900, fontSize: 60, padding: '26px 56px', borderRadius: 70 }}>{o.texto}</div>
        {o.url && <div style={{ marginTop: 20, fontFamily: INTER, fontWeight: 800, fontSize: 38, color: '#fff', ...STROKE }}>{o.url}</div>}
      </div>
    );
  }
  // tela final: escurece o vídeo, palavra gigante e o comentário sendo digitado
  const typed = Math.floor(clamp((t - o.t - 0.7) / (o.palavra.length / 7)) * o.palavra.length);
  const enviado = t > o.t + 0.9 + o.palavra.length / 7;
  const k2 = sp(f, o.t + 0.9 + o.palavra.length / 7, ctx.fps, { damping: 10 });
  const big = sp(f, o.t + 0.2, ctx.fps, { damping: 10, stiffness: 160 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${ctx.th.bg}CC, ${ctx.th.bg}F2)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center' }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: ctx.th.fg, letterSpacing: -1, transform: `translateY(${(1 - Math.min(1, s)) * 40}px)` }}>{o.texto}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 210, lineHeight: 1, marginTop: 10, color: ctx.th.acc, letterSpacing: -8, transform: `scale(${0.5 + 0.5 * Math.min(1.08, big)}) rotate(${(1 - Math.min(1, big)) * -8}deg)`, filter: `drop-shadow(0 0 50px ${ctx.th.acc}99)` }}>{o.palavra}</div>
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 860, display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 60, padding: '18px 20px 18px 24px', boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${ctx.th.acc}, ${ctx.th.acc2})`, flex: 'none' }} />
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: typed ? '#111' : '#999' }}>
          {typed ? o.palavra.slice(0, typed) : 'Adicione um comentário...'}
          {!enviado && Math.floor(f / 8) % 2 === 0 && <span style={{ display: 'inline-block', width: 4, height: 40, background: '#111', marginLeft: 3, verticalAlign: 'middle' }} />}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: INTER, fontWeight: 900, fontSize: 34, color: typed ? ctx.th.acc : '#bbb' }}>Publicar</div>
      </div>
      {enviado && <div style={{ position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', transform: `scale(${Math.min(1.1, k2)})`, opacity: clamp(k2 * 2) }}>
        <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, color: '#060914', background: '#3BE38B', padding: '12px 28px', borderRadius: 40 }}>✓ Comentado! Eu te mando o link</span>
      </div>}
      {o.url && <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 32, color: ctx.th.muted }}>{o.url}</div>}
    </AbsoluteFill>
  );
};

const renderOverlay = (o: Overlay, ctx: Ctx, i: number) => {
  switch (o.tipo) {
    case 'titulo': return <Titulo key={i} o={o} ctx={ctx} />;
    case 'palavra': return <PalavraGigante key={i} o={o} ctx={ctx} />;
    case 'terminal': return <Terminal key={i} o={o} ctx={ctx} />;
    case 'lista': return <Lista key={i} o={o} ctx={ctx} />;
    case 'passos': return <Passos key={i} o={o} ctx={ctx} />;
    case 'github': return <GitHub key={i} o={o} ctx={ctx} />;
    case 'numero': return <Numero key={i} o={o} ctx={ctx} />;
    case 'callout': return <Callout key={i} o={o} ctx={ctx} />;
    case 'imagem': return <Imagem key={i} o={o} ctx={ctx} />;
    case 'video': return <VideoInset key={i} o={o} ctx={ctx} />;
    case 'emoji': return <Emoji key={i} o={o} ctx={ctx} />;
    case 'comparativo': return <Comparativo key={i} o={o} ctx={ctx} />;
    case 'progresso': return <Progresso key={i} o={o} ctx={ctx} />;
    case 'cta': return <Cta key={i} o={o} ctx={ctx} />;
  }
};

// ---------- transições e acabamento
const Transicoes: React.FC<{ edit: Edit; ctx: Ctx }> = ({ edit, ctx }) => {
  const t = useCurrentFrame() / ctx.fps;
  return (
    <>
      {(edit.transicoes || []).map((tr, i) => {
        const u = (t - tr.t) / 0.4;
        if (u < -0.6 || u > 0.6) return null;
        if (tr.tipo === 'flash') {
          const k = 1 - Math.abs(u) / 0.5;
          return k > 0 ? <AbsoluteFill key={i} style={{ background: `radial-gradient(circle at 50% 40%, #ffffff, ${ctx.th.acc} 45%, ${ctx.th.acc2})`, opacity: k * 0.55, mixBlendMode: 'screen' }} /> : null;
        }
        if (tr.tipo === 'zoom') { const k = 1 - Math.abs(u) / 0.5; return k > 0 ? <AbsoluteFill key={i} style={{ background: `radial-gradient(circle at 50% 42%, transparent ${35 - k * 25}%, ${ctx.th.bg}${Math.round(k * 200).toString(16).padStart(2, '0')} 75%)` }} /> : null; }
        if (tr.tipo === 'glitch') { const k = 1 - Math.abs(u) / 0.35; if (k <= 0) return null; const fr = Math.floor(t * ctx.fps);
          return <AbsoluteFill key={i} style={{ pointerEvents: 'none' }}>{[0, 1, 2, 3].map((n) => { const y = ((fr * 37 + n * 211) % 1700) + 100; return <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 18 + ((fr + n) % 3) * 22, background: n % 2 ? `${ctx.th.acc}AA` : `${ctx.th.acc2}88`, mixBlendMode: 'screen', opacity: k, transform: `translateX(${((fr * 13 + n * 50) % 120) - 60}px)` }} />; })}</AbsoluteFill>; }
        const x = interpolate(u, [-0.5, 0.5], [-1500, 1500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIO });
        return <div key={i} style={{ position: 'absolute', top: -300, left: x, width: 700, height: 2600, transform: 'rotate(18deg)', background: `linear-gradient(90deg, transparent, ${ctx.th.acc}EE, ${ctx.th.acc2}EE, transparent)`, filter: 'blur(6px)' }} />;
      })}
    </>
  );
};
const Acabamento: React.FC<{ edit: Edit; ctx: Ctx }> = ({ edit, ctx }) => {
  const t = useCurrentFrame() / ctx.fps;
  const a = edit.acabamento || {};
  return (
    <>
      {a.vinheta !== false && <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.5) 100%), linear-gradient(to bottom, rgba(0,0,0,.45) 0%, transparent 26%, transparent 64%, rgba(0,0,0,.45) 100%)', pointerEvents: 'none' }} />}
      {a.barra !== false && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 236, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
          <div style={{ width: `${clamp(t / ctx.dur) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${ctx.th.acc}, ${ctx.th.acc2})`, boxShadow: `0 0 12px ${ctx.th.acc}` }} />
        </div>
      )}
    </>
  );
};

// ---------- composição
export const Edicao: React.FC<{ edit: Edit | null }> = ({ edit }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!edit) return <AbsoluteFill style={{ background: '#000' }} />;
  const th = { ...defaultTheme, ...(edit.tema || {}) } as Th;
  const ctx: Ctx = { fps, th, dur: edit.duracao };
  const t = f / fps;
  let pip = 0, telaFinal = 0;
  for (const o of edit.overlays || []) {
    const k = easeIO(Math.min(clamp((t - o.t) / 0.35), clamp((o.t + o.d - t) / 0.35)));
    if ((o as any).pip) pip = Math.max(pip, k);
    if (o.tipo === 'cta' && (o as any).palavra && t >= o.t - 0.05 && t <= o.t + o.d) telaFinal = 1;
  }
  let bump = 0;
  for (const tr of edit.transicoes || []) { const u = Math.abs(t - tr.t) / 0.2; if (u < 1) bump = Math.max(bump, (1 - u) * (tr.tipo === 'zoom' ? 2.5 : 1)); }
  const ps = edit.legendas?.palavras || [];
  const falando = ps.some((p) => t >= p.t - 0.15 && t <= p.f + 0.35);
  const mus = edit.musica;
  const musVol = (mus?.volume ?? 0.12) * (mus?.abaixa === false ? 1 : falando ? 0.45 : 1) * interpolate(t, [0, 0.8, edit.duracao - 1.2, edit.duracao], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: th.bg, fontFamily: INTER }}>
      <Fundo ctx={ctx} />
      <Video edit={edit} pip={pip} bump={bump} ctx={ctx} />
      <Acabamento edit={edit} ctx={ctx} />
      {(edit.overlays || []).map((o, i) => (t >= o.t - 0.05 && t <= o.t + o.d + 0.3 ? renderOverlay(o, ctx, i) : null))}
      <Legendas edit={edit} pip={pip} esconder={telaFinal} ctx={ctx} />
      <Transicoes edit={edit} ctx={ctx} />
      {mus && <Audio src={staticFile(mus.arquivo)} volume={musVol} loop />}
      {(edit.sfx || []).map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={90}>
          <Audio src={staticFile('sfx/' + s.nome + '.wav')} volume={(s.g ?? 0.6) * 0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
