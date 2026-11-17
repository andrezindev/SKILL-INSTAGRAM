"""Sugere os cortes a partir das palavras transcritas: pausas longas, hesitações, recomeços e frases repetidas (mantém o último take).

Uso: python sugerir-cortes.py <palavras.json> <saida/cortes.json> [--duracao 31.7] [--pausa 0.35] [--respiro 0.12] [--relatorio relatorio.md]
Gera cortes.json (trechos a MANTER, no tempo do bruto) e um relatório com o que saiu, quanto tempo economizou e candidatas a gancho.
Revise o relatório antes de cortar: a decisão final é sua.
"""
import json, re, sys, unicodedata
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HESITACOES = {"ãh", "ah", "ahn", "hum", "hmm", "hã", "éé", "ééé", "eh", "uh", "humm"}
VICIOS = {"tipo", "né", "então", "assim", "basicamente", "literalmente"}  # só sugere

def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))

def main():
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    def opt(k, d):
        return float(a[a.index(k) + 1]) if k in a else d
    pausa, respiro = opt("--pausa", 0.35), opt("--respiro", 0.12)
    rel_path = a[a.index("--relatorio") + 1] if "--relatorio" in a else a[1].replace(".json", "") + "-relatorio.md"
    ps = json.load(open(a[0], encoding="utf-8"))
    import os
    gp = os.path.join(os.path.expanduser("~"), ".claude", "editar-video", "glossario.json")
    gl = {k.lower(): v for k, v in json.load(open(gp, encoding="utf-8")).items() if not k.startswith("_")} if os.path.exists(gp) else {}
    corr = lambda w: (gl.get(re.sub(r"[.,!?]+$", "", w.lower())) + w[len(re.sub(r"[.,!?]+$", "", w)):]) if re.sub(r"[.,!?]+$", "", w.lower()) in gl else w
    dur = opt("--duracao", ps[-1]["f"] + 0.3 if ps else 0)
    removidas, motivos = set(), []

    # 1) hesitações isoladas ("ãh", "hum", "é..." cercado de pausa)
    for i, p in enumerate(ps):
        n = norm(p["w"])
        antes = p["t"] - ps[i - 1]["f"] if i else 1
        depois = ps[i + 1]["t"] - p["f"] if i + 1 < len(ps) else 1
        if n in HESITACOES or (n in {"e", "eh"} and p["w"].lower().startswith("é") and antes > 0.25 and depois > 0.25):
            removidas.add(i); motivos.append(f"hesitação '{p['w']}' em {p['t']:.2f}s")

    # 2) frases (separadas por pausa > 0,3 s ou pontuação) e recomeços: se uma frase começa igual (3+ palavras) à seguinte em até 8 s, fica a última
    frases, cur = [], []
    for i, p in enumerate(ps):
        if cur and (p["t"] - ps[cur[-1]]["f"] > 0.3 or re.search(r"[.!?]$", ps[cur[-1]]["w"])):
            frases.append(cur); cur = []
        cur.append(i)
    if cur: frases.append(cur)
    for k in range(len(frases) - 1):
        A = [norm(ps[i]["w"]) for i in frases[k] if i not in removidas]
        for j in range(k + 1, min(len(frases), k + 4)):
            if ps[frases[j][0]]["t"] - ps[frases[k][-1]]["f"] > 8: break
            B = [norm(ps[i]["w"]) for i in frases[j]]
            m = 0
            while m < min(len(A), len(B)) and A[m] == B[m]: m += 1
            if m >= 3 or (A and A == B[: len(A)] and len(A) >= 2):
                for i in frases[k]: removidas.add(i)
                motivos.append(f"recomeço: '{' '.join(ps[i]['w'] for i in frases[k])}' ({ps[frases[k][0]]['t']:.2f}s) — mantido o take seguinte")
                break

    # 3) monta os trechos a manter, cortando pausas longas
    manter = [i for i in range(len(ps)) if i not in removidas]
    cortes, ini, fim = [], None, None
    for i in manter:
        p = ps[i]
        if ini is None:
            ini, fim = max(0, p["t"] - respiro), p["f"]
        elif p["t"] - fim > pausa or (i - 1) in removidas:
            cortes.append({"de": round(ini, 3), "ate": round(min(dur, fim + respiro), 3)})
            ini, fim = max(0, p["t"] - respiro), p["f"]
        else:
            fim = p["f"]
    if ini is not None: cortes.append({"de": round(ini, 3), "ate": round(min(dur, fim + respiro), 3)})
    # junta trechos muito próximos
    juntos = []
    for c in cortes:
        if juntos and c["de"] - juntos[-1]["ate"] < 0.06: juntos[-1]["ate"] = c["ate"]
        else: juntos.append(c)
    json.dump(juntos, open(a[1], "w", encoding="utf-8"), indent=1)

    total = sum(c["ate"] - c["de"] for c in juntos)
    vicios = [f"'{p['w']}' em {p['t']:.2f}s" for p in ps if norm(p["w"]) in VICIOS]
    ganchos = []
    for fr in frases:
        txt = " ".join(corr(ps[i]["w"]) for i in fr)
        score = ("?" in txt) * 2 + bool(re.search(r"\d", txt)) + ("você" in txt.lower()) + (len(fr) <= 14)
        ganchos.append((score, ps[fr[0]]["t"], txt))
    ganchos.sort(key=lambda g: -g[0])
    rel = [f"# Sugestão de cortes", "", f"- Duração bruta: {dur:.2f}s · depois dos cortes: {total:.2f}s (economia de {dur - total:.2f}s)", f"- Trechos mantidos: {len(juntos)}", "", "## O que saiu"]
    rel += [f"- {m}" for m in motivos] or ["- só pausas longas"]
    rel += ["", "## Vícios de linguagem (só aviso; avalie se corta)"] + ([f"- {v}" for v in vicios] or ["- nenhum"])
    rel += ["", "## Candidatas a gancho (frase forte para abrir)"] + [f"- {t:.2f}s: {txt}" for _, t, txt in ganchos[:3]]
    open(rel_path, "w", encoding="utf-8").write("\n".join(rel) + "\n")
    print("\n".join(rel[:3]))
    print("cortes:", a[1], "· relatório:", rel_path)

main()
