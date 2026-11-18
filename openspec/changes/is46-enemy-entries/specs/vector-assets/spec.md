## MODIFIED Requirements

### Requirement: Fuentes SVG para todo lo visible
Las piezas del laberinto (plataforma, escalera, cruce, plato y pasarela de
entrada), la nube de pimienta y demás efectos, y los iconos del HUD SHALL
dibujarse a partir de fuentes SVG coloreadas con la paleta única del juego. Los ingredientes y los
personajes SHALL dibujarse con su arte renderizado. Cada gráfico del catálogo
SHALL tener exactamente una fuente, SVG o renderizada, y la vista SHALL NOT
dibujar ninguno de esos elementos con primitivas geométricas.

#### Scenario: Ingrediente de tres segmentos
- **WHEN** se dibuja un ingrediente de un nivel con unidades de tres casillas
- **THEN** se compone con un extremo izquierdo, un tramo central y un extremo
  derecho del tipo de ingrediente

#### Scenario: Ingrediente de dos segmentos
- **WHEN** se dibuja un ingrediente de un nivel con unidades de dos casillas
- **THEN** se compone con un extremo izquierdo y un extremo derecho, sin tramo
  central

#### Scenario: Gráfico sin fuente o con dos
- **WHEN** un gráfico del catálogo no tiene fuente, o tiene a la vez fuente SVG
  e imagen renderizada
- **THEN** la comprobación automática del arte falla indicando el gráfico
