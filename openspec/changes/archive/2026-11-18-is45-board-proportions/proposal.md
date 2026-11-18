# Proposal

## Why

La pantalla del original está hecha sobre una rejilla de caracteres de 8 px, y
el cocinero ocupa 2×2 caracteres. Los pisos de la primera pantalla están cada
dos caracteres (16 px, la altura del chef), así que las escaleras miden 1, 2,
3… cocineros. Cada ingrediente tiene 4 trozos de un carácter: 32 px, dos
cocineros de ancho. Lo medimos en la grabación: los pisos están a 0, 2, 3, 4,
5, 6, 7 y 9 cocineros, y el pan se hunde en 4 escalones de 8 px.

En Xantar la casilla es de 32 y hace a la vez de trozo de ingrediente, de ancho
de escalera y de unidad vertical. Los pisos están a 3 casillas (96 unidades) y
el chef se dibuja con unas 39 de alto: un piso son unos 2,4 cocineros y nada
encaja con el personaje. Cada ingrediente (4 trozos de 32) mide unos cuatro
cocineros de ancho, el doble que en el original. Por eso no caben cuatro
hamburguesas separadas por escaleras, y el nivel clásico las agrupa de dos en
dos. El autor quiere seguir acercando el juego al original con la grabación
como referencia.

## What Changes

- **La rejilla del original.** La casilla pasa de 32 a 16 unidades: un carácter
  del original a escala ×2. Las piezas del nivel, los trozos de ingrediente y
  las escaleras ocupan casillas de 16. La simulación sigue trabajando en
  casillas cuadradas, y sus constantes, escritas en unidades, conservan su
  tamaño.
- **El chef mide 2×2 casillas.** Se dibuja con 32 unidades de los pies a lo alto
  del gorro, y los enemigos con la misma altura. Se consigue con una escala en
  los datos de cada rig, sin volver a renderizar a los personajes. Los pisos
  van siempre a un número par de filas, así que una escalera mide siempre
  cocineros enteros. El validador avisa de un tramo de escalera de un número
  impar de filas.
- **Ingredientes como los del original.** Siguen teniendo 4 trozos, ahora de 16:
  64 unidades de ancho, dos cocineros. Los trozos se vuelven a renderizar a 16
  de ancho con los scripts de Blender. Las piezas del laberinto (plataforma,
  cruce, escalera, plato) se redibujan en SVG a 16 de ancho.
- **Tablero de 39×30 casillas (624×480).** El campo de juego del original mide
  31 casillas y así queda centrado, con 4 casillas libres a cada lado. Los
  paneles laterales mantienen su mínimo de 96. El área de juego va de 816 a 1152
  de ancho (antes, de 832 a 1152), y en 16:9 los paneles crecen hasta unas 114
  unidades.
