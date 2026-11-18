# Design

## Context

- El tablero mide 640×480, 20×15 casillas de 32 (`src/config.ts`). La
  simulación trabaja en casillas cuadradas: `x` en columnas, `y` en filas. Sus
  constantes se escriben en unidades y se convierten con `fromPx` sobre
  `POC_TILE_PX = 32` (`src/sim/rules.ts`). Solo `LADDER_GRAB_DISTANCE` (0,6) y
  `STEP_OFF_DISTANCE` (0,4) están escritas directamente en casillas.
- La vista multiplica por `TILE`. Un personaje en la fila `r` se ancla en
  `y = r·TILE`, media casilla por encima de la línea de la plataforma, y su rig
  pone los pies en `+10`: sobre el suelo (línea − 6) solo porque la casilla
  mide 32.
- La casilla de 32 es a la vez trozo de ingrediente, ancho de escalera y unidad
  vertical. El chef (`src/view/rigs/rigs.ts`) mide unas 39 unidades de lo alto
  del gorro (−29,4) a los pies (+10); los enemigos, unas 38. `ENEMY_HEIGHT` ya
  vale 32.
- El nivel clásico tiene cuatro pisos a 3 filas (96 unidades) unos de otros,
  dos parejas de hamburguesas pegadas y escaleras solo en las columnas 0, 9, 10
  y 19.
- La caída de #41 se calibró con la escala ×3: `FALL_SPEED = fromPx(170)`,
  `BOUNCE_HEIGHT = fromPx(20)` y el hundimiento de la vista de 12 unidades. Los
  grosores de los ingredientes salen del arte (`tmp/blender/metrics.json`).
- Las reglas ya admiten escaleras que pasan por debajo de un ingrediente: el
  chef no pisa segmentos mientras está en la escalera.
- Los PNG de los ingredientes los genera `tools/blender/ingredients.py` con el
  ancho de casilla de `tools/blender/common.py` (`TILE = 32`); el script de los
  personajes no usa ese valor.

### La referencia: la primera pantalla del original

Medida en la grabación (`tmp/ejemplo-partida.webm`, 14–48 s; recorte
1080×1080 desde x = 420, 4,5 píxeles de vídeo por píxel del original en
vertical). Se clasificaron los colores (remates cian de plataforma, plataforma
azul, escalera gris, ingredientes) a lo largo de cada columna de escalera y de
cada piso, y se tomó lo que aparece en más de la mitad de los fotogramas para
quitar a los personajes y a los ingredientes que caen.

- La pantalla es una rejilla de caracteres de 8 px: 32×30 caracteres.
- El chef mide 2×2 caracteres (16 px).
- Todos los pisos están a un número par de caracteres. De arriba abajo, a 0, 2,
  3, 4, 5, 6, 7 y 9 cocineros del superior. Los platos quedan unos 2,3
  cocineros por debajo del inferior.
- Cada ingrediente mide 4 caracteres (32 px, dos cocineros). Siguiendo el pan
  de la calle 3 mientras el chef lo cruza (17,6–19 s), se hunde en 4 escalones
  de unos 8 px: son cuatro trozos de un carácter. La inclinación escalonada del
  pan pisado es la de #42.
- Hay nueve columnas de escalera, h0…h8, a 3 caracteres unas de otras, de un
  carácter de ancho. Las de número par (h0, h2, h4, h6, h8) separan las
  hamburguesas y las de número impar pasan por debajo de ellas. Una calle
  completa mide 6 caracteres.

| Piso | Plataformas (entre columnas) | Ingredientes |
|---|---|---|
| 0 | h0–h8 | pan en las calles 2, 3 y 4 |
| 2 | h0–h2, h4–h8 | pan en la 1; lechuga en la 3 y la 4 |
| 3 | h2–h4 | — |
| 4 | h0–h2, h6–h8 | lechuga en la 1; carne en la 4 |
| 5 | h2–h6 | lechuga en la 2; carne en la 3 |
| 6 | h6–h8 | pan de abajo en la 4 |
| 7 | h0–h6 | carne en la 1 y la 2 |
| 9 | h0–h8 | pan de abajo en la 1, la 2 y la 3 |

| Escalera | Tramos (de piso a piso) |
|---|---|
| h0 | 0–2, 4–9 |
| h1 | 2–7 |
| h2 | 0–9 |
| h3 | 0–3 |
| h4 | 0–9 |
| h5 | 2–5 |
| h6 | 0–9 |
| h7 | 4–9 |
| h8 | 0–4, 6–9 |

## Goals / Non-Goals

**Goals:**

