// Modo rápido (sem /design): gera PNGs simples a partir de um conteudo.json, com a identidade do projeto.
// Uso: node render.mjs <caminho/conteudo.json> [slug-do-projeto]
// O slug também pode vir do campo "projeto" do JSON. Identidade em ~/.claude/conteudo/<slug>/visual.json.
// Gera story-XX.png (1080x1920) e post-XX.png (1080x1350) na pasta do JSON, mais folha.png (visão geral).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const jsonPath = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(jsonPath)) { console.error('uso: node render.mjs <conteudo.json> [slug]'); process.exit(1); }
const OUT = path.dirname(jsonPath);
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const slug = process.argv[3] || data.projeto;
if (!slug) { console.error('informe o slug do projeto (2º argumento ou campo "projeto" no JSON)'); process.exit(1); }
const PDIR = path.join(os.homedir(), '.claude', 'conteudo', slug);
if (!fs.existsSync(path.join(PDIR, 'visual.json'))) { console.error('projeto sem visual.json:', PDIR); process.exit(1); }
const V = JSON.parse(fs.readFileSync(path.join(PDIR, 'visual.json'), 'utf8'));
const PJ = fs.existsSync(path.join(PDIR, 'projeto.json')) ? JSON.parse(fs.readFileSync(path.join(PDIR, 'projeto.json'), 'utf8')) : {};

const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome/Edge não encontrado (defina CHROME_PATH).'); process.exit(1); }

const logoFile = V.logo ? path.join(PDIR, V.logo) : '';
const LOGO = logoFile && fs.existsSync(logoFile) ? 'data:image/png;base64,' + fs.readFileSync(logoFile).toString('base64') : '';
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = (s = '') => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
const THEMES = V.temas;
const TKEYS = Object.keys(THEMES);
const F = V.fontes || {};
const FT = F.titulo || 'sans-serif', FX = F.texto || 'sans-serif';
const site = PJ.site || '';

function body(it) {
  const T = it.titulo ? `<h1>${rich(it.titulo)}</h1>` : '';
  const K = it.kicker ? `<div class="kicker">${esc(it.kicker)}</div>` : '';
  const S = it.sub ? `<p class="sub">${rich(it.sub)}</p>` : '';
  switch (it.layout) {
    case 'lista':
      return `${K}${T}<ul class="lista">${(it.itens || []).map((x, i) => `<li><span class="n">${i + 1}</span><span>${rich(x)}</span></li>`).join('')}</ul>${S}`;
    case 'comparativo': {
      const col = (c, cls) => `<div class="col ${cls}"><div class="ct">${esc(c?.titulo || '')}</div>${(c?.itens || []).map((x) => `<div class="ci">${rich(x)}</div>`).join('')}</div>`;
      return `${K}${T}<div class="cols">${col(it.esq, 'neg')}${col(it.dir, 'pos')}</div>${S}`;
    }
    case 'passo':
      return `<div class="big">${esc(it.numero ?? '1')}</div>${T}${S}`;
    case 'enquete':
      return `${K}${T}<div class="poll"><div class="pq">ENQUETE</div>${(it.opcoes || []).slice(0, 2).map((o) => `<div class="po">${esc(o)}</div>`).join('')}</div>`;
    case 'cta':
      return `${K}${T}${S}<div class="btn">${esc(it.botao || 'Saiba mais')}</div>${site ? `<div class="url">${esc(site)}</div>` : ''}`;
    default:
      return `${K}${T}${S}`;
  }
}

