"""Verifica se o computador tem tudo para as skills de conteúdo (instagram-conteudo, reels-conteudo, editar-video)
e diz, em português simples, o que falta e como resolver. Não instala nada sozinho.

Uso: python verificar.py [--json]
Saída: uma linha por item (OK / FALTA / OPCIONAL) e o comando para resolver. Código 0 = tudo essencial OK.
"""
import glob, json, os, shutil, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOME = os.path.expanduser("~")
CH = os.environ.get("CLAUDE_HOME") or os.path.join(HOME, ".claude")
WIN = os.name == "nt"

def rodar(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=40, shell=WIN)
        return r.returncode == 0, (r.stdout or r.stderr).strip().splitlines()[0] if (r.stdout or r.stderr).strip() else ""
    except Exception as e:
        return False, str(e)

def ffmpeg_path():
    if shutil.which("ffmpeg"): return shutil.which("ffmpeg")
    if WIN:
        achados = glob.glob(os.path.join(HOME, "AppData", "Local", "Microsoft", "WinGet", "Packages", "*FFmpeg*", "*", "bin", "ffmpeg.exe"))
        if achados: return achados[0]
    return None

def main():
    itens = []  # (nome, status, detalhe, como_resolver, para_que)
    ok, v = rodar(["node", "--version"])
    maj = int(v.lstrip("v").split(".")[0]) if ok and v.startswith("v") else 0
    itens.append(("Node.js 18+", "OK" if maj >= 18 else "FALTA", v or "não encontrado",
                  "Instale em https://nodejs.org (versão LTS)", "todas"))
    py = sys.version.split()[0]
    itens.append(("Python 3.9+", "OK" if sys.version_info >= (3, 9) else "FALTA", py, "Instale em https://python.org", "vídeo e áudio"))
    fp = ffmpeg_path()
    itens.append(("ffmpeg", "OK" if fp else "FALTA", fp or "não encontrado",
                  "winget install Gyan.FFmpeg" if WIN else ("brew install ffmpeg" if sys.platform == "darwin" else "sudo apt install ffmpeg"), "vídeo e áudio"))
    try:
        import numpy; itens.append(("numpy", "OK", numpy.__version__, "", "mixar áudio dos Reels"))
    except ImportError:
        itens.append(("numpy", "FALTA", "não instalado", "python -m pip install --user numpy", "mixar áudio dos Reels"))
    try:
        import cv2; itens.append(("OpenCV", "OK", cv2.__version__, "", "achar o rosto (editar-video)"))
    except ImportError:
        itens.append(("OpenCV", "FALTA", "não instalado", "python -m pip install --user opencv-python-headless", "achar o rosto (editar-video)"))
    sk = os.path.join(CH, "skills")
    for s in ("instagram-conteudo", "reels-conteudo", "editar-video"):
        p = os.path.join(sk, s, "SKILL.md")
        itens.append((f"skill {s}", "OK" if os.path.exists(p) else "FALTA", p if os.path.exists(p) else "não instalada", "Rode o instalador (install.ps1 ou install.sh)", "/" + s))
    modelo = os.path.join(sk, "editar-video", "assets", "modelos", "face_detection_yunet_2023mar.onnx")
    if os.path.exists(os.path.join(sk, "editar-video")):
        itens.append(("modelo de rosto", "OK" if os.path.exists(modelo) else "FALTA", "", "Reinstale a skill editar-video", "editar-video"))
        deps = os.path.join(sk, "editar-video", "modelo-remotion", "node_modules", "remotion")
        itens.append(("Remotion (render)", "OK" if os.path.exists(deps) else "OPCIONAL", "instalado" if os.path.exists(deps) else "instala sozinho no 1º vídeo (1 a 3 min)", "", "editar-video"))
    cache = [p for p in glob.glob(os.path.join(HOME, ".cache", "**", "*parakeet*"), recursive=True)][:1] + glob.glob(os.path.join(HOME, ".hyperframes", "**", "*parakeet*"), recursive=True)[:1]
    itens.append(("transcrição (Parakeet)", "OK" if cache else "OPCIONAL", cache[0] if cache else "baixa ~640 MB no 1º vídeo (a skill pede licença)", "npx hyperframes models install parakeet", "editar-video"))
    chrome = shutil.which("chrome") or shutil.which("google-chrome") or any(os.path.exists(p) for p in [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", "/Applications/Google Chrome.app"])
    itens.append(("Google Chrome", "OK" if chrome else "OPCIONAL", "", "https://google.com/chrome", "modo rápido de imagens"))
    prefs = os.path.join(CH, "editar-video", "preferencias.md")
    itens.append(("memória de preferências", "OK" if os.path.exists(prefs) else "OPCIONAL", prefs if os.path.exists(prefs) else "criada no 1º vídeo", "", "editar-video"))

    if "--json" in sys.argv:
        print(json.dumps([dict(zip(("item", "status", "detalhe", "resolver", "para"), i)) for i in itens], ensure_ascii=False, indent=1)); return
    largura = max(len(i[0]) for i in itens)
    for nome, st, det, fix, para in itens:
        marca = {"OK": "✓", "FALTA": "✗", "OPCIONAL": "•"}[st]
        print(f" {marca} {nome.ljust(largura)}  {st:<8} {det}")
        if st == "FALTA" and fix: print(f"   {' ' * largura}  → resolver: {fix}  (usado em: {para})")
    faltas = [i for i in itens if i[1] == "FALTA"]
    print("\nTudo pronto." if not faltas else f"\nFaltam {len(faltas)} item(ns). O Claude pode instalar para você: é só pedir.")
    sys.exit(1 if faltas else 0)

main()
