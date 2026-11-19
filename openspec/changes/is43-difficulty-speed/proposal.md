# Proposal

## Why

Las caídas de los ingredientes ya tienen la cadencia del original (#41), pero
el chef y los enemigos conservan las velocidades del prototipo, y los enemigos
van siempre igual de rápido. El autor quiere poder elegir la dificultad: que
alguien que no ha jugado nunca pueda jugar tranquilo, que lo normal sea el
original y que haya un modo muy rápido. Además faltan dos reglas: al perder una
vida, los ingredientes a medio pisar deben volver a estar sin pisar, y una vez
soltado el último ingrediente que completa el tablero, el chef no debe poder
perder una vida (#43).

La grabación nueva del original (`tmp/ejemplo-partida-2.webm`, pantallas 1 a 4)
muestra:

- **Velocidades.** El chef anda a 0,75 px por fotograma y sube a la mitad; los
  enemigos van a 5/8 de la velocidad del chef, andando y subiendo. En Xantar,
  con la escala de #45 (un píxel del original son 2 unidades), son 86 y 43
  unidades por segundo para el chef y 54 y 27 para los enemigos; hoy son 115,
  80, 68 y 68.
- **La velocidad de los enemigos sube con el tiempo, no de pantalla a
  pantalla.** Dentro de cada tablero sube un poco a los 21,75 s (×1,03) y a
  los 43,5 s (×1,07), y a los 65 s da un acelerón (×1,25). Vuelve a la base al
  empezar cada tablero y al volver a jugar tras perder una vida. Las pantallas
  1 a 3 empiezan a la misma velocidad; la 4 empieza ya en el segundo escalón.
- **El número de enemigos va con cada pantalla** (4, 4, 5 y 6 en las cuatro
  primeras): llegará con las pantallas nuevas de #49.
- **Al perder una vida**, el pan que el chef había pisado a medias vuelve a
  estar entero tras "GET READY".
- **Al soltar el último ingrediente**, el chef sigue andando hasta que este
  toca el plato y entonces celebra, mientras los enemigos se siguen moviendo
  hasta que el ingrediente se asienta.

## What Changes

- **Velocidades del original.** El chef anda a 86 unidades/s y sube y baja
  escaleras a 43. Los enemigos andan a 54 y suben y bajan a 27 (hoy suben a la
  misma velocidad a la que andan), multiplicadas por el factor que marca la
  dificultad. La entrada por las pasarelas va a la velocidad de andar.
- **Dificultad.** Nueva opción en Opciones: Fácil, Normal (por defecto) o
  Difícil. Se guarda con los demás ajustes y se aplica a la siguiente partida.
  - **Fácil:** enemigos siempre a ×0,75.
  - **Normal:** la curva del original: ×1 al empezar cada tablero o volver tras
    perder una vida, ×1,03 a los 21,75 s de juego, ×1,07 a los 43,5 s y ×1,25 a
    los 65,25 s. Desde el nivel 4, el tablero empieza en ×1,07.
  - **Difícil:** enemigos siempre a ×1,25, la velocidad más alta del original.
- **Pisadas tras perder una vida.** Al volver a jugar tras perder una vida, los
  ingredientes quietos tienen todos sus segmentos sin pisar. Los ya apilados
  siguen apilados y los que estaban cayendo terminan su caída.
- **Nivel asegurado.** En cuanto se sabe que los ingredientes que están cayendo
  completarán todas las hamburguesas sin que el chef haga nada más (el último
  ingrediente, o uno con enemigos montados que acabará en el plato, o una cadena
  que lo empuja), el tablero queda asegurado: los enemigos ya no le quitan
  vidas al chef, que sigue jugando hasta que se completa el nivel como hoy.
- **BREAKING (sensación de juego):** el chef y los enemigos van más despacio que
  ahora y los enemigos suben las escaleras a la mitad de su velocidad.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `gameplay-rules`: "Movimiento horizontal del chef" (86 unidades/s),
  "Escaleras del chef" (43 unidades/s), "Comportamiento de los enemigos"
  (velocidad de andar y de subir del momento), "Entrada de los enemigos"
  (velocidad de andar del momento), "Pisado de segmentos" y "Contacto con
  enemigos y vidas" (pisadas que se deshacen al perder una vida; sin pérdida de
  vida con el tablero asegurado); nuevos requisitos "Velocidad de los enemigos
  según la dificultad" y "Tablero asegurado".
- `player-settings`: "Ajustes persistentes" y "Datos ausentes o dañados"
  (dificultad guardada, Normal por defecto).
- `game-flow`: "Menú principal y opciones" (opción de dificultad).

## Impact

- Simulación (`src/sim/`): `rules.ts` (velocidades, escalones de la curva y
  factores de cada dificultad), `Simulation` (dificultad en las opciones, reloj
  de juego del tablero, ritmo de los enemigos, tablero asegurado, pisadas que se
  deshacen al volver a jugar), `Enemy` (velocidad de andar y de subir que le da
  la simulación), `IngredientField`, `Ingredient` y `Plate` (copia para prever el
  final de las caídas), `Chef` (velocidades nuevas) y sus pruebas.
- Ajustes y menú: `PlayerSettings`, `Settings`, `MenuScene`, `GameScene` (pasa
  la dificultad a la simulación) y los catálogos `es.ts` y `en.ts`.
- Documentación: `README.md` (dificultad, nuevas reglas), `docs/MANUAL.md`
  (reglas, ajustes, simulación) y `docs/GAMEDEV_FUNDAMENTALS.md` (curva de
  dificultad y previsión del resultado sobre una copia).
- El registro de ajustes sigue en la versión 1: la dificultad es un campo nuevo
  que toma su valor por defecto.
- GitHub: issue #43, que pasa a incluir la dificultad y las dos reglas; hito
  `v1.0.0`.