- **Caída a escala ×2.** Las distancias verticales de la caída, que se midieron
  en la grabación con la escala ×3 (#41), se recalculan con la ×2. La caída
  pasa a 113 unidades por segundo: un piso del original, dos cocineros, sigue
  tardando unos 0,57 s. El rebote pasa a 13 unidades y el hundimiento al tocar
  un piso a 8. Los tiempos no cambian.
- **Nueva primera pantalla, como la del original.** El nivel clásico se
  sustituye por uno de 39×30 trazado sobre la primera pantalla del original:
  - ocho pisos a 0, 2, 3, 4, 5, 6, 7 y 9 cocineros del superior;
  - nueve columnas de escalera, una a cada lado de cada hamburguesa y una por
    debajo de cada una;
  - cuatro hamburguesas separadas por escaleras, con sus ingredientes en pisos
    distintos, y los platos abajo;
  - el chef en el centro del piso inferior y los tres enemigos en el superior.
- **Trepar sin trompicones.** Al subir o bajar recto por escaleras
  consecutivas, el chef pasa de una a la siguiente sin saltar ni pararse un
  tick en el cruce. Con pisos más juntos, ese tirón se notaba cada pocos
  pasos. Al cruzar así una plataforma tampoco pisa el ingrediente que haya
  encima.
- **Medidas de las specs en unidades.** Los requisitos que hoy dan distancias y
  velocidades en treintaidosavos de casilla las dan en unidades lógicas, con
  los mismos valores, para que no dependan del tamaño de la casilla.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `level-data`: "Nivel clásico migrado" describe la nueva primera pantalla de
  39×30. Nuevo requisito "Casillas de medio cocinero" (la escala de la
  cuadrícula de un nivel).
- `level-validation`: nuevo requisito "Escaleras de cocineros enteros" (aviso
  de un tramo de escalera con un número impar de filas).
- `screen-layout`: "Tablero central intacto" (624×480, 39×30 casillas de 16) y
  "Área de juego adaptable" (mínimo de 816).
- `navigation-graph`: "Grafo derivado del nivel" y "Alcanzabilidad" (los tramos
  del nuevo nivel clásico: 10 de plataforma y 29 de escalera). "Posición sobre
  el grafo" (margen de 12 unidades).
- `gameplay-rules`: medidas en unidades en "Movimiento horizontal del chef",
  "Escaleras del chef" (que además cruza sin detenerse entre escaleras
  consecutivas), "Aplastamiento de enemigos", "Comportamiento de los
  enemigos", "Pimienta", "Contacto con enemigos y vidas" y "Grosor de los
  ingredientes". Caída a 113 unidades por segundo y rebote de 13 en "Velocidad
  y rebote de la caída" y "Apilado en el plato".
- `character-rigs`: "Personajes por partes" (el chef mide 32 unidades, 2×2
  casillas, y los enemigos lo mismo, con la escala como dato del rig) y
  "Animaciones con interpolación y squash & stretch" (hundimiento de 8
  unidades).
- `vector-assets`: "Guía de estilo" (rejilla de 16) y "Rasterizado a la escala
  de dibujo" (una casilla son 16 unidades).
- `rendered-assets`: "Tamaño y encuadre de las imágenes" (trozo de ingrediente
  de 16 de ancho).
- `view-adapter`: "Paridad jugable con el POC" (la geometría del nivel clásico,
  la rejilla y el tamaño de los personajes cambian a propósito para parecerse
  al original).

## Impact

- Configuración y layout: `src/config.ts` (`TILE` 16, `COLS` 39, `ROWS` 30),
  `src/view/layout/computeLayout.ts` y sus pruebas.
- Simulación: `src/sim/rules.ts` (la conversión de unidades a casillas pasa a
  16; `LADDER_GRAB_DISTANCE` y `STEP_OFF_DISTANCE` a unidades; `FALL_SPEED` y
  `BOUNCE_HEIGHT`), una regla nueva del validador y las pruebas que dependen de
  casillas de 32: cuadrículas de prueba, caídas, pimienta y movimiento.
- Nivel: `src/levels/classic.level.json` y su prueba, y las pruebas que usan el
  nivel clásico.
- Vista: `RigDefinition`, `CharacterRig` y `rigs.ts` (escala por rig y
  personajes colocados por los pies), `IngredientView` (`TOUCH_DOWN`),
  `EventEffects` y `ArtSheetScene` (desplazamientos escritos en casillas),
  `MazeView`.
- Arte: catálogo (`src/view/art/graphics.ts`), SVG del fondo (624×480) y de
  las piezas del laberinto (16 de ancho), y PNG de los ingredientes vueltos a
  renderizar con `tools/blender/ingredients.py` a 16 de ancho (y sus grosores,
  si cambian).
- Documentación: `README.md`, `AGENTS.md` (rejilla, tablero y área de juego),
  `docs/MANUAL.md`, `docs/STYLE_GUIDE.md` (rejilla de 16, tamaños de las piezas
  y de los personajes) y `docs/GAMEDEV_FUNDAMENTALS.md` (la rejilla de
  caracteres del original y la altura del personaje como unidad; medir
  proporciones en una grabación).
- Sin dependencias nuevas. El formato de nivel no cambia: los niveles siguen
  siendo cuadrículas de casillas, ahora de 16.
- GitHub: issue #45, en el hito `v1.0.0`.
