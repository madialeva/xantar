# Design

## Context

- `Simulation` recibe un único `level` (`SimulationOptions`). En el constructor
  calcula el sitio del chef, crea los enemigos con `createEnemy` a partir de
  `level.enemySpawns` (campo `readonly`) y sus entradas; `startBoard()` solo
  rehace el `IngredientField` y recoloca a todos. Al terminar `levelClear`,
  `PhaseHost.rebuildBoard()` llama a `startBoard()`, así que el tablero
  siguiente es el mismo. `GameStats` lleva el número de nivel (`advanceLevel`,
  `newGame` lo deja en 1).
- La dificultad es una Strategy (`paceFor(difficulty)`, `EnemyPace`) con sus
  números en `rules.ts`; Normal empieza en el tercer escalón de ritmo desde el
  nivel 4 (`LATE_PACE_LEVEL`).
- `GameScene` es la raíz de composición de la partida: carga
  `classic.level.json`, crea la `Simulation`, dibuja `MazeView` una vez y una
  `EnemyView` por enemigo una vez; en `boardStarted` solo rehace las vistas de
  los ingredientes.
- `EnemyKind` es `'hotdog' | 'pickle' | 'egg'`, los tres con `ChaseBrain`; el
  pepinillo (`p` en la capa `actors`) no sale en ningún nivel desde #46. Su arte
  sale de `tools/blender/characters.py` (pierna, ojos y cinco fotogramas de
  baile por enemigo); `RigMotion.cycle` recorre los fotogramas de ida y vuelta.

### La referencia: la grabación del original

`tmp/ejemplo-partida-2.webm` (pantalla 2 a 125,6–216 s, 3 a 219,1–306 s y 4 a
307,7–373 s, ver el diseño de is43):

- Enemigos: pantalla 2, tres perritos y un huevo; 3, dos perritos, dos
  pepinillos y un huevo; 4, cuatro perritos y dos pepinillos.
- Pantalla 2: cuatro hamburguesas de cuatro ingredientes con queso, dos platos
  a media altura y dos abajo. Pantalla 3: seis hamburguesas de tres o cuatro
  ingredientes con tomate alrededor de un gran hueco central, platos a tres
  alturas. Pantalla 4: cuatro hamburguesas de ocho ingredientes sobre pisos
  muy juntos.
- El pepinillo es una rodaja verde con pepitas que, al andar, alterna a cada
  imagen de la grabación (15 por segundo) entre de frente (un disco) y de
  canto (una barra a media altura); al subir o bajar una escalera alterna a la
  mitad de ese ritmo. Las piernas siguen abajo y los ojos van en el borde de
  arriba de la rodaja, que baja con ella al ponerse de canto.

## Goals / Non-Goals

**Goals:**

- Cuatro pantallas que se juegan en orden y en bucle, con cada una dos veces en
  Fácil, sin tocar las reglas de cada tablero.
- Pantallas nuevas jugables y comprobadas por pruebas como la clásica.
- Una cebolla con arte renderizado del mismo nivel que los demás enemigos.
- Poder probar cualquier pantalla en desarrollo sin pasar las anteriores.

**Non-Goals:**

- Reproducir la disposición de las pantallas del original: son de diseño
  propio (decisión 1).
- Las pantallas 5 y 6: el original tiene seis; aquí se añaden las tres que
  pide el autor y el juego vuelve a la primera tras la cuarta.
- Ingredientes nuevos (queso, tomate), hamburguesas de ocho ingredientes o más
  de cuatro hamburguesas por pantalla, como en las pantallas 3 y 4 del
  original.