function html(it) {
  const th = THEMES[it.tema] || THEMES[TKEYS[0]];
  const story = it.formato === 'story';
  const W = 1080, H = story ? 1920 : 1350;
  const pad = story ? '270px 90px 380px 90px' : '90px';
  const tsize = it.layout === 'passo' ? 92 : story ? 100 : 92;
  const wm = V.wordmark || { a: PJ.nome || '', b: '' };
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${F.google ? `<link rel="stylesheet" href="${F.google}">` : ''}
<style>
*{box-sizing:border-box;margin:0;padding:0} html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:${th.bg};color:${th.fg};font-family:'${FX}',sans-serif;position:relative}
.top{position:absolute;left:90px;top:${story ? 130 : 80}px;display:flex;align-items:center;gap:16px}
.top img{width:70px;height:70px;object-fit:contain}.top b{font-family:'${FT}';font-weight:800;font-size:38px;letter-spacing:-1px}.top b i{font-style:normal;color:${th.acc}}
.c{position:absolute;inset:0;padding:${pad};display:flex;flex-direction:column;justify-content:center;gap:34px}
.kicker{font-weight:800;font-size:30px;letter-spacing:4px;color:${th.acc}}
h1{font-family:'${FT}';font-weight:800;font-size:${tsize}px;line-height:.98;letter-spacing:-3px}
h1 em,.sub em,.lista em{font-style:normal;color:${th.acc}}
.sub{font-weight:700;font-size:${story ? 44 : 40}px;line-height:1.25;color:${th.mut}}
.lista{list-style:none;display:flex;flex-direction:column;gap:22px}
.lista li{display:flex;gap:26px;align-items:center;background:${th.card};border:2px solid ${th.line};border-radius:34px;padding:26px 32px;font-weight:700;font-size:${story ? 42 : 38}px;line-height:1.2}
.lista .n{flex:none;width:66px;height:66px;border-radius:33px;background:${th.acc};color:${th.btnFg};display:flex;align-items:center;justify-content:center;font-family:'${FT}';font-weight:800;font-size:38px}
.cols{display:flex;gap:24px}.col{flex:1;border-radius:36px;padding:30px;display:flex;flex-direction:column;gap:18px;border:3px solid ${th.line};background:${th.card}}
.col.pos{border-color:${th.acc}}.ct{font-family:'${FT}';font-weight:800;font-size:40px;line-height:1}.col.neg .ct{opacity:.7}.col.pos .ct{color:${th.acc}}
.ci{font-weight:700;font-size:${story ? 36 : 33}px;line-height:1.22}
.big{font-family:'${FT}';font-weight:800;font-size:340px;line-height:.8;letter-spacing:-12px;color:${th.acc}}
.poll{background:${th.card};border:3px solid ${th.line};border-radius:44px;padding:36px;display:flex;flex-direction:column;gap:22px}
.pq{font-weight:800;font-size:28px;letter-spacing:4px;color:${th.mut};text-align:center}
.po{border-radius:30px;border:3px solid ${th.acc};padding:30px;text-align:center;font-family:'${FT}';font-weight:800;font-size:54px}
.btn{align-self:flex-start;background:${th.btnBg};color:${th.btnFg};font-weight:800;font-size:50px;padding:30px 60px;border-radius:70px;margin-top:10px}
.url{font-weight:800;font-size:42px;color:${th.acc}}
.foot{position:absolute;left:90px;right:90px;bottom:${story ? 360 : 70}px;display:flex;justify-content:space-between;font-weight:800;font-size:28px;color:${th.mut}}
</style></head><body>
<div class="top">${LOGO ? `<img src="${LOGO}">` : ''}<b>${esc(wm.a)}<i>${esc(wm.b || '')}</i></b></div>
<div class="c">${body(it)}</div>
${story ? '' : `<div class="foot"><span>${esc(site)}</span><span>${esc(it.rodape || '')}</span></div>`}
</body></html>`;
}

function shot(htmlPath, png, W, H) {
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--virtual-time-budget=8000', `--screenshot=${png}`, pathToFileURL(htmlPath).href], { encoding: 'utf8', timeout: 90000 });
  if (!fs.existsSync(png)) { console.error('falhou:', png, r.stderr?.slice(0, 300)); process.exit(1); }
}

const tmp = path.join(OUT, '_html'); fs.mkdirSync(tmp, { recursive: true });
const done = [];
for (const it of data.itens) {
  const story = it.formato === 'story';
  const W = 1080, H = story ? 1920 : 1350;
  const hp = path.join(tmp, it.id + '.html'); fs.writeFileSync(hp, html(it));
  const png = path.join(OUT, it.id + '.png'); shot(hp, png, W, H);
  done.push({ id: it.id, png, story }); console.log('ok', it.id);
}
const sheet = path.join(tmp, 'folha.html');
const cells = done.map((d) => `<div class="c"><img src="${pathToFileURL(d.png).href}"><span>${d.id}</span></div>`).join('');
fs.writeFileSync(sheet, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;font-family:sans-serif;display:flex;flex-wrap:wrap;gap:14px;padding:14px;width:1860px}.c{position:relative}.c img{display:block;height:640px;border-radius:10px}.c span{position:absolute;left:8px;top:8px;background:#000a;color:#fff;font-size:18px;padding:2px 8px;border-radius:6px}</style>${cells}`);
shot(sheet, path.join(OUT, 'folha.png'), 1888, 1960);
console.log('pronto:', OUT);
