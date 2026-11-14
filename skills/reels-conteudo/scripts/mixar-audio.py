"""Mixa locução + trilha + efeitos no tempo do vídeo e (opcional) junta ao MP4.

Uso:
  python mixar-audio.py --pausas voz.mp3                  # lista as pausas da locução (para cortar por frase)
  python mixar-audio.py audio.json                        # gera mix.wav ao lado do audio.json
  python mixar-audio.py audio.json --video in.mp4 --saida out.mp4   # e junta ao vídeo, com volume de Reels (-14 LUFS)

audio.json:
{
  "duracao": 30.0,
  "voz": { "arquivo": "voz.mp3", "ganho": 2.0,
           "segmentos": [ { "pedacos": [[0.0, 2.2]], "tempo": 1.0, "em": 0.45 } ] },   # pedaços da voz (s) -> onde entram no vídeo (s)
  "musica": { "arquivo": "", "ganho": 0.36, "abaixa": 0.6 },                              # vazio = trilha padrão da skill
  "sfx": [ [1.2, "pop", 0.8], [3.0, "whoosh", 0.5] ]                                      # [tempo, nome, ganho 0..1]
}
SFX disponíveis em ../assets/sfx: whoosh pop ding bell tick beep chaching stamp impact glitch (e music = trilha).
"""
import json, os, subprocess, sys, wave
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
SFXDIR = os.path.join(HERE, "..", "assets", "sfx")
FF = "ffmpeg"


def decode(args):
    p = subprocess.run([FF, "-v", "error"] + args + ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True)
    if p.returncode != 0:
        sys.exit("ffmpeg falhou: " + p.stderr.decode(errors="ignore")[:300])
    return np.frombuffer(p.stdout, dtype=np.float32).reshape(-1, 2).copy()


def pausas(arq):
    import re
    p = subprocess.run([FF, "-i", arq, "-af", "silencedetect=noise=-30dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
    pts = re.findall(r"silence_(start|end): ([0-9.]+)", p.stderr)
    cur = None
    print("pausas (início-fim) e ponto médio sugerido para cortar:")
    for k, v in pts:
        v = float(v)
        if k == "start":
            cur = v
        elif cur is not None:
            print(f"  {cur:.2f} - {v:.2f}   corte ~ {(cur + v) / 2:.2f}")
            cur = None


def mixar(cfg_path, video=None, saida=None):
    base = os.path.dirname(os.path.abspath(cfg_path))
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    DUR = float(cfg["duracao"]); N = int(DUR * SR)

    def put(buf, x, t, g=1.0):
        i = int(t * SR)
        if i < 0:
            x = x[-i:]; i = 0
        j = min(N, i + len(x))
        if j > i:
            buf[i:j] += x[: j - i] * g

    voz = np.zeros((N, 2), np.float32)
    v = cfg.get("voz")
    if v and v.get("arquivo"):
        vf = v["arquivo"] if os.path.isabs(v["arquivo"]) else os.path.join(base, v["arquivo"])
        for seg in v["segmentos"]:
            tempo = float(seg.get("tempo", 1.0)); parts = []
            for a, b in seg["pedacos"]:
                af = f"atempo={tempo}" if tempo != 1.0 else "anull"
                x = decode(["-ss", f"{a}", "-to", f"{b}", "-i", vf, "-af", af])
                f = int(0.012 * SR)
                x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
                parts.append(x)
            put(voz, np.concatenate(parts), float(seg["em"]))
        voz *= float(v.get("ganho", 2.0))

    sx = np.zeros((N, 2), np.float32); cache = {}
    for t, nome, g in cfg.get("sfx", []):
        if nome not in cache:
            cache[nome] = decode(["-i", os.path.join(SFXDIR, nome + ".wav")])
        put(sx, cache[nome], float(t), float(g) * 0.4)

    m = np.zeros((N, 2), np.float32)
    mu = cfg.get("musica", {})
    if mu is not False:
        mf = mu.get("arquivo") or os.path.join(SFXDIR, "music.wav")
        if not os.path.isabs(mf): mf = os.path.join(base, mf) if os.path.exists(os.path.join(base, mf)) else mf
        mus = decode(["-i", mf]); xf = SR
        loops = [mus]
        while sum(len(x) for x in loops) - xf * len(loops) < N:
            loops.append(mus)
        out = loops[0]
        for nx in loops[1:]:
            fade = np.linspace(0, 1, xf)[:, None]
            mid = out[-xf:] * (1 - fade) + nx[:xf] * fade
            out = np.concatenate([out[:-xf], mid, nx[xf:]])
        m = out[:N].copy()
        env = np.abs(voz).max(axis=1); w = int(0.05 * SR)
        env = np.convolve(env, np.ones(w) / w, mode="same")
        speak = (env > 0.02).astype(np.float32)
        sm = np.zeros_like(speak); aa, ar = 1 - np.exp(-1 / (0.15 * SR)), 1 - np.exp(-1 / (0.6 * SR)); y = 0.0
        for i in range(N):
            y += (aa if speak[i] > y else ar) * (speak[i] - y); sm[i] = y
        gain = float(mu.get("ganho", 0.36)) * (1 - float(mu.get("abaixa", 0.6)) * sm)
        fio = np.ones(N, np.float32); fi = int(0.3 * SR); fo = int(1.6 * SR)
        fio[:fi] = np.linspace(0, 1, fi); fio[-fo:] = np.linspace(1, 0, fo)
        m *= (gain * fio)[:, None]

    mix = voz + sx + m
    pk = float(np.abs(mix).max())
    if pk > 0.89: mix *= 0.89 / pk
    wav = os.path.join(base, "mix.wav")
    out = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(wav, "wb") as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(out.tobytes())
    print("mix.wav pronto:", wav, "pico antes do limite:", round(pk, 3))
    if video and saida:
        r = subprocess.run([FF, "-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-shortest", saida])
        print("vídeo com áudio:", saida if r.returncode == 0 else "FALHOU")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == "--pausas": pausas(a[1]); sys.exit()
    vid = a[a.index("--video") + 1] if "--video" in a else None
    sai = a[a.index("--saida") + 1] if "--saida" in a else None
    mixar(a[0], vid, sai)