- Comportamiento propio de cada tipo de enemigo (#17): la cebolla persigue
  igual que los demás y a la misma velocidad, como el pepinillo del original.
- Ritmo por pantalla o vueltas más rápidas (#52): el escalón inicial sigue
  dependiendo del número de nivel.
- Elegir pantalla desde el menú o mostrar su nombre en el HUD.

## Decisions

### 1. Pantallas de diseño propio con la progresión del original

Las tres pantallas siguen lo que hace el original al avanzar (cuatro
hamburguesas, platos a distintas alturas, hamburguesas más altas, más enemigos
y las alineaciones medidas), pero con una disposición propia y una idea
distinta cada una. Todas usan la cuadrícula de la clásica: 39×30, campo de las
columnas 4 a 34, carriles de hamburguesa en las columnas 7, 14, 21 y 28,
escaleras entre carriles en 5, 12, 19, 26 y 33, pisos separados por un número
par de filas (escaleras de cocineros enteros) y el chef en el centro del piso
de abajo.

*Alternativa descartada:* trazar las pantallas 2 a 4 sobre la grabación, como
se hizo con la primera en #45. Xantar es una versión propia del clásico, no una
copia de sus recursos, y la disposición de cada pantalla es obra del original,
no una mecánica.

Borradores (generados y comprobados con el cargador, el validador y una prueba
que suelta los ingredientes de abajo arriba: ninguna incidencia, se completan y
quedan asegurados con la última caída). Leyenda: `=` plataforma, `H` escalera,
`+` cruce, `-` pasarela, `_` plato, `T L P B` ingredientes sobre su piso (pan
superior, lechuga, carne, pan inferior), `C` chef, y `h` perrito, `e` huevo y
`o` cebolla en su entrada. Las filas 0 a 2 están vacías en las tres.

**Pantalla 2, Pirámide** (`pyramid.level.json`). Los dos pisos de arriba solo
cubren las hamburguesas centrales; el piso 13, ancho, es el «hombro» por cuyos
lados entran dos enemigos. Abajo, los pisos se reparten a izquierda (17) y a
derecha (19). Entradas: huevo abajo a la derecha (500 ms), perrito por el
hombro izquierdo (1000), perrito por el hombro derecho (2750) y perrito abajo a
la izquierda (4500).

```
 3 .......................................
 4 .......................................
 5 ...........=+=TTTT=+=TTTT=+=...........
 6 ............H......H......H............
 7 ............H......H......H............
 8 ............H......H......H............
 9 ...........=+=LLLL=+==+===+=...........
10 ............H.........H...H............
11 ............H.........H...H............
12 ............H.........H...H............
13 h---=+=TTTT=+======+=LLLL=+=TTTT=+=---h
14 .....H......H......H......H......H.....
15 ....=+=LLLL=+=.....H.....=+=LLLL=+=....
16 .....H......H......H......H......H.....
17 ....=+=PPPP=+=PPPP=+=.....H......H.....
18 .....H.........H...H......H......H.....
19 .....H.........H..=+=PPPP=+=PPPP=+=....
20 .....H.........H...H.............H.....
21 .....H.........H...H.............H.....
22 .....H.........H...H.............H.....
23 h---=+=BBBB===BBBB=C=BBBB===BBBB=+=---e
24 .......................................
25 .......................................
26 .......................................
27 .......................................
28 .......____...____...____...____.......
29 .......................................
```

**Pantalla 3, Mostrador** (`counter.level.json`). Las hamburguesas centrales
terminan en platos en la fila 17, el «mostrador», cuatro filas por debajo del
piso 13 para que la hamburguesa montada no lo toque; por debajo, el piso
19 pasa bajo los platos y la escalera central cruza entre ellos. Debutan las
cebollas, entrando por los lados del mostrador. Entradas: cebolla por la
derecha del mostrador (500 ms), perrito abajo a la izquierda (1000), cebolla
por la izquierda del mostrador (2750), perrito arriba a la derecha (4500) y
huevo arriba a la izquierda (6250).

```
 3 .......................................
 4 .......................................
 5 e---=+======+=TTTT=+=TTTT===TTTT=+=---h
 6 .....H......H......H.............H.....
 7 .....H.....=+=LLLL=+=............H.....
 8 .....H......H......H.............H.....
 9 ....=+=TTTT=+=PPPP=+=LLLL=+=LLLL=+=....
10 ........H..........H......H......H.....
11 ........H.........=+=PPPP=+=.....H.....
12 ........H..........H......H......H.....
13 ....=+=LLLL=+=BBBB=+=BBBB=+==+===+=....
14 .....H......H......H......H..H.........
15 .....H......H......H......H..H.........
16 .....H......H......H......H..H.........
17 o---=+======+=____.H.____=+=PPPP=+=---o
18 .....H......H......H......H......H.....
19 ....=+=PPPP=+==+===+==+===+======+=....
20 .....H.........H...H..H..........H.....
21 .....H.........H...H..H..........H.....
22 .....H.........H...H..H..........H.....
23 h---=+=BBBB====+===C==+=====BBBB=+=....
24 .......................................
25 .......................................
26 .......................................
27 .......................................
28 .......____.................____.......
29 .......................................
```

**Pantalla 4, Torres** (`towers.level.json`). Cuatro torres de pisos cortos,
escalonadas: las de los carriles 7 y 21 tienen pisos en las filas 3, 7, 11, 15
y 19, y las de 14 y 28 en 5, 9, 13, 17 y 21, unidas por las escaleras que
comparten; un puente en la fila 13 une las dos centrales y las escaleras de los
lados y la central se cortan a media altura, así que entre la mitad de arriba y
la de abajo solo se pasa por las columnas 12 y 26. Hamburguesas dobles de seis
ingredientes (pan, lechuga, carne, lechuga, carne y pan) con los platos en la
fila 29, para que la pila de seis quepa bajo el piso 23. Entradas: perrito
abajo a la derecha (500 ms), perrito abajo a la izquierda (1000), cebolla por
la izquierda en la fila 11 (2750), cebolla por la derecha en la 13 (4500),
perrito arriba a la izquierda (6250) y perrito arriba a la derecha (8000).

```
 3 h---=+=TTTT=+=....=+=TTTT=+=...........
 4 .....H......H......H......H............
 5 .....H.....=+=TTTT=+=....=+=TTTT=+=---h
 6 .....H......H......H......H......H.....
 7 ....=+=LLLL=+=....=+=LLLL=+=.....H.....
 8 .....H......H......H......H......H.....
 9 .....H.....=+=LLLL=+=....=+=LLLL=+=....
10 .....H......H......H......H......H.....
11 o---=+=PPPP=+=....=+=PPPP=+=.....H.....
12 ............H.............H......H.....
13 ...........=+=PPPP========+=PPPP=+=---o
14 ............H.............H............
15 ....=+=LLLL=+=....=+=LLLL=+=...........
16 .....H......H......H......H............
17 .....H.....=+=LLLL=+=....=+=LLLL=+=....
18 .....H......H......H......H......H.....
19 ....=+=PPPP=+=....=+=PPPP=+=.....H.....
20 .....H......H......H......H......H.....
21 .....H.....=+=PPPP=+=....=+=PPPP=+=....
22 .....H......H......H......H......H.....
23 h---=+=BBBB=+=BBBB=C=BBBB=+=BBBB=+=---h
24 .......................................
25 .......................................
26 .......................................
27 .......................................
28 .......................................
29 .......____...____...____...____.......
```

Los borradores son el punto de partida: retrasos de entrada y escaleras sueltas
pueden ajustarse al jugarlas, siempre con las pruebas de cada pantalla en
verde. Tras la primera revisión del autor, cada piso sigue al menos una casilla
más allá de las escaleras que lo tocan (decisión 10); los mapas de arriba ya lo
recogen.

### 2. Las pantallas, como lista ordenada de documentos

Cada pantalla es un documento de nivel en `src/levels/` y `src/levels/screens.ts`
exporta la lista ordenada (`SCREEN_DOCUMENTS`: clásica, Pirámide, Mostrador y
Torres). `GameScene`, como raíz de composición, la carga con `loadLevel` y pasa
los `Level` a la simulación: `SimulationOptions.screens: readonly Level[]`
(al menos una) sustituye a `level`. Las pruebas que usan un solo nivel pasan
`screens: [level]`.

*Alternativas:* que la escena cree una `Simulation` por tablero (se pierden
fase, puntuación y vidas, que son de la simulación); o un objeto «campaña» con
estado propio (no hace falta: el estado ya es el número de nivel de
`GameStats`).

### 3. Pantalla de cada nivel: una función pura y un dato por dificultad

La pantalla de un nivel sale de
`screenIndexFor(level, screenCount, boardsPerScreen) =
⌊(level − 1) / boardsPerScreen⌋ mod screenCount`, y `boardsPerScreen` es un
dato de cada dificultad en `difficulty.ts` (`EASY_BOARDS_PER_SCREEN = 2` en
`rules.ts`; Normal y Difícil, 1). El número de nivel sigue contando tableros
completados, así que el HUD y «SIGUIENTE: NIVEL n» no cambian, y el escalón
inicial de Normal sigue yendo por nivel: el nivel 4 de Normal es Torres, que
en el original ya empieza en ×1,07.

*Alternativas:* una Strategy por dificultad como `EnemyPace` (aquí no varía un
comportamiento, solo un número); que en Fácil el nivel cuente pantallas en
lugar de tableros (el HUD repetiría número y el jugador no vería su avance).

### 4. La simulación monta la pantalla al empezar cada tablero

`startBoard()` elige la pantalla del nivel actual. Si es otra, cambia `#level`
y rehace lo que depende de ella: el sitio del chef, las entradas y los
enemigos (`createEnemy` por cada aparición); siempre rehace el campo de
ingredientes y recoloca a todos, como hoy. Esos campos dejan de ser
`readonly`. El getter `level` devuelve la pantalla actual y `enemies` la lista
actual, que solo cambia de identidad cuando cambia la pantalla. Crear enemigos
no usa el generador aleatorio, así que el determinismo no cambia.
`SimulationOptions.startLevel` (1 por defecto) fija el nivel con el que empieza
la partida y al que vuelve `newGame()` (`GameStats` lo recibe), para la ayuda
de desarrollo y las pruebas.

*Alternativa aplazada:* extraer un objeto `Board` con nivel, enemigos y campo.
Movería el contacto, la pimienta y los montados sin que haga falta ahora.

### 5. La vista sigue a la pantalla actual

En `boardStarted`, `GameScene` compara `sim.level` con el nivel que dibuja: si
ha cambiado, destruye el `MazeView` y crea otro; si `sim.enemies` es otra
lista, destruye las `EnemyView` y crea una por enemigo con su tipo. Las vistas
de los ingredientes se rehacen como hoy. El evento no cambia: la vista lee el
modelo.

### 6. La cebolla es una rodaja que gira como una moneda

Como el pepinillo del original, y con los colores que pide el autor: una
rodaja gruesa de cebolla morada (unas 24 unidades de diámetro antes de escalar
el rig) con anillos concéntricos blancos de borde violeta y la piel morada por
fuera, de pie sobre dos piernas moradas con los zapatos blancos de los demás y
los ojos asomando por encima. Tipo `onion` en `EnemyKind`, con `ChaseBrain`, y
símbolo `o` en la capa `actors`, que sustituye a `p`.

*Alternativas:* una cebolla entera girando sobre su eje vertical (la silueta
apenas cambia y los ojos tendrían que esconderse por detrás); un aro de
cebolla (se reconoce peor y no deja ver los colores).

### 7. Arte y animación del giro

- **Blender** (`characters.py`): `build_onion(scene, group, turn)` modela la
  rodaja como un cilindro de bordes redondeados y la gira alrededor del eje
  horizontal de la imagen; el material da los anillos con una rampa sobre la
  distancia al centro de la cara, la piel en el borde, brillo húmedo y algo de
  subsurface. Seis fotogramas de media vuelta en pasos de 30°: `onion.body`
  (de frente, la postura base) y `onion.turn1` a `onion.turn5` (`turn3`, de
  canto), del mismo tamaño que el cuerpo (30×30, como el huevo), más
  `onion.eyes` y `onion.leg`. Se borran los PNG y el código del pepinillo.
- **Rig y estados**: `RigMotion.loop(part, ms)` recorre los fotogramas hacia
  delante y vuelve al primero, a ritmo constante (`cycle` va de ida y vuelta y
  frena en los extremos, que en un giro se lee como un balanceo). Al andar, la
  cebolla da media vuelta por zancada (decisión 13), y los ojos bajan hasta la
  mitad de la rodaja en el fotograma de canto y vuelven a subir, con una
  postura por fotograma que mueve el mismo contador del giro
  (`FrameFollower`), para que nunca se desfasen; al trepar, el mismo giro a la
  mitad de ritmo. Aturdida,
  montada o fuera, los estados comunes (de frente). La escala del rig se ajusta
  para que mida como los demás (`rigHeights.test.ts`).
- La lámina de arte la muestra sola en sus estados, porque recorre
  `enemyRigs`.

### 8. Ayuda de desarrollo: `?screen=N`

Solo con el servidor de desarrollo (`import.meta.env.DEV`), `main.ts` lee
`screen` de la dirección y lo pasa a `GameScene`, que empieza la partida en el
primer nivel de esa pantalla para la dificultad elegida
(`firstLevelOfScreen(screen, boardsPerScreen) = (screen − 1) · boardsPerScreen
+ 1`). Un valor que no sea una pantalla se ignora. El build de producción no
incluye esa rama.

### 9. Pruebas

- Una prueba por pantalla nueva en `src/levels/`, como `classic.level.test.ts`:
  sin incidencias, campo centrado, escaleras de cocineros enteros, enemigos y
  orden de entrada, platos (a media altura en el Mostrador, de seis en Torres),
  se completa soltando de abajo arriba y queda asegurada con la última caída,
  e ida y vuelta por texto. El bucle de «soltar de abajo arriba» pasa a un
  ayudante de `src/sim/testing/` que comparten las cuatro.
- `screens.test.ts`: orden, nombres y carga estricta de la lista.
- Pruebas de `screenIndexFor` y `firstLevelOfScreen`, y de reglas con
  pantallas de prueba pequeñas: siguiente pantalla en Normal, vuelta en
  Difícil, dos tableros por pantalla y vuelta en Fácil, sin cambio al perder
  una vida, `newGame()` y `startLevel`, enemigos de la pantalla nueva; la de
  determinismo cruza un cambio de pantalla.
- Rigs: cinco fotogramas para salchicha y huevo, seis para la cebolla, altura.

### 10. Escaleras dentro de los pisos

En la primera versión de las pantallas había pisos que terminaban justo en una
escalera, y los enemigos se quedaban atascados: en un tramo de plataforma nadie
se acerca a su extremo a menos de `EDGE_MARGIN` (12 unidades), y un enemigo
solo empieza a subir cuando está a menos de `ARRIVAL_THRESHOLD` (3) del centro
de la escalera, así que una escalera en la última casilla queda fuera de su
alcance (el chef sí llega, porque se engancha desde 19,2). La clásica, como el
original, siempre deja una casilla de piso más allá de cada escalera. Se
corrigen los datos (cada piso se alarga una casilla) y el validador avisa
(`ladder-at-floor-end`) para que no vuelva a pasar.

*Alternativa descartada:* dejar que los enemigos empiecen a subir desde el
borde del tramo. Cambiaría una regla de movimiento para tapar un defecto del
nivel, y el original no tiene escaleras así.

### 11. Filas de 21 unidades y plataformas de 8

La primera versión de Torres ponía pisos a dos filas (un tramo) unos encima de
otros y la cabeza del chef los atravesaba. En la grabación del original, la
plataforma es una raya de 2 píxeles, un tramo son 16 y el chef mide unos 15:
entre dos pisos a un tramo cabe con algo de holgura, y 2, 3 o 4 tramos son 2, 3
o 4 cocineros sin contar el solape de la escalera con las plataformas. En
Xantar, con casillas cuadradas de 16, plataformas de 12 y el chef de 32, un
tramo dejaba solo 20 unidades libres.

Decisión del autor: no encoger a los personajes, conservar las 30 filas del
original y usar el espacio en alto, con plataformas de 8. Las filas pasan a
medir 21 unidades (`ROW_UNITS`): un tramo deja 2·21 − 8 = 34 unidades para un
chef de 32. El tablero mide 624×630 y el área de juego, 630 de alto y entre 816
y 1512 de ancho (la misma proporción máxima, 2,4:1). Las casillas siguen
midiendo 16 de ancho.

- **Unidades del núcleo.** Lo medido en el original (velocidades, márgenes,
  umbrales) sigue en su rejilla ×2 dividida por 16 en los dos ejes: subir un
  tramo o caer un piso dura lo mismo que en el original. Lo que depende del
  dibujo (grosor de los ingredientes, altura de un enemigo al aplastarlo,
  contacto vertical, rebote, salida de la escalera) se escribe en unidades y se
  pasa a filas dividiendo por 21. La pimienta mide en unidades en cada eje. Así
  las specs que hablan de unidades dibujadas no cambian, y las velocidades
  verticales pasan a expresarse en filas por segundo.
- **Vista.** `config.ts` deriva `ROW` de `ROW_UNITS`; `platformY` usa filas de
  21, `PLATFORM_TOP` es 4 y `characterY`, 14 por encima de la línea. Las piezas
  SVG de la plataforma, el cruce y la pasarela miden 16×8 y el fondo, 624×630.
- **Menús.** El título, el menú, las opciones y los controles estaban colocados
  para 480 de alto: se desplazan `MENU_TOP` (75) para quedar centrados.
- **Pantallas.** Con un tramo de holgura ya no hace falta separar más los
  pisos: los diseños se mantienen. El validador avisa (`floor-headroom`) de lo
  que quede en la fila justo encima de una casilla por la que se anda.

*Alternativas descartadas:* encoger a los personajes (el autor prefiere usar el
espacio libre); separar los pisos tres filas (rompería las 30 filas y los
tramos de dos filas del original); no apilar pisos a un tramo (es parte del
original y limitaría las pantallas).

### 12. Escalera renderizada

Con filas más altas, la escalera SVG de dos peldaños por fila quedaba
desproporcionada. `tools/blender/maze.py` la modela en madera barnizada y
renderiza una fila de 16×21 con cuatro peldaños (cada 5,25 unidades; en el
original van cada 2 píxeles, 4 unidades) que se repite sin costuras, y los
largueros de 16×8 que se dibujan sobre cada cruce (`ladder.rails`), cuya
ranura sigue siendo SVG. El encuadre de cámara pasa a `common.py`
(`frame_camera`, `render_framed`) para compartirlo con los personajes. Es un
primer paso del escenario renderizado (#38).

### 13. Cebolla más lenta

El giro de media vuelta por paso se veía demasiado deprisa: pasa a media vuelta
por zancada (dos pasos, 260 ms) al andar y a la mitad al trepar.

## Risks / Trade-offs

- [Pantallas propias desequilibradas o aburridas] → Los borradores ya pasan el
  validador y la prueba de completarse; el autor las juega con `?screen=N`
  antes del PR y se ajustan entradas y escaleras sin cambiar las specs.
- [La hamburguesa montada en un plato a media altura choca con el piso de
  encima] → El plato está cuatro filas por debajo del piso 13 y la pila de
  cuatro, con la cúpula del pan, mide algo más de tres: quedan unas 5 unidades
  de hueco; se comprueba en `npm run dev` con `?screen=3`.
- [Platos en la fila 29, la última, en Torres] → El plato ocupa de 467 a 477 de
  las 480 unidades del tablero y la pila de seis queda unas 16 unidades por
  debajo del piso 23; se comprueba al jugar con `?screen=4`.
- [Torres es larga: 24 ingredientes] → Es la última pantalla antes de volver a
  empezar; si resulta pesada, se quita un piso a cada torre.
- [Recrear enemigos deja vistas huérfanas] → La vista rehace sus enemigos por
  identidad de la lista; la prueba de humo y la partida del autor lo cubren.
- [El giro se ve como un parpadeo] → Seis fotogramas a ritmo constante; se
  ajusta la duración mirando la lámina de arte.
- [Quitar `p` rompe documentos de fuera] → No hay ninguno publicado (#7 aún no
  existe); la carga da un error claro con la posición.
- [El tablero más alto se ve más pequeño en la misma ventana] → Decisión del
  autor; los menús se recentran y el HUD se adapta a los paneles, más anchos.
- [Lienzo más grande] → Con el nivel de escala 4, en 16:9 el lienzo pasa de
  unos 3400×1920 a 4480×2520 píxeles; hay que comprobar que la gráfica
  integrada de referencia mantiene 60 fps (#23 trata el nivel de escala
  automático).
- [Velocidades verticales en otra unidad] → Las specs las dan en filas por
  segundo con su equivalente en unidades; las pruebas del núcleo, que trabajan
  en filas, no cambian.

## Migration Plan

- Sin migración de datos: los ajustes no cambian y el formato de nivel sigue en
  la versión 1. Un documento con `p` deja de cargar con un error que indica el
  símbolo y su posición.
- Vuelta atrás: revertir los commits; el arte generado está versionado.
