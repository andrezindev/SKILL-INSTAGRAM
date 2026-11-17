"""Monta o RASCUNHO do edit.json a partir da transcrição, do rosto e das preferências: legendas corrigidas pelo glossário,
posição das legendas fora do rosto, jump cuts centrados no rosto, transições nas trocas de assunto, música e sugestões de motion.
Depois o Claude preenche o conteúdo dos overlays (marcados com <<...>>) e roda checar.py.

Uso: python planejar.py <pasta> [--estilo viral|dinamico|limpo|tutorial|historia] [--projeto slug] [--tema tech|quente|neutro] [--legenda pilula|caixa|karaoke]
<pasta> precisa ter: cortado.mp4, cortado.palavras.json e (opcional) analise/rosto-cortado.json.  Saída: <pasta>/edit.json
"""
import json, os, re, sys, unicodedata, subprocess
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOME = os.path.expanduser("~")
TEMAS = {
    "tech": {"bg": "#0B1020", "fg": "#EAF0FF", "acc": "#6C8CFF", "acc2": "#B26CFF", "card": "#131A33", "muted": "#9AA7CC"},
    "quente": {"bg": "#14100D", "fg": "#FFF7EE", "acc": "#FF6B1A", "acc2": "#FFC83D", "card": "#241C17", "muted": "#B8A99B"},
    "neutro": {"bg": "#0E0E10", "fg": "#F5F5F5", "acc": "#FFFFFF", "acc2": "#FFD400", "card": "#1C1C1F", "muted": "#A0A0A8"},
}
CONECTORES = ("então", "agora", "feito isso", "depois", "primeiro", "segundo", "por fim", "olha", "e aí", "mas", "só que", "pronto", "resumindo")
ESTILO = {
    "viral": {"jump": (2.2, 3.6), "trans": 5.0, "escala": 1.16, "punch": 3.0},
    "dinamico": {"jump": (3.2, 5.5), "trans": 7.0, "escala": 1.12, "punch": 5.0},
    "tutorial": {"jump": (5.0, 8.0), "trans": 9.0, "escala": 1.08},
    "limpo": {"jump": (9.0, 14.0), "trans": 0, "escala": 1.06},
    "historia": {"jump": (7.0, 11.0), "trans": 12.0, "escala": 1.06},
}

def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return "".join(c for c in w if unicodedata.category(c) != "Mn")

def carregar_glossario(projeto):
    g = {}
    for p in [os.path.join(HOME, ".claude", "editar-video", "glossario.json")] + ([os.path.join(HOME, ".claude", "conteudo", projeto, "glossario.json")] if projeto else []):
        if os.path.exists(p):
            g.update({k.lower(): v for k, v in json.load(open(p, encoding="utf-8")).items() if not k.startswith("_")})
    return g

