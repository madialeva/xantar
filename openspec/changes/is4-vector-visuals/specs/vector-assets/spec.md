# Spec Delta

## Purpose

Define el origen vectorial de todos los gráficos del juego (fuentes SVG que
siguen una guía de estilo) y cómo se convierten en texturas nítidas a la escala
real de dibujo, tanto en navegador como en la aplicación de escritorio.

## ADDED Requirements

### Requirement: Guía de estilo
El proyecto SHALL incluir una guía de estilo (en español en esta versión) que fije la paleta como tokens con
nombre, el grosor de trazo, los radios de esquina, el tratamiento de sombras y
brillos, la tipografía del HUD y las reglas de encaje de piezas y personajes en
la rejilla de 32 unidades lógicas. Todas las fuentes SVG del juego SHALL
colorearse solo con tokens de esa paleta.

#### Scenario: Revisar un SVG nuevo
- **WHEN** se añade una fuente SVG con un color que no corresponde a ningún
  token de la paleta
- **THEN** la comprobación automática de fuentes SVG falla e indica el fichero
  y el color

### Requirement: Fuentes SVG para todo lo visible
Las piezas del laberinto (plataforma, escalera, cruce, plato), los segmentos de
los cuatro ingredientes (extremo izquierdo, tramo central, extremo derecho), las
partes del chef y de los tres enemigos, la nube de pimienta y los iconos del HUD
SHALL dibujarse a partir de fuentes SVG. La vista SHALL NOT dibujar ninguno de
esos elementos con primitivas geométricas.

#### Scenario: Ingrediente de tres segmentos
- **WHEN** se dibuja un ingrediente de un nivel con unidades de tres casillas
- **THEN** se compone con un extremo izquierdo, un tramo central y un extremo
  derecho del tipo de ingrediente

#### Scenario: Ingrediente de dos segmentos
- **WHEN** se dibuja un ingrediente de un nivel con unidades de dos casillas
- **THEN** se compone con un extremo izquierdo y un extremo derecho, sin tramo
  central

### Requirement: Rasterizado a la escala de dibujo
Antes de mostrar el juego, el sistema SHALL convertir cada fuente SVG de cada
tema registrado en una textura con un tamaño en píxeles igual a su tamaño lógico
multiplicado por el nivel de escala de dibujo (1, 2 o 4). En esta versión el
nivel de escala SHALL ser 2. El tamaño con que cada elemento aparece en la
rejilla lógica SHALL ser el mismo con cualquier nivel de escala. Empezar un
nivel con un tema distinto del anterior SHALL NOT requerir un nuevo
rasterizado.

#### Scenario: Nivel de escala 2
- **WHEN** se rasteriza un segmento de ingrediente de una casilla con nivel de
  escala 2
- **THEN** la textura resultante mide 64 píxeles de ancho y ocupa 32 unidades
  lógicas en el tablero

#### Scenario: Pantalla de alta densidad
- **WHEN** el juego se muestra a pantalla completa en una pantalla de 1920×1080
- **THEN** los bordes de piezas y personajes se ven nítidos, sin el
  emborronado del escalado de un lienzo de 640×480

### Requirement: Funcionamiento bajo file://
La carga y el rasterizado de las fuentes SVG SHALL funcionar igual en el
servidor de desarrollo, en la build web servida por HTTP y en la aplicación de
escritorio que carga los ficheros desde `file://`, sin peticiones de red para
obtener las fuentes.

#### Scenario: Aplicación de escritorio empaquetada
- **WHEN** se abre la aplicación de escritorio generada por la build
- **THEN** el tablero, los ingredientes y los personajes se dibujan con sus
  gráficos vectoriales

### Requirement: Fallo de rasterizado visible
Si una fuente SVG no puede rasterizarse, el sistema SHALL informar en la
consola del identificador del gráfico y del tema y SHALL sustituirlo por una
textura de marcador visible en lugar de detener el juego.

#### Scenario: SVG mal formado
- **WHEN** una fuente SVG de un tema no es un documento SVG válido
- **THEN** el juego arranca, el elemento afectado se ve con la textura de
  marcador y la consola indica qué gráfico de qué tema falló
