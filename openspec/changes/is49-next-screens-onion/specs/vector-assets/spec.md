## MODIFIED Requirements

### Requirement: Guía de estilo
El proyecto SHALL incluir una guía de estilo (en español en esta versión) que
fije el aspecto del arte renderizado (vista, iluminación, materiales y tamaños
de ingredientes y personajes) y, para el arte que sigue siendo vectorial, la
paleta como tokens con nombre, el grosor de trazo, los radios de esquina, el
tratamiento de sombras y brillos, la tipografía del HUD y las reglas de encaje
en la rejilla de casillas de 16 unidades lógicas de ancho y 21 de alto. Todas las fuentes SVG del juego SHALL
colorearse solo con tokens de esa paleta.

#### Scenario: Revisar un SVG nuevo
- **WHEN** se añade una fuente SVG con un color que no corresponde a ningún
  token de la paleta
- **THEN** la comprobación automática de fuentes SVG falla e indica el fichero
  y el color

### Requirement: Fuentes SVG para todo lo visible
Las piezas del laberinto (plataforma, cruce, plato y pasarela de entrada), la
nube de pimienta y demás efectos, y los iconos del HUD SHALL dibujarse a partir
de fuentes SVG coloreadas con la paleta única del juego. Los ingredientes, los
personajes y la escalera, con sus largueros en los cruces, SHALL dibujarse con
su arte renderizado. Cada gráfico del catálogo
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
