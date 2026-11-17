"""Corta o vídeo bruto mantendo só os trechos escolhidos e reajusta as palavras para a nova linha do tempo.

Uso: python cortar.py <video> <cortes.json> <saida.mp4> [palavras.json] [--cauda SEGUNDOS] [--limpar-voz]
--limpar-voz: tira ruído e graves, comprime e dá presença à voz (som de microfone bom)
--cauda: congela o último quadro e estende o áudio com silêncio (espaço para o CTA no fim)
cortes.json: [ {"de": 1.2, "ate": 6.8}, {"de": 9.0, "ate": 14.5, "velocidade": 1.0}, ... ]   (segundos do bruto; "velocidade" opcional, 0.5 a 2.0)
Saída: <saida.mp4> (sem mudar a resolução), <saida>.palavras.json (palavras no tempo novo) e <saida>.mapa.json (trechos: tempo bruto -> tempo novo).
Cada emenda ganha um fade de áudio de 12 ms para não estalar.
"""
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def main():
    args = sys.argv[1:]
    cauda = 0.0
    limpar = "--limpar-voz" in args
    if limpar: args.remove("--limpar-voz")
    VOZ = "highpass=f=80,afftdn=nf=-25,acompressor=threshold=-21dB:ratio=3:attack=8:release=150:makeup=2,equalizer=f=3500:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2"
    if "--cauda" in args:
        i = args.index("--cauda"); cauda = float(args[i + 1]); del args[i:i + 2]
    if len(args) < 3: sys.exit(__doc__)
    video, cortes_p, saida = args[0:3]
    palavras_p = args[3] if len(args) > 3 else None
    cortes = json.load(open(cortes_p, encoding="utf-8"))
    if not cortes: sys.exit("cortes.json vazio")
    fv, fa, labels = [], [], []
    for i, c in enumerate(cortes):
        v = float(c.get("velocidade", 1.0))
        a, b = float(c["de"]), float(c["ate"])
        vf = f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{v}[v{i}]"
        af = f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS"
        if v != 1.0: af += f",atempo={v}"
        af += f",afade=t=in:d=0.012,afade=t=out:st={max(0, (b - a) / v - 0.012):.4f}:d=0.012[a{i}]"
        fv.append(vf); fa.append(af); labels.append(f"[v{i}][a{i}]")
    fc = ";".join(fv + fa) + ";" + "".join(labels) + f"concat=n={len(cortes)}:v=1:a=1[v0][a0]"
    af_voz = (VOZ + ",") if limpar else ""
    if cauda > 0:
        fc += f";[v0]tpad=stop_mode=clone:stop_duration={cauda}[v];[a0]{af_voz}apad=pad_dur={cauda}[a]"
    else:
        fc += f";[v0]null[v];[a0]{af_voz}anull[a]"
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", video, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", saida]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: sys.exit("ffmpeg falhou:\n" + r.stderr[-800:])
    # mapa de tempo
    mapa, acc = [], 0.0
    for c in cortes:
        v = float(c.get("velocidade", 1.0)); a, b = float(c["de"]), float(c["ate"]); d = (b - a) / v
        mapa.append({"de": a, "ate": b, "velocidade": v, "novo_ini": round(acc, 3), "novo_fim": round(acc + d, 3)}); acc += d
    base = os.path.splitext(saida)[0]
    json.dump(mapa, open(base + ".mapa.json", "w", encoding="utf-8"), indent=1)
    if palavras_p:
        ps = json.load(open(palavras_p, encoding="utf-8")); out = []
        for p in ps:
            for m in mapa:
                if p["t"] >= m["de"] - 0.02 and p["f"] <= m["ate"] + 0.05:
                    t = m["novo_ini"] + (max(p["t"], m["de"]) - m["de"]) / m["velocidade"]
                    f = m["novo_ini"] + (min(p["f"], m["ate"]) - m["de"]) / m["velocidade"]
                    out.append({"w": p["w"], "t": round(t, 3), "f": round(max(f, t + 0.05), 3)}); break
        json.dump(out, open(base + ".palavras.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("palavras mantidas:", len(out), "de", len(ps))
    print(f"ok: {saida}  duração nova: {acc + cauda:.2f}s (cortes {acc:.2f}s + cauda {cauda:.2f}s)")

main()
