"""Entrega completa a partir do vídeo final: volume de Reels, capa, versão 4:5 (feed), corte curto e cópia leve.

Uso: python exportar.py <final.mp4> <pasta-de-saida> [--capa 1.2] [--corte 0 15] [--sem-45]
Gera: <nome>-reels.mp4 (−16 LUFS, pico ≤ −1,5 dBFS), capa.jpg, <nome>-feed-4x5.mp4 (1080x1350, recorte central),
<nome>-curto.mp4 (se --corte), e <nome>-leve.mp4 quando o principal passa de 20 MB. A legenda do post é escrita pelo Claude em legenda-post.md.
"""
import os, re, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def ff(args):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, capture_output=True, text=True)
    if r.returncode != 0: sys.exit("ffmpeg: " + r.stderr[-400:])

def loud(path):
    r = subprocess.run(["ffmpeg", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", r); p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)
    return (float(i[-1]) if i else None, float(p[-1]) if p else None)

def main():
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    src, out = a[0], a[1]; os.makedirs(out, exist_ok=True)
    nome = os.path.splitext(os.path.basename(src))[0]
    principal = os.path.join(out, f"{nome}-reels.mp4")
    ff(["-i", src, "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-3:LRA=11", "-c:a", "aac", "-b:a", "192k", principal])
    i, p = loud(principal)
    if p is not None and p > -1.5:
        ff(["-i", src, "-c:v", "copy", "-af", "loudnorm=I=-17:TP=-4:LRA=11", "-c:a", "aac", "-b:a", "192k", principal]); i, p = loud(principal)
    print(f"reels: {principal}  ({i} LUFS, pico {p} dBFS)")
    t_capa = a[a.index("--capa") + 1] if "--capa" in a else "1.0"
    ff(["-ss", t_capa, "-i", principal, "-frames:v", "1", "-q:v", "2", os.path.join(out, "capa.jpg")]); print("capa:", os.path.join(out, "capa.jpg"))
    if "--sem-45" not in a:
        f45 = os.path.join(out, f"{nome}-feed-4x5.mp4")
        ff(["-i", principal, "-vf", "crop=1080:1350:0:(ih-1350)/2", "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", f45]); print("feed 4:5:", f45)
    if "--corte" in a:
        k = a.index("--corte"); ini, fim = a[k + 1], a[k + 2]
        cur = os.path.join(out, f"{nome}-curto.mp4")
        ff(["-ss", ini, "-to", fim, "-i", principal, "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-af", "afade=t=out:st=" + str(max(0, float(fim) - float(ini) - 0.5)) + ":d=0.5", "-c:a", "aac", "-b:a", "192k", cur]); print("curto:", cur)
    if os.path.getsize(principal) > 20 * 1024 * 1024:
        leve = os.path.join(out, f"{nome}-leve.mp4")
        ff(["-i", principal, "-c:v", "libx264", "-crf", "23", "-preset", "slow", "-c:a", "copy", leve]); print("leve:", leve)

main()
