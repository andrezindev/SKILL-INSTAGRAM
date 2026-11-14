# Guia de design (para o /design): peças bem feitas, editadas e diferenciadas

Vale para qualquer projeto. A identidade específica vem de `visual.json` e `design.md` do projeto.

## Como criar no Design (passo a passo)
1. `Artifact` com `action: "quickstart"`, `intent: "design"`, `design_systems: false`. O resultado traz o `type_url` do tipo Design.
2. Publique com esse `type_url`, um `title` ("<Projeto> · Instagram AAAA-MM-DD") e `auto_open: "after_first_write"`. Siga as instruções que o resultado trouxer (formato do `canvas.json`, artboards `.dc.html`, publicação).
3. Logo e imagens do projeto (`<projeto>/assets/`) entram como assets do artifact (`action: "publish"` com `asset: true`).
4. Um artboard por peça, em fila no canvas, com título do canvas. Nome de cada board: "Story 1 · gancho", "Post 2 · antes x depois", "Carrossel 3/8", "Reel 1 · cena 2".
5. Publique, abra e **olhe cada artboard** (corte de texto, contraste, hierarquia, zona segura). Corrija e publique de novo (até 3 rodadas). Entregue o link e diga que cada board pode ser baixado como imagem.

## Tamanhos
| Peça | Tamanho | Zona segura |
|---|---|---|
| Story / quadro de Reel | 1080 x 1920 | 250 px topo, 340 px (story) ou 380 px (reel) base |
| Post de feed | 1080 x 1350 | margem 90 px |
| Carrossel | 1080 x 1350, 6 a 10 slides | margem 90 px |

## Como ficar bem feito (não parecer template)
- **Uma ideia por tela.** Título grande (80 a 130 px), até 14 palavras; palavra de destaque em cor de destaque.
- **Hierarquia:** kicker pequeno em caixa alta → título → apoio → ação. Um ponto focal por tela.
- **Tipografia como imagem:** escala exagerada, cortes de linha intencionais, contraste de peso. Não centralize tudo por padrão.
- **Um elemento visual próprio por peça**, tirado do assunto: mockup do produto, ilustração vetorial feita em SVG, diagrama, gráfico simples, objeto do dia a dia, ícones desenhados. Nada de foto de banco nem clipart genérico.
- **Respiro e grid:** margens consistentes, alinhamentos claros, espaçamento generoso. Menos elementos, mais impacto.
- **Acabamento:** brilhos/manchas sutis, textura leve, sombras discretas e coerentes, cantos e traços com a mesma lógica. Contraste mínimo 4.5:1. Texto de story com pelo menos 34 px.

## Diferenciar (nada de "tudo igual")
Cada dia varia a **composição**, não só a cor. Sorteie, sem repetir a do dia anterior (`historico.md` anota a composição usada), entre estes arquétipos:
1. **Tipográfico gigante:** só palavras, escala enorme, uma palavra em destaque.
2. **Mockup em foco:** o produto/tela grande, texto curto de apoio.
3. **Split / antes x depois:** duas metades com contraste de cor.
4. **Colagem de recortes:** formas, fitas, etiquetas, carimbos, papel rasgado.
5. **Diagrama / passo a passo:** setas, números grandes, fluxo.
6. **Dado / número herói:** um número enorme com legenda (só números reais de `marca.md`).
7. **Conversa / chat:** bolhas de mensagem ou comentários (exemplos marcados como "exemplo").
8. **Lista tipo caderno/etiqueta:** checklist desenhado, post-it, tag de preço.
9. **Ilustração conceitual:** uma cena desenhada que resume a ideia.
10. **Enquadramento de foto:** foto real do projeto com recorte, moldura e tipografia por cima (só se houver fotos em `assets/`).
Dentro de uma mesma sequência (6 stories), use pelo menos **4 arquétipos diferentes**, mantendo a mesma paleta e fontes para a sequência parecer uma família. Alterne os temas de cor (`visual.json`) sem repetir o mesmo 3 vezes seguidas.

## Carrossel
Capa com gancho forte e indicação de arrastar · 1 ideia por slide, progresso visível (bolinhas ou "3/8") · mesma grade em todos os slides · último slide com CTA e identificação do projeto. 6 a 10 slides.

## Stories
Sequência contínua que conta uma história curta. Enquete e caixa de perguntas deixam um espaço livre para o sticker (e a nota diz qual). O CTA final indica o sticker de link.

## Regras
- Só fatos de `marca.md`. Nada de números inventados, depoimentos ou concorrentes.
- Sem emojis nas peças (a fonte pode falhar); emojis só em legendas.
- Use o @ do Instagram apenas se estiver confirmado em `projeto.json`.
