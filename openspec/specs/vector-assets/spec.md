# vector-assets Specification

## Purpose
Define el arte vectorial del juego (fuentes SVG coloreadas con una paleta única
que siguen una guía de estilo) y cómo todos los gráficos, vectoriales o
renderizados, se convierten en texturas nítidas a la escala real de dibujo,
tanto en navegador como en la aplicación de escritorio.

## Requirements

### Requirement: Guía de estilo
El proyecto SHALL incluir una guía de estilo (en español en esta versión) que
fije el aspecto del arte renderizado (vista, iluminación, materiales y tamaños
de ingredientes y personajes) y, para el arte que sigue siendo vectorial, la
paleta como tokens con nombre, el grosor de trazo, los radios de esquina, el
tratamiento de sombras y brillos, la tipografía del HUD y las reglas de encaje
en la rejilla de 32 unidades lógicas. Todas las fuentes SVG del juego SHALL
colorearse solo con tokens de esa paleta.

#### Scenario: Revisar un SVG nuevo
- **WHEN** se añade una fuente SVG con un color que no corresponde a ningún
  token de la paleta
- **THEN** la comprobación automática de fuentes SVG falla e indica el fichero
  y el color

### Requirement: Fuentes SVG para todo lo visible
Las piezas del laberinto (plataforma, escalera, cruce, plato), la nube de
pimienta y demás efectos, y los iconos del HUD SHALL dibujarse a partir de
fuentes SVG coloreadas con la paleta única del juego. Los ingredientes y los
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

### Requirement: Rasterizado a la escala de dibujo
Antes de mostrar el juego, el sistema SHALL convertir cada gráfico del catálogo
en una textura con un tamaño en píxeles igual a su tamaño lógico multiplicado
por el nivel de escala de dibujo (1, 2 o 4), a partir de su fuente SVG o de su
imagen renderizada. En esta versión el nivel de escala SHALL ser 4. El tamaño
con que cada elemento aparece en la rejilla lógica SHALL ser el mismo con
cualquier nivel de escala.

#### Scenario: Nivel de escala 2
- **WHEN** se rasteriza un segmento de plataforma de una casilla con nivel de
  escala 2
- **THEN** la textura resultante mide 64 píxeles de ancho y ocupa 32 unidades
  lógicas en el tablero, igual que con la escala 4 de esta versión, que da 128
  píxeles

#### Scenario: Pantalla de alta densidad
- **WHEN** el juego se muestra a pantalla completa en una pantalla de 1920×1080
- **THEN** los bordes de piezas, ingredientes y personajes se ven nítidos

### Requirement: Funcionamiento bajo file://
La carga y el rasterizado de las fuentes SVG y de las imágenes renderizadas
SHALL funcionar igual en el servidor de desarrollo, en la build web servida por
HTTP y en la aplicación de escritorio, sin peticiones a otros orígenes.

#### Scenario: Aplicación de escritorio empaquetada
- **WHEN** se abre la aplicación de escritorio generada por la build
- **THEN** el tablero, los ingredientes y los personajes se dibujan con sus
  gráficos

### Requirement: Fallo de rasterizado visible
Si la fuente de un gráfico no puede rasterizarse, el sistema SHALL informar en
la consola del identificador del gráfico y SHALL sustituirlo por una textura de
marcador visible en lugar de detener el juego.

#### Scenario: SVG mal formado
- **WHEN** la fuente SVG de un gráfico no es un documento SVG válido
- **THEN** el juego arranca, el elemento afectado se ve con la textura de
  marcador y la consola indica qué gráfico falló
