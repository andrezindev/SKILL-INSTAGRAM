// Gera um teleprompter (uma página HTML) a partir do reels.json, para a pessoa gravar lendo no computador ou no celular.
// Uso: node teleprompter.mjs <reels.json> [n-do-reel] [saida.html]
// Sem n: um teleprompter com todos os reels (abas). Abre em qualquer navegador, sem internet.
// Controles: espaço = rolar/pausar · ↑ ↓ = velocidade · + − = tamanho da letra · E = espelhar · R = voltar ao início · toque na tela = rolar/pausar.
import fs from 'node:fs';
import path from 'node:path';

const [arq, nArg, saidaArg] = process.argv.slice(2);
if (!arq) { console.error('uso: node teleprompter.mjs <reels.json> [n] [saida.html]'); process.exit(1); }
const dados = JSON.parse(fs.readFileSync(arq, 'utf8'));
const lista = Array.isArray(dados) ? dados : dados.reels || [];
const escolhidos = nArg && /^\d+$/.test(nArg) ? [lista[Number(nArg) - 1]].filter(Boolean) : lista;
if (!escolhidos.length) { console.error('nenhum reel encontrado'); process.exit(1); }
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const blocos = escolhidos.map((r, i) => {
  const cenas = (r.cenas || []).map((c, k) => `
    <div class="cena"><div class="meta">Cena ${k + 1}${c.tempo ? ' · ' + esc(c.tempo) : ''}${c.visual ? ' · ' + esc(c.visual) : ''}</div>
    <div class="fala">${esc(c.fala || c.texto_tela || '')}</div></div>`).join('');
  return `<section class="reel" data-i="${i}">
    <div class="topo">${esc(r.titulo || 'Reel ' + (i + 1))}<span>${esc(r.duracao || '')}</span></div>
    <div class="dica">Respire. Olhe para a câmera. Se errar, pare 2 segundos e repita a frase inteira.</div>
    <div class="gancho">${esc(r.gancho || '')}</div>
    ${cenas}
    <div class="cta">${esc(r.cta || '')}</div><div class="fim">— fim —</div></section>`;
}).join('');

const abas = escolhidos.length > 1 ? `<nav>${escolhidos.map((r, i) => `<button data-i="${i}">${i + 1}. ${esc((r.titulo || '').slice(0, 26))}</button>`).join('')}</nav>` : '';
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Teleprompter</title><style>
:root{--tam:56px}
*{box-sizing:border-box}body{margin:0;background:#000;color:#fff;font:600 var(--tam)/1.45 system-ui,Segoe UI,Arial,sans-serif}
nav{position:fixed;top:0;left:0;right:0;display:flex;gap:6px;padding:8px;background:#111;z-index:3;overflow:auto}
nav button{font:600 14px system-ui;background:#222;color:#fff;border:1px solid #444;border-radius:8px;padding:8px 10px;white-space:nowrap}
nav button.on{background:#FFD400;color:#000}
#rolo{padding:45vh 7vw 80vh}.reel{display:none}.reel.on{display:block}
.mirror #rolo{transform:scaleX(-1)}
.topo{font-size:.4em;color:#FFD400;display:flex;justify-content:space-between;text-transform:uppercase;letter-spacing:.08em}
.dica{font-size:.32em;color:#888;margin:.4em 0 1.2em}
.gancho{color:#FFD400;margin-bottom:.8em}.cena{margin-bottom:1em}
.meta{font-size:.3em;color:#7aa2ff;margin-bottom:.2em}.cta{color:#3BE38B}.fim{font-size:.35em;color:#666;margin-top:1em}
#linha{position:fixed;left:0;right:0;top:38vh;height:3px;background:#FFD40066;pointer-events:none;z-index:2}
#ajuda{position:fixed;bottom:0;left:0;right:0;font:500 13px system-ui;color:#999;background:#111d;padding:8px 12px;z-index:3}
</style></head><body>${abas}<div id="linha"></div><div id="rolo">${blocos}</div>
<div id="ajuda">Espaço ou toque = rolar/pausar · ↑ ↓ velocidade · + − letra · E espelhar · R início · <span id="vel"></span></div>
<script>
let vel=1.2,rolando=false,tam=56,y=0;const reels=[...document.querySelectorAll('.reel')],bts=[...document.querySelectorAll('nav button')];
function mostra(i){reels.forEach((r,k)=>r.classList.toggle('on',k==i));bts.forEach((b,k)=>b.classList.toggle('on',k==i));scrollTo(0,0);y=0;rolando=false}
bts.forEach(b=>b.onclick=e=>{e.stopPropagation();mostra(+b.dataset.i)});mostra(0);
function info(){document.getElementById('vel').textContent='velocidade '+vel.toFixed(1)+' · letra '+tam+'px'}info();
function passo(){if(rolando){y+=vel;scrollTo(0,y)}requestAnimationFrame(passo)}passo();
addEventListener('keydown',e=>{if(e.key==' '){rolando=!rolando;y=scrollY;e.preventDefault()}
if(e.key=='ArrowUp'){vel=Math.min(6,vel+0.2);e.preventDefault()}if(e.key=='ArrowDown'){vel=Math.max(0.2,vel-0.2);e.preventDefault()}
if(e.key=='+'||e.key=='='){tam+=4}if(e.key=='-'){tam=Math.max(24,tam-4)}document.documentElement.style.setProperty('--tam',tam+'px');
if(e.key=='e'||e.key=='E')document.body.classList.toggle('mirror');if(e.key=='r'||e.key=='R'){scrollTo(0,0);y=0}info()});
document.getElementById('rolo').addEventListener('click',()=>{rolando=!rolando;y=scrollY});
</script></body></html>`;
const saida = saidaArg || path.join(path.dirname(path.resolve(arq)), escolhidos.length > 1 ? 'teleprompter.html' : `teleprompter-reel${nArg}.html`);
fs.writeFileSync(saida, html);
console.log('teleprompter:', saida);
