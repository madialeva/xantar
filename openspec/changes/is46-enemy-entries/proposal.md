# Proposal

## Why

Con la primera pantalla del original ya en el nivel clásico (#45), los
enemigos siguen comportándose de otra manera. En Xantar aparecen los tres a la
vez en el piso superior y, al soltar a los que van montados en un ingrediente,
reaparecen en un punto de aparición cualquiera. En la grabación del original:

- **Entrada.** Al empezar la pantalla no hay ningún enemigo. Van entrando uno a
  uno desde fuera del tablero, por los extremos de los pisos superior e
  inferior: un huevo por abajo a la derecha (a 0,5 s), un perrito por abajo a la
  izquierda (1 s), otro por arriba a la derecha (2,75 s) y otro por arriba a la
  izquierda (4,5 s). Son cuatro: tres perritos y un huevo.
- **Montados.** Cuando termina la caída de un ingrediente con un enemigo
  montado, el enemigo desaparece con su bonificación y, unos 2,5 s después,
  vuelve a aparecer justo donde paró el ingrediente, y sigue persiguiendo al
  chef.

El autor quiere ambas cosas como en el original (#46).

## What Changes

- **Pasarelas de entrada.** Pieza nueva de nivel, `-`: un tramo de pasarela
  pegado al extremo de una plataforma. Lo recorren los enemigos al entrar, pero
  el chef no puede pisarla y no forma parte del grafo de navegación. Se dibuja
  como una prolongación más oscura del piso.
- **Entrada de los enemigos.** Un marcador de enemigo sobre una pasarela es una
  entrada: al empezar cada tablero, y tras perder una vida, el enemigo está
  fuera del tablero y, al cabo de su retraso, aparece en el marcador y entra
  andando por la pasarela hasta el piso, desde donde persigue al chef. Mientras
  entra, se le puede aturdir y alcanza al chef como cualquier enemigo. Un
  marcador sobre una plataforma sigue funcionando como hoy: aparece allí.
- **Retrasos de entrada como datos.** El documento de nivel admite una lista
  opcional `entries` con el retraso (en ms, contado desde que empieza la fase
  `playing`) de cada marcador de enemigo. Sin ella, todos entran a la vez.
- **Reaparición.** Un enemigo aplastado vuelve, a los 150 ticks, entrando por
  uno de los marcadores del nivel elegido con el generador aleatorio. Un enemigo
  montado vuelve a los 150 ticks en el piso donde se detuvo su ingrediente, en
  la misma posición horizontal; si el ingrediente acabó en el plato, en la
  plataforma de abajo justo encima de la hamburguesa.
- **Nivel clásico.** Cuatro enemigos como en el original: tres perritos y un
  huevo, entrando por pasarelas de 4 casillas a los dos lados de los pisos
  superior e inferior, con los retrasos medidos. El pepinillo deja de aparecer
  en la primera pantalla.
- **Validación.** Error si una pasarela no está pegada al extremo de una
  plataforma de su fila o si una entrada de `entries` no corresponde a un
  marcador de enemigo; el aviso de aparición inalcanzable mira el piso al que
  lleva la pasarela.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `level-pieces`: "Piezas de la versión 1" (pasarela de entrada `-`).
- `level-data`: "Descripción de nivel como datos" (lista opcional `entries`),
  "Nivel clásico migrado" (tres perritos y un huevo en pasarelas); nuevo
  requisito "Entradas de los enemigos" (marcador en pasarela y retraso).
- `level-validation`: "Reglas de jugabilidad" (pasarela suelta, entrada sin
  marcador, aparición alcanzable por su pasarela).
- `gameplay-rules`: nuevo requisito "Entrada de los enemigos";
  "Aplastamiento de enemigos" (vuelve entrando por un marcador) y
  "Bonificación por enemigos montados" (vuelve donde paró el ingrediente o
  encima de la hamburguesa).
- `view-adapter`: "Laberinto a partir del nivel cargado" (dibuja las
  pasarelas).
- `vector-assets`: "Fuentes SVG para todo lo visible" (la pasarela es una
  pieza del laberinto con fuente SVG).

## Impact

- Nivel: `src/sim/level/` (pieza `walkway`, `LevelAssembly`, `Level` con las
  entradas, `levelJson` con `entries`, reglas del validador),
  `src/levels/classic.level.json` y sus pruebas.
- Simulación: `Enemy` (estado de espera y de entrada, reaparición en un sitio
  dado), `Simulation` (entradas al empezar el tablero y tras perder una vida,
  sitio de reaparición de los montados), pruebas de reglas y de determinismo.
- Vista: `MazeView` (pasarelas), catálogo y SVG `walkway`, `docs/STYLE_GUIDE.md`.
- Documentación: `README.md` (enemigos que entran por los lados; montados que
  vuelven donde paran), `docs/MANUAL.md` (§8.5 y §8.6),
  `docs/GAMEDEV_FUNDAMENTALS.md` si aporta algo nuevo (entrada escalonada de
  enemigos).
- El formato de nivel sigue en la versión 1: `entries` es opcional y los
  niveles existentes se leen igual.
- GitHub: issue #46, que pasa a incluir la reaparición de los montados; hito
  `v1.0.0`.
