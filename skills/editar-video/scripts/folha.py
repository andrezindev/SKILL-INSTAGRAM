"""Gera a folha de quadros de aprovação nos momentos certos (início, cada overlay já assentado, cada transição, fim).

Uso: python folha.py <pasta> [--max 12] [--escala 0.35]
Precisa de <pasta>/remotion montado (montar.mjs). Saída: <pasta>/folha.png (e os quadros em remotion/out/folha/).
"""
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from concurrent.futures import ThreadPoolExecutor

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    pasta = os.path.abspath(a[0]); R = os.path.join(pasta, "remotion")
    mx = int(a[a.index("--max") + 1]) if "--max" in a else 12
    esc = float(a[a.index("--escala") + 1]) if "--escala" in a else 0.35
    e = json.load(open(os.path.join(R, "public", "edit.json"), encoding="utf-8"))
    fps = e.get("fps", 30); dur = e["duracao"]
    momentos = [(0.6, "início")]
    for o in e.get("overlays", []):
        momentos.append((o["t"] + min(o["d"] * 0.65, o["d"] - 0.3, 1.6 if o["tipo"] != "terminal" else o["d"] - 0.5), o["tipo"]))
    for tr in e.get("transicoes", []): momentos.append((tr["t"] + 0.5, "depois da transição"))
    momentos.append((dur - 0.3, "fim"))
    momentos = sorted({round(t, 2): n for t, n in momentos if 0 <= t < dur}.items())
    if len(momentos) > mx:
        passo = len(momentos) / mx; momentos = [momentos[int(i * passo)] for i in range(mx)]
    out = os.path.join(R, "out", "folha"); os.makedirs(out, exist_ok=True)
    npx = "npx.cmd" if os.name == "nt" else "npx"
    def still(m):
        t, _ = m; fr = min(int(t * fps), int(dur * fps) - 1); dst = os.path.join(out, f"f{fr:05d}.png")
        subprocess.run([npx, "remotion", "still", "src/index.ts", "Edicao", dst, f"--frame={fr}", f"--scale={esc}"], cwd=R, capture_output=True)
        return dst
    with ThreadPoolExecutor(3) as ex: arquivos = list(ex.map(still, momentos))
    from PIL import Image, ImageDraw, ImageFont
    try: fonte = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        try: fonte = ImageFont.truetype("DejaVuSans.ttf", 16)
        except Exception: fonte = None
    ims = [Image.open(f).convert("RGB") for f in arquivos if os.path.exists(f)]
    if not ims: sys.exit("nenhum quadro gerado (o projeto está montado?)")
    w, h = 270, 480; cols = 6 if len(ims) > 8 else 4; rows = (len(ims) + cols - 1) // cols
    folha = Image.new("RGB", (cols * w, rows * (h + 26)), (20, 20, 24)); d = ImageDraw.Draw(folha)
    for i, (im, (t, nome)) in enumerate(zip(ims, momentos)):
        x, y = (i % cols) * w, (i // cols) * (h + 26)
        folha.paste(im.resize((w, h)), (x, y + 26)); d.text((x + 6, y + 6), f"{t:.1f}s · {nome}", fill=(230, 230, 240), font=fonte)
    dst = os.path.join(pasta, "folha.png"); folha.save(dst); print("folha:", dst, f"({len(ims)} quadros)")

main()