def tema_projeto(projeto):
    if not projeto: return None
    p = os.path.join(HOME, ".claude", "conteudo", projeto, "visual.json")
    if not os.path.exists(p): return None
    v = json.load(open(p, encoding="utf-8")); t = list(v.get("temas", {}).values())
    if not t: return None
    t0 = t[0]; cor = lambda s: (re.findall(r"#[0-9A-Fa-f]{6}", s) or ["#111111"])[-1]
    return {"bg": cor(t0.get("bg", "#111111")), "fg": t0.get("fg", "#FFFFFF"), "acc": cor(t0.get("acc", "#FF6B1A")), "acc2": cor(t0.get("btnBg", t0.get("acc", "#FFC83D"))), "card": "#1E1E24", "muted": t0.get("mut", "#AAAAAA")}

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    pasta = a[0]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    estilo = opt("--estilo", "dinamico"); projeto = opt("--projeto"); tema_nome = opt("--tema", "tech")
    cfg = ESTILO.get(estilo, ESTILO["dinamico"])
    ps = json.load(open(os.path.join(pasta, "cortado.palavras.json"), encoding="utf-8"))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(pasta, "cortado.mp4")], capture_output=True, text=True).stdout.strip() or 0)
    rp = os.path.join(pasta, "analise", "rosto-cortado.json")
    rosto = json.load(open(rp, encoding="utf-8")) if os.path.exists(rp) else None

    # 1) glossário nas legendas
    g = carregar_glossario(projeto); corrigidas = []
    for p in ps:
        k = p["w"].lower(); base = re.sub(r"[.,!?]+$", "", k); pont = k[len(base):]
        if k in g: novo = g[k]
        elif base in g: novo = g[base] + pont
        else: continue
        if novo != p["w"]: corrigidas.append(f"{p['w']} -> {novo} ({p['t']:.2f}s)"); p["w"] = novo

    # 1b) palavras suspeitas (inglês no meio do português, palavras que o transcritor costuma errar): o Claude confere e corrige
    SUSPEITAS = {"the", "and", "of", "to", "is", "it", "you", "that", "this", "with", "for", "on"}
    suspeitas = [f"{p['w']} ({p['t']:.2f}s)" for p in ps if re.sub(r"[^a-z]", "", p["w"].lower()) in SUSPEITAS]

    # 2) frases e trocas de assunto
    frases, cur = [], []
    for p in ps:
        if cur and (p["t"] - cur[-1]["f"] > 0.28 or re.search(r"[.!?]$", cur[-1]["w"])):
            frases.append(cur); cur = []
        cur.append(p)
    if cur: frases.append(cur)
    inicios = [f[0]["t"] for f in frases]

    # 3) legendas fora do rosto: abaixo da boca (com folga), dentro da zona segura
    H = 1920; topo_leg = 1330
    if rosto and rosto["resumo"].get("cobertura", 0) > 0.5:
        bocas = sorted(s["y"] + s["h"] * 0.70 for s in rosto["amostras"] if s.get("ok"))
        boca = bocas[int(len(bocas) * 0.75)] * H
        topo_leg = int(min(1440, max(1250, boca + 70)))
    cx, cy = (rosto["resumo"]["cx"], rosto["resumo"]["cy"]) if rosto and rosto["resumo"].get("cx") else (0.5, 0.42)

    # 4) jump cuts nas viradas de frase, centrados no rosto
    jumps, ultimo, alt = [{"t": 0, "escala": 1.0}], 0.0, True
    lo, hi = cfg["jump"]
    for t in inicios[1:]:
        if t - ultimo >= lo:
            jumps.append({"t": round(t - 0.02, 3), "escala": cfg["escala"] if alt else 1.0, "x": round(cx, 3), "y": round(cy, 3)}); alt = not alt; ultimo = t
    # 5) transições nas trocas de assunto (conectores ou pausas), espaçadas
    trans, ultima, tipos = [], -99, (["flash", "zoom", "wipe", "glitch"] if tema_nome == "tech" else ["flash", "zoom", "wipe"])
    if cfg["trans"]:
        for f in frases[1:]:
            txt = norm(" ".join(x["w"] for x in f[:3]))
            if (txt.startswith(tuple(norm(c) for c in CONECTORES))) and f[0]["t"] - ultima >= cfg["trans"]:
                trans.append({"t": round(f[0]["t"] - 0.05, 3), "tipo": tipos[len(trans) % 2]}); ultima = f[0]["t"]
    sfx = [{"t": tr["t"], "nome": "whoosh", "g": 0.12} for tr in trans]

    # 6) sugestões de motion: termos do glossário, números, palavras longas repetidas
    contagem = {}
    for p in ps:
        b = re.sub(r"[^\wÀ-ú]", "", p["w"]).lower()
        if len(b) >= 6: contagem[b] = contagem.get(b, 0) + 1
    certos = {v.lower() for v in g.values()}
    sug = []
    for p in ps:
        b = re.sub(r"[^\wÀ-ú]", "", p["w"])
        if b.lower() in certos or re.search(r"\d", b) or (contagem.get(b.lower(), 0) >= 2 and len(b) >= 6) or (b[:1].isupper() and len(b) > 3 and p is not frases[0][0]):
            sug.append({"t": p["t"], "palavra": p["w"]})
    vistos, sug2 = set(), []
    for s in sug:
        k = s["palavra"].lower()
        if k not in vistos: vistos.add(k); sug2.append(s)

    tema = tema_projeto(projeto) or TEMAS.get(tema_nome, TEMAS["tech"])
    # 7) punch (soco de zoom) nas palavras fortes, espaçado; nunca em cima de um jump cut
    punch, up = [], -99
    if cfg.get("punch"):
        fortes = {s["palavra"].strip(".,!?").lower() for s in sug2} | {v.lower() for v in g.values()}
        for p in ps:
            if p["w"].strip(".,!?").lower() in fortes and p["t"] - up >= cfg["punch"] and all(abs(p["t"] - j["t"]) > 0.6 for j in jumps):
                punch.append(round(p["t"], 3)); up = p["t"]
    # 8) emojis sugeridos para palavras comuns (o Claude escolhe se usa)
    EMO = {"dinheiro": "💰", "grátis": "🎁", "gratis": "🎁", "rápido": "⚡", "rapido": "⚡", "tempo": "⏱️", "ideia": "💡", "erro": "❌", "certo": "✅", "fogo": "🔥", "vídeo": "🎬", "video": "🎬", "instagram": "📱", "celular": "📱", "comida": "🍔", "pedido": "🧾", "segredo": "🤫", "atenção": "⚠️", "atencao": "⚠️"}
    emojis = {k: v for k, v in EMO.items() if any(p["w"].strip(".,!?").lower() == k for p in ps)}
    destaques = sorted({v for v in g.values()} | {s["palavra"].strip(".,!?") for s in sug2[:8]})
    primeira = " ".join(x["w"] for x in frases[0]) if frases else ""
    edit = {
        "duracao": round(dur, 3), "video": "video.mp4", "estilo": estilo, "tema": tema,
        "legendas": {"ativo": True, "estilo": opt("--legenda", "pilula"), "top": topo_leg, "tamanho": 80, "max": 3, "destaques": destaques, "emojis": emojis if estilo in ("viral", "dinamico") else {}, "palavras": ps},
        "jumpcuts": jumps if estilo != "limpo" else [], "zooms": [], "punch": punch, "transicoes": trans,
        "overlays": [
            {"tipo": "titulo", "t": 0.15, "d": min(2.8, max(1.8, frases[0][-1]["f"] if frases else 2.5)), "texto": "<<GANCHO curto, até 6 palavras, com *destaque*>>", "sub": "<<etiqueta>>"},
            {"tipo": "cta", "t": round(max(0, dur - 2.8), 3), "d": 2.8, "texto": "<<chamada do CTA>>", "palavra": "<<palavra a comentar ou remova este campo>>", "url": "<<link confirmado ou remova>>"},
        ],
        "musica": {"arquivo": "music.wav", "volume": 0.13, "abaixa": True},
        "sfx": sfx, "sfx_auto": True,
        "_notas": {
            "primeira_frase": primeira,
            "sugestoes_de_motion": sug2[:14],
            "inicios_de_frase": [round(x, 2) for x in inicios],
            "legendas_corrigidas": corrigidas,
            "palavras_suspeitas": suspeitas,
            "rosto": rosto["resumo"] if rosto else None,
            "como_preencher": "Troque os <<...>> e acrescente overlays (titulo, palavra, callout, emoji, lista, passos, comparativo, progresso, github, terminal, imagem, video, numero) nos momentos das sugestões; algo novo a cada 3 a 4 s no estilo dinâmico; depois rode checar.py.",
        },
    }
    json.dump(edit, open(os.path.join(pasta, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"rascunho: {os.path.join(pasta, 'edit.json')} · {dur:.1f}s · legendas em y={topo_leg} · {len(jumps)} jump cuts · {len(trans)} transições · {len(punch)} punch · {len(emojis)} emojis na legenda · {len(corrigidas)} correções do glossário · {len(sug2)} sugestões")

main()
