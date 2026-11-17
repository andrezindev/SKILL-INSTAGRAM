"""Rastreia o rosto ao longo do vídeo (OpenCV YuNet) para posicionar legendas, títulos e zooms sem cobrir o rosto.

Uso: python rosto.py <video> <saida.json> [amostras_por_segundo=4]
Saída (coordenadas de 0 a 1 em relação ao quadro):
{ "amostras": [ {"t": 0.0, "x": 0.31, "y": 0.22, "w": 0.38, "h": 0.30, "ok": true}, ... ],
  "resumo": { "cx": 0.5, "cy": 0.37, "topo": 0.18, "base": 0.58, "cobertura": 0.97 } }
"topo"/"base" = limites do rosto em 90% do tempo (para achar zonas livres). Requer: pip install opencv-python-headless.
"""
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    video, saida = sys.argv[1], sys.argv[2]
    fps_amostra = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0
    try:
        import cv2
    except ImportError:
        sys.exit("OpenCV não instalado: python -m pip install --user opencv-python-headless")
    modelo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "modelos", "face_detection_yunet_2023mar.onnx")
    cap = cv2.VideoCapture(video)
    if not cap.isOpened(): sys.exit("não abriu o vídeo: " + video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    escala = 480 / max(W, H)
    w2, h2 = int(W * escala), int(H * escala)
    det = cv2.FaceDetectorYN.create(modelo, "", (w2, h2), 0.6, 0.3, 5)
    passo = max(1, int(round(fps / fps_amostra)))
    amostras, i = [], 0
    while True:
        ok = cap.grab()
        if not ok: break
        if i % passo == 0:
            ok, frame = cap.retrieve()
            if not ok: break
            img = cv2.resize(frame, (w2, h2))
            _, faces = det.detect(img)
            t = round(i / fps, 3)
            if faces is not None and len(faces):
                f = max(faces, key=lambda r: r[2] * r[3])
                x, y, w, h = [float(v) for v in f[:4]]
                amostras.append({"t": t, "x": round(x / w2, 4), "y": round(y / h2, 4), "w": round(w / w2, 4), "h": round(h / h2, 4), "ok": True})
            else:
                amostras.append({"t": t, "ok": False})
        i += 1
    cap.release()
    boas = [a for a in amostras if a["ok"]]
    resumo = {"cobertura": round(len(boas) / max(1, len(amostras)), 3)}
    if boas:
        cx = sorted(a["x"] + a["w"] / 2 for a in boas); cy = sorted(a["y"] + a["h"] / 2 for a in boas)
        topos = sorted(a["y"] for a in boas); bases = sorted(a["y"] + a["h"] for a in boas)
        mid = len(boas) // 2
        resumo.update({"cx": round(cx[mid], 4), "cy": round(cy[mid], 4), "topo": round(topos[int(len(topos) * 0.05)], 4), "base": round(bases[min(len(bases) - 1, int(len(bases) * 0.95))], 4)})
    json.dump({"largura": W, "altura": H, "amostras": amostras, "resumo": resumo}, open(saida, "w", encoding="utf-8"), indent=1)
    print("rosto:", json.dumps(resumo))

main()
