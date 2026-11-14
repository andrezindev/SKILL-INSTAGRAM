// Cria um projeto novo em ~/.claude/conteudo/<slug>/ a partir de ../modelo/.
// Uso: node novo-projeto.mjs --slug meu-projeto --nome "Meu Projeto" [--tipo negocio|pessoal] [--site exemplo.com.br] [--logo caminho.png] [--saida "C:/pasta/{data}"]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2); const arg = (k, d = '') => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const slug = arg('slug').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const nome = arg('nome');
if (!slug || !nome) { console.error('uso: node novo-projeto.mjs --slug x --nome "Nome" [--tipo] [--site] [--logo] [--saida]'); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOD = path.join(HERE, '..', 'modelo');
const DEST = path.join(os.homedir(), '.claude', 'conteudo', slug);
if (fs.existsSync(DEST)) { console.error('já existe:', DEST); process.exit(1); }
const saida = arg('saida', path.join(os.homedir(), 'Documents', 'Claude', 'Instagram', slug, '{data}').replace(/\\/g, '/'));
const sub = { slug, nome, tipo: arg('tipo', 'negocio'), site: arg('site'), saida };
fs.mkdirSync(path.join(DEST, 'assets'), { recursive: true });
for (const f of fs.readdirSync(MOD)) {
  const txt = fs.readFileSync(path.join(MOD, f), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => sub[k] ?? '');
  fs.writeFileSync(path.join(DEST, f), txt);
}
const logo = arg('logo');
if (logo && fs.existsSync(logo)) {
  const ext = path.extname(logo) || '.png';
  fs.copyFileSync(logo, path.join(DEST, 'assets', 'logo' + ext));
  const vp = path.join(DEST, 'visual.json'); const v = JSON.parse(fs.readFileSync(vp, 'utf8')); v.logo = 'assets/logo' + ext; fs.writeFileSync(vp, JSON.stringify(v, null, 2));
}
console.log('criado:', DEST);