- Que la rejilla del tablero sea la del original a escala ×2: una casilla es
  medio cocinero y un trozo de ingrediente.
- Una primera pantalla que se lea como la del original, con la misma
  estructura de pisos, escaleras e ingredientes.
- Que el juego se sienta igual en unidades por segundo: las velocidades y
  distancias de la simulación conservan su tamaño en unidades, salvo la caída.

**Non-Goals:**

- Las velocidades del chef, de los enemigos y de las escaleras del original
  (#43): siguen las del POC en unidades por segundo.
- Volver a renderizar a los personajes: se escalan en la vista.
- Cómo entran los enemigos en el original (por los lados y a distintas
  alturas): siguen apareciendo en el piso superior.
- Recalibrar las distancias que dependen del tamaño de los personajes (alcance
  de la pimienta, contacto chef–enemigo, margen de los extremos de un tramo).
- La inclinación del ingrediente pisado y el arco del rebote (#42).
- Más niveles o el editor de niveles (#7).

## Decisions

### 1. La casilla es medio cocinero (16 unidades)

La casilla pasa de 32 a 16 unidades: un carácter del original a escala ×2. El
chef mide 2×2 casillas (32 unidades), un trozo de ingrediente es una casilla y
un ingrediente de cuatro trozos mide 64 unidades, dos cocineros, como en el
original. La escala vertical respecto al original es ×2 y las 30 filas del
tablero son las 30 filas de caracteres del original.

La simulación sigue en casillas cuadradas y su modelo no cambia. Lo que cambia
es el tamaño de la casilla:

- `src/sim/rules.ts` exporta `CELL_UNITS = 16` y `fromPx` divide por ella.
  `src/config.ts` deriva `TILE` de ese valor (la vista depende del dominio, no
  al revés).
- `LADDER_GRAB_DISTANCE` y `STEP_OFF_DISTANCE` pasan a unidades:
  `fromPx(19.2)` y `fromPx(12.8)`, el mismo tamaño que hoy.
- Las demás constantes ya están en unidades, así que conservan su tamaño en
  pantalla: en casillas valen el doble.

Alternativas descartadas:

- Mantener la casilla de 32 con un chef de una fila (la primera versión de este
  cambio). Las hamburguesas quedan del doble de ancho que en el original y
  hacen falta 21 columnas para separarlas con escaleras.
- Ingredientes de 6 trozos. El original tiene 4, y el paso escalonado que se
  busca es la inclinación del pan pisado (#42).
- Ingredientes que no ocupen casillas enteras. No encajan con las columnas de
  escalera, y la regla de pisado y el formato de nivel tendrían que aprender
  medias casillas.
- Casillas no cuadradas (16 de ancho y 32 de alto). Obligan a separar las
  unidades de los dos ejes en toda la simulación.

### 2. Tablero de 39×30 casillas

Con escaleras de una casilla centradas en un hueco de tres, cada calle mide 7
casillas (3 de hueco y 4 de hamburguesa), y el campo de juego, 4 · 7 + 3 = 31.
En 39 columnas (624 unidades) queda centrado, con 4 casillas libres a cada
lado. `COLS = 39`, `ROWS = 30` y `GAME_WIDTH = 624`. El fondo `board.backdrop`
se redibuja a 624×480 (SVG y catálogo).

`MIN_PANEL_WIDTH` se queda en 96, así que el área de juego va de 816 a 1152. En
16:9 sigue midiendo 853 y llena la ventana, con paneles de 114,5.

Alternativa descartada: 40 columnas (640, el ancho de hoy). Las piezas no
pueden centrarse: el campo quedaría desplazado una casilla.

### 3. La nueva primera pantalla

Correspondencia con el original:

- Columnas: cada hueco entre calles son tres casillas con la escalera en la del
  centro (h0 → 5, h2 → 12, h4 → 19, h6 → 26, h8 → 33). Las hamburguesas ocupan
  las columnas 7–10, 14–17, 21–24 y 28–31, con una casilla libre a cada lado.
  La escalera de debajo de cada hamburguesa va en su segunda casilla (h1 → 8,
  h3 → 15, h5 → 22, h7 → 29). Un tramo de plataforma «hA–hB» va del principio
  del hueco de hA al final del de hB; por ejemplo, h0–h8 son las columnas 4–34.
- Filas: el piso de altura u (en cocineros) va a la fila 5 + 2u. Los pisos
  quedan en las filas 5, 9, 11, 13, 15, 17, 19 y 23, y los platos en la 28, como
  en el original. Las filas 0–4 quedan libres.

```
     structure / ingredients / actors (columnas 0–38)
 5   ....=+======+==+===+======+======+=....  ..............TTTT...TTTT...TTTT.......  .....h.............p.............e.....
 6   .....H......H..H...H......H......H.....
 7   .....H......H..H...H......H......H.....
 8   .....H......H..H...H......H......H.....
 9   ....=+==+===+=.H..=+==+===+======+=....  .......TTTT..........LLLL...LLLL.......
10   ........H...H..H...H..H...H......H.....
11   ........H..=+==+===+=.H...H......H.....
12   ........H...H......H..H...H......H.....
13   ....=+==+===+=.....H..H..=+==+===+=....  .......LLLL.................PPPP.......
14   .....H..H...H......H..H...H..H.........
15   .....H..H..=+======+==+===+=.H.........  ..............LLLL...PPPP..............
16   .....H..H...H......H......H..H.........
17   .....H..H...H......H.....=+==+===+=....  ............................BBBB.......
18   .....H..H...H......H......H..H...H.....
19   ....=+==+===+======+======+=.H...H.....  .......PPPP...PPPP.....................
20   .....H......H......H......H..H...H.....
21   .....H......H......H......H..H...H.....
22   .....H......H......H......H..H...H.....
23   ....=+======+======+======+==+===+=....  .......BBBB...BBBB...BBBB..............  ...................C...................
28   .......____...____...____...____.......
```

Las filas 0–4, 24–27 y 29 están vacías en las tres capas. Resultado,
comprobado con un script sobre esta cuadrícula:

- 10 tramos de plataforma y 29 de escalera, ninguno colgante.
- Todos los tramos de escalera tienen un número par de filas.
- Cada ingrediente está sobre su plato y todos los pisos están conectados.

El chef empieza en el centro del piso inferior (fila 23, x = 19,5). Los
enemigos aparecen en el piso superior, sobre las escaleras de los bordes y del
centro: perrito en x = 5,5, pepinillo en 19,5 y huevo en 33,5.

Con un enemigo montado, el pan de arriba de la calle 3 (columnas 21–24) baja
tres pisos (filas 9, 15 y 19) golpeando a la lechuga y a la carne. Con dos, el
pan de la calle 1 llega al plato antes de agotar sus cinco soportes. Los
escenarios de enemigos montados siguen valiendo.

### 4. Aviso de escaleras de un número impar de filas

Una regla nueva del validador (`ladder-odd-span`, aviso) recorre los tramos de
escalera del grafo y señala los que unen cruces separados por un número impar
de filas. Es un aviso y no un error: el nivel se juega igual, solo deja de
medir cocineros enteros. Así el editor de niveles (#7) lo heredará.

### 5. Personajes de 2×2 casillas, colocados por los pies

`RigDefinition` gana `scale` (por defecto 1). `CharacterRig` aplica esa escala
con el origen en los pies (`FEET_Y = 10`, la suela en la postura base). Las
vistas de los personajes dejan de depender de que media casilla sean 16
unidades: colocan el rig de modo que los pies queden en el suelo de la
plataforma (`platformY(y) − 6`). Las animaciones son desplazamientos relativos
a la postura base, así que se escalan con el personaje.

El valor de cada rig sale de medir la altura visible de su postura base:
píxeles opacos de cada parte colocada como en el rig, a partir de las imágenes
de `src/view/art/sources/`. Se fija en `rigs.ts`: unos 32/39 ≈ 0,82 para el
chef, y lo que deje a cada enemigo entre 30 y 33 unidades. Una prueba lo
comprueba con los recortes opacos medidos.

Alternativa descartada: volver a renderizar a los personajes más pequeños.
Habría que reescalar a mano todas las posiciones de los rigs, y no se gana
nitidez: las imágenes están a 4×, de sobra para dibujarlas al 82 %.

### 6. Arte a 16 de ancho

- **SVG:** las piezas del laberinto pasan a 16 de ancho, con el mismo alto
  (`platform.*` y `crossing` 16×12, `ladder` 16×16, `plate.*` 16×10), con
  remates y peldaños pensados para ese ancho. La guía de estilo recoge la
  rejilla de 16.
- **Ingredientes:** `tools/blender/common.py` pasa a `TILE = 16` y se ejecuta
  `ingredients.py` con el Blender del autor (ver `AGENTS.md`). Las texturas y
  las semillas se repiten una vez por casilla, ahora de 16, y el catálogo pasa a
  16×(12–18). Si el render cambia los grosores medidos (`metrics.json`), se
  actualizan `INGREDIENT_THICKNESS` y el requisito "Grosor de los ingredientes".

### 7. Caída a escala ×2

Las distancias verticales medidas en el original se multiplican por 2 en lugar
de por 3. Los tiempos no cambian:

| Constante | Original | Antes (×3) | Ahora (×2) |
|---|---|---|---|
| `FALL_SPEED` | ≈ 1 px por fotograma | `fromPx(170)`: un piso de 96 en 34 ticks | `fromPx(113)`: dos cocineros (64) en 34 ticks |
| `BOUNCE_HEIGHT` | 6–7 px | `fromPx(20)` | `fromPx(13)` |
| Hundimiento al tocar un piso (`TOUCH_DOWN`) | 4–5 px | 12 | 8 |

### 8. Cruce sin detenerse entre escaleras consecutivas

Al jugar con la rejilla nueva, el chef daba un tirón en cada cruce al trepar
recto. La simulación lo explica: al quedarle menos de `ARRIVAL_THRESHOLD` (3
unidades) se le coloca en la plataforma, un salto de hasta 4 unidades (el
triple de un paso), y en el tick siguiente se engancha a la escalera de arriba
sin moverse. Además, la vista cambia de trepar a estar en la plataforma y
vuelta a trepar, y la animación se reinicia. Ya pasaba antes, pero cada 72
ticks; ahora, con pisos a dos cocineros, cada 46 o incluso cada 23.

`Chef` busca, al trepar, la escalera que continúa en la misma columna y en el
mismo sentido (`graph.ladderNear(extremo, x, sentido, 0)`). Si existe, cuando
el paso llega al cruce pasa a ella en el mismo tick con lo que sobra, sin el
umbral de llegada; si no, llega a la plataforma como hasta ahora. Bajarse a
la plataforma del cruce sigue funcionando con la entrada lateral
(`STEP_OFF_DISTANCE`). Como el chef nunca queda sobre esa plataforma, ya no
pisa el segmento de un ingrediente que esté encima del cruce, como pide la
regla de no pisar desde una escalera.

Alternativa descartada: quitar solo el tick parado. El salto del umbral y el
cambio de animación seguirían produciendo el tirón.

Los enemigos tienen su propio movimiento y deciden al final de cada escalera;
quedan como están.

### 9. Pruebas

- Las pruebas de la simulación usan sus propias cuadrículas
  (`src/sim/testing`), que siguen valiendo en casillas. Cambian las que fijan
  distancias en casillas de 32 (velocidades, caídas, pimienta, márgenes): se
  expresan con `fromPx` o en unidades.
- `classic.level.test.ts` se reescribe para la pantalla nueva y
  `NavigationGraph.test.ts` pasa a 10 y 29 tramos.
- `computeLayout.test.ts`: tablero de 624, mínimo de 816 y paneles de 114,5 en
  16:9.
- Pruebas nuevas: la regla `ladder-odd-span`, la escala del rig con los pies
  fijos, la altura del chef y de los enemigos, y el cruce sin detenerse entre
  escaleras consecutivas.

## Risks / Trade-offs

- **Personajes un 18 % más pequeños y hamburguesas a la mitad de ancho; peor en
  un móvil.** El tablero se escala a la ventana y en 16:9 los paneles crecen. Se
  revisa en el smoke en 19,5:9; la escala del rig es un dato.
- **Trepar un piso cuesta menos (dos cocineros son 64 unidades en lugar de 96 a
  la misma velocidad).** Es la proporción del original; las velocidades del
  original llegarán con #43.
- **Las distancias de pimienta, contacto y márgenes se pensaron para casillas
  de 32 y un chef de 39.** Conservan su tamaño en unidades y siguen siendo
  razonables para un chef de 32; se revisan al jugar y quedan fuera de este
  cambio.
- **Pasar a casillas de 16 rompe pruebas con números en casillas.** La
  simulación se cambia en un bloque propio, con la pantalla clásica convertida
  provisionalmente a la rejilla nueva (cada casilla en 2×2), y solo después se
  sustituye la pantalla.
- **El nuevo render de los ingredientes puede cambiar su aspecto o sus
  grosores.** Se revisa en la hoja de arte y, si cambian los grosores, se
  actualizan la constante y la spec en el mismo bloque.
- **El chef que llega por una escalera a un piso bajo una hamburguesa pisa el
  segmento de esa columna al salir a la plataforma.** Es la regla actual (pisa
  al estar en la plataforma) y coincide con el original.

## Migration Plan

No hay datos guardados que dependan del nivel ni del tamaño del tablero: los
ajustes y el récord no cambian. Para deshacerlo basta con revertir los commits
del cambio.
