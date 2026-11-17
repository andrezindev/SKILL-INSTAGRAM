"""Confere o edit.json antes de mostrar à pessoa: pendências, sobreposições, tempo de leitura, ritmo, legendas sobre o rosto,
sons incômodos, CTA, glossário e preferências. Imprime PASSOU ou a lista de problemas (com o que fazer).

Uso: python checar.py <pasta>   (usa <pasta>/edit.json, <pasta>/analise/rosto-cortado.json se existir e as preferências do usuário)
Código de saída: 0 = passou, 1 = tem problema que precisa corrigir, 2 = só avisos.
"""
import json, os, re, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOME = os.path.expanduser("~")
TOPO = {"titulo", "palavra", "lista", "passos", "github", "terminal", "imagem", "video", "numero", "comparativo", "progresso"}

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    pasta = sys.argv[1]
    e = json.load(open(os.path.join(pasta, "edit.json"), encoding="utf-8"))
    rp = os.path.join(pasta, "analise", "rosto-cortado.json")
    rosto = json.load(open(rp, encoding="utf-8")) if os.path.exists(rp) else None
    prefs = open(os.path.join(HOME, ".claude", "editar-video", "preferencias.md"), encoding="utf-8").read().lower() if os.path.exists(os.path.join(HOME, ".claude", "editar-video", "preferencias.md")) else ""
    erros, avisos = [], []
    dur = e["duracao"]; ov = e.get("overlays", [])
    estilo = e.get("estilo", "dinamico")

    # pendências
    txt = json.dumps({k: v for k, v in e.items() if k != "_notas"}, ensure_ascii=False)
    for m in sorted(set(re.findall(r"<<[^>]*>>", txt))): erros.append(f"pendente: {m} (preencha ou remova o campo)")
    if e.get("faixa") and "faixa" in prefs: erros.append("faixa ligada, mas a preferência é vídeo inteiro: remova 'faixa'")

    # overlays: tempo, limites, leitura, sobreposição na mesma zona
    for i, o in enumerate(ov):
        nome = f"{o['tipo']}#{i} ({o['t']:.1f}s)"
        if o["t"] < 0 or o["t"] + o["d"] > dur + 0.05: erros.append(f"{nome} passa do fim do vídeo ({dur:.1f}s)")
        texto = " ".join(str(o.get(k, "")) for k in ("texto", "titulo", "rotulo", "sub")) + " " + " ".join(o.get("itens", []) or [])
        palavras = len(re.sub(r"[*<>]", "", texto).split())
        minimo = 1.2 + palavras * 0.18 if o["tipo"] not in ("palavra", "callout") else 0.9
        if o["tipo"] == "terminal":
            cps = o.get("cps", 30); need = 0.4 + sum((len(l["texto"]) / cps + 0.3) if l["tipo"] == "cmd" else 0.34 for l in o["linhas"]) + 0.8
            if o["d"] < need: erros.append(f"{nome}: terminal precisa de ~{need:.1f}s para digitar tudo e ser lido (tem {o['d']:.1f}s); aumente d ou cps")
        elif o["d"] < minimo: avisos.append(f"{nome}: {o['d']:.1f}s pode ser pouco para ler {palavras} palavras (ideal ≥ {minimo:.1f}s)")
        if o["tipo"] == "titulo" and len(re.sub(r"[*]", "", o.get("texto", "")).split()) > 8: avisos.append(f"{nome}: título longo; ideal até 6-8 palavras")
    zona = lambda o: "topo" if o["tipo"] in TOPO or (o["tipo"] == "callout" and o.get("y", 0.2) < 0.45) else ("tela" if o["tipo"] == "cta" and o.get("palavra") else "outro")
    for i, a in enumerate(ov):
        for b in ov[i + 1:]:
            if zona(a) == zona(b) != "outro" and a["t"] < b["t"] + b["d"] - 0.05 and b["t"] < a["t"] + a["d"] - 0.05:
                erros.append(f"sobreposição na mesma área: {a['tipo']} ({a['t']:.1f}s) e {b['tipo']} ({b['t']:.1f}s)")

    # ritmo: maior intervalo sem acontecimento visual
    internos = []
    for o in ov:
        if o["tipo"] == "terminal":
            cps = o.get("cps", 30); c = 0.4
            for l in o["linhas"]:
                internos.append(o["t"] + c); c += (len(l["texto"]) / cps + 0.3) if l["tipo"] == "cmd" else 0.34
        if o["tipo"] in ("lista", "passos"): internos += [o["t"] + 0.3 + k * 0.4 for k in range(len(o.get("itens", [])))]
    ev = sorted([0.0] + internos + [o["t"] for o in ov] + [j["t"] for j in e.get("jumpcuts", [])] + [t["t"] for t in e.get("transicoes", [])] + [z["t"] for z in e.get("zooms", [])] + list(e.get("punch", [])) + [dur])
    gap = max((b - a, a) for a, b in zip(ev, ev[1:]))
    limite = {"viral": 3.0, "dinamico": 4.0, "tutorial": 6.0, "historia": 9.0, "limpo": 12.0}.get(estilo, 4.0)
    if gap[0] > limite: avisos.append(f"ritmo: {gap[0]:.1f}s sem nada novo a partir de {gap[1]:.1f}s (estilo {estilo}: até {limite:.0f}s). Acrescente zoom, callout ou palavra")

    # legendas x rosto
    leg = e.get("legendas", {})
    if rosto and rosto["resumo"].get("cobertura", 0) > 0.5 and leg.get("ativo", True):
        bocas = sorted(s["y"] + s["h"] * 0.70 for s in rosto["amostras"] if s.get("ok"))
        boca = bocas[int(len(bocas) * 0.75)] * 1920; top = leg.get("top", 1330)
        if top < boca + 30:
            if top >= 1430: avisos.append(f"rosto baixo no quadro: a legenda (y={top}) passa perto do queixo (boca ~{boca:.0f}px) e não dá para descer mais sem entrar na área dos botões; aceitável, ou use legendas.posicao 'meio' nos trechos com janelinha")
            else: erros.append(f"legenda em y={top} cobre a boca (boca ~{boca:.0f}px): use top ≥ {min(1440, boca + 70):.0f}")
    if leg.get("top", 1330) + leg.get("tamanho", 80) * 1.1 > 1560: avisos.append("legenda encosta na área de baixo do Instagram (botões): suba um pouco ou use max 3 palavras")
    # glossário residual
    gl = {}
    gp = os.path.join(HOME, ".claude", "editar-video", "glossario.json")
    if os.path.exists(gp): gl = {k.lower(): v for k, v in json.load(open(gp, encoding="utf-8")).items() if not k.startswith("_")}
    resto = [p["w"] for p in leg.get("palavras", []) if re.sub(r"[.,!?]+$", "", p["w"].lower()) in gl and re.sub(r"[.,!?]+$", "", p["w"]) != gl[re.sub(r"[.,!?]+$", "", p["w"].lower())]]
    susp = [p["w"] for p in leg.get("palavras", []) if re.sub(r"[^a-z]", "", p["w"].lower()) in {"the", "and", "of", "to", "is", "it", "you", "that", "this", "with"}]
    if susp: avisos.append(f"palavras suspeitas na legenda (transcrição em inglês?): {', '.join(sorted(set(susp)))} — confira com o áudio e corrija")
    if resto: erros.append(f"legenda com palavras do glossário sem corrigir: {', '.join(sorted(set(resto)))}")

    # sons
    for s in e.get("sfx", []):
        if s["nome"] == "impact" and ("impact" in prefs or "sem impact" in prefs): avisos.append(f"impact em {s['t']:.1f}s: a preferência é sem impact"); break
    altos = [s for s in e.get("sfx", []) if s["nome"] == "whoosh" and s.get("g", 0.6) > 0.15]
    if altos and "whoosh" in prefs: avisos.append(f"{len(altos)} whoosh com ganho > 0,15 (preferência: transição discreta)")
    # acessibilidade: piscadas fortes
    fl = sorted(x["t"] for x in e.get("transicoes", []) if x["tipo"] in ("flash", "glitch"))
    if any(b - a < 3.0 for a, b in zip(fl, fl[1:])): erros.append("flash/glitch a menos de 3 s um do outro: pode incomodar pessoas sensíveis a luz piscando; espace ou troque por wipe/zoom")
    if leg.get("ativo") is False: avisos.append("legenda desligada: quem assiste sem som (ou tem deficiência auditiva) perde o vídeo")
    # excesso: emojis demais cansam; punch demais vira tremedeira
    ems = [o for o in ov if o["tipo"] == "emoji"]
    if len(ems) > max(3, dur / 6): avisos.append(f"{len(ems)} emojis em {dur:.0f}s: use no máximo 1 a cada 6 s")
    pu = sorted(e.get("punch", []))
    if any(b - a < 1.5 for a, b in zip(pu, pu[1:])): avisos.append("punch muito próximos (< 1,5 s): espace os socos de zoom")
    if o_cmp := [o for o in ov if o["tipo"] == "comparativo" and (len(o["antes"]["itens"]) > 3 or len(o["depois"]["itens"]) > 3)]: avisos.append("comparativo com mais de 3 itens por lado: fica pequeno no celular")
    # CTA
    ctas = [o for o in ov if o["tipo"] == "cta"]
    if not ctas: avisos.append("sem CTA no fim")
    elif ctas[-1]["t"] + ctas[-1]["d"] < dur - 0.3 or ctas[-1]["d"] < 2.0: avisos.append("CTA deve fechar o vídeo e ficar pelo menos 2 s")

    for x in erros: print("PROBLEMA:", x)
    for x in avisos: print("aviso:", x)
    if not erros and not avisos: print("PASSOU: nada a corrigir")
    elif not erros: print("PASSOU com avisos")
    sys.exit(1 if erros else (2 if avisos else 0))

main()
