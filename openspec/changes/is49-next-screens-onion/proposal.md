# Proposal

## Why

Xantar tiene una sola pantalla: al completarla vuelve a empezar la misma. El
original pasa a pantallas nuevas, con otros pisos, otras hamburguesas y más
enemigos, y vuelve a la primera después de la última (#49). El autor quiere tres
pantallas nuevas, que el paso de nivel funcione como en el original salvo en
Fácil, donde cada pantalla se jugará dos veces para que quien empieza pueda
practicar, y sustituir al pepinillo por un enemigo propio: una cebolla morada,
blanca y violeta, que gira al andar como el pepinillo del original.

La grabación del original (`tmp/ejemplo-partida-2.webm`, pantallas 1 a 4)
muestra:

- **Enemigos por pantalla.** 1: tres perritos y un huevo. 2: tres perritos y un
  huevo. 3: dos perritos, dos pepinillos y un huevo. 4: cuatro perritos y dos
  pepinillos.
- **Más difícil cada vez.** Desde la pantalla 2 hay platos a distintas alturas
  e ingredientes nuevos (queso, tomate); la 3 tiene seis hamburguesas más bajas
  alrededor de un gran hueco central y la 4, cuatro hamburguesas de ocho
  ingredientes. La 4 empieza ya con los enemigos en el tercer escalón de ritmo
  (lo que Xantar hace desde el nivel 4, #43).
- **El pepinillo es una rodaja que gira como una moneda.** Al andar y al subir
  escaleras alterna entre la rodaja de frente (un disco con pepitas) y de canto
  (una barra), con los ojos asomando por el borde de arriba.

Las pantallas nuevas serán de diseño propio: siguen la progresión del original
(cuatro hamburguesas, más enemigos y más ingredientes según se avanza, con las
alineaciones de enemigos medidas), pero no calcan su disposición. Xantar es una
versión propia del clásico, no una copia de sus recursos, y la cebolla va en la
misma línea.

## What Changes

- **Tres pantallas nuevas**, tras la clásica, cada una con cuatro hamburguesas
  y su propia idea:
  - **2, Pirámide:** los dos pisos de arriba solo cubren las hamburguesas
    centrales; los enemigos entran por los lados de un piso intermedio y del de
    abajo. Tres perritos y un huevo.
  - **3, Mostrador:** las dos hamburguesas centrales terminan en platos a media
    altura, sobre un mostrador por debajo del cual se puede pasar. Debutan las
    cebollas: dos perritos, dos cebollas y un huevo.
  - **4, Torres:** cuatro torres de pisos cortos, escalonadas, con hamburguesas
    dobles de seis ingredientes. Cuatro perritos y dos cebollas.
- **Orden de las pantallas.** Al completar un tablero se pasa a la pantalla
  siguiente, y tras la cuarta se vuelve a la primera. En Fácil cada pantalla se
  juega dos veces seguidas. El número de nivel sigue contando tableros
  completados, así que en Fácil los niveles 1 y 2 son la primera pantalla, el 3
  y el 4 la segunda, etc.
- **Cebolla morada en lugar del pepinillo.** Un enemigo nuevo, `onion`, con el
  mismo comportamiento que los demás: una rodaja gruesa de cebolla morada, con
  anillos blancos y violetas y piel morada en el borde, sobre dos piernas, que
  gira como una moneda al andar y al subir escaleras, con los ojos asomando por
  encima. Arte renderizado con el script de Blender, como el resto.
- **BREAKING (formato de nivel):** el símbolo `p` (pepinillo) deja de existir y
  `o` es la cebolla. Ningún nivel del proyecto usa `p`.
- **Vista.** Al empezar un tablero de otra pantalla se dibujan su laberinto y
  sus enemigos.
- **Ayuda de desarrollo.** En el servidor de desarrollo, `?screen=N` empieza la
  partida en la pantalla N, para probar las pantallas sin pasar las anteriores.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `level-data`: nuevo requisito "Pantallas del juego" (las cuatro pantallas,
  sus enemigos y sus entradas).
- `level-pieces`: "Piezas de la versión 1" (`o` cebolla en lugar de `p`
  pepinillo).
- `gameplay-rules`: "Fin de nivel" (el tablero siguiente es el de la pantalla
  que toca); nuevo requisito "Orden de las pantallas".
- `character-rigs`: "Bailes de los enemigos" (la cebolla gira en lugar del
  contoneo del pepinillo).
- `rendered-assets`: "Fotogramas de baile" (fotogramas de giro de la cebolla);
  nuevo requisito "Aspecto de la cebolla".
- `view-adapter`: "Laberinto a partir del nivel cargado" (se redibuja al
  cambiar de pantalla, con sus enemigos).

## Impact

- Niveles: tres documentos nuevos en `src/levels/` con sus pruebas y la lista
  ordenada de pantallas.
- Simulación (`src/sim/`): `EnemyKind` y registro de piezas (`onion`, `o`),
  `createEnemy`, `Simulation` (recibe las pantallas y monta en cada tablero la
  que toca, con sus enemigos), `difficulty.ts` y `rules.ts` (tableros por
  pantalla), `GameStats` (nivel inicial) y sus pruebas.
- Vista: `GameScene` (carga las pantallas, redibuja laberinto y enemigos al
  cambiar de pantalla), `main.ts` (`?screen=N` solo en desarrollo), rigs,
  estados y `RigMotion` (vuelta de fotogramas hacia delante), catálogo de
  gráficos y PNG de la cebolla (fuera los del pepinillo),
  `tools/blender/characters.py`.
- Documentación: `README.md` (pantallas, Fácil, cebolla), `docs/MANUAL.md`
  (pantallas y orden, cebolla, `--only onion`, `?screen=N`),
  `docs/STYLE_GUIDE.md` (cebolla) y `docs/GAMEDEV_FUNDAMENTALS.md` (progresión
  de pantallas y curva de aprendizaje).
- Sin dependencias nuevas. El formato de nivel sigue en la versión 1.
- GitHub: issue #49, que pasa a describir pantallas de diseño propio, el orden
  con Fácil y la cebolla; hito `v1.0.0`.
