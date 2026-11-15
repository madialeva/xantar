# Proposal

## Why

Hoy un ingrediente baja un piso en 12 ticks (0,2 s) con una aceleración que
pone la vista, la cadena de caídas se calcula entera al activarlo (de abajo
arriba, 7 ticks entre uno y otro) y los enemigos de la columna se aplastan en
cuanto empieza la caída. Se ve brusco y no se parece al juego que inspira
Xantar. El autor ha grabado una partida del original (MAME, BurgerTime de Data
East) y la quiere como referencia: los ingredientes bajan despacio y a
velocidad constante, rebotan al golpear al de abajo y, cuando llevan enemigos
encima, bajan con ellos varios pisos de golpe. Es lo primero de esa grabación
que se incorpora al juego.

## What Changes

- **Caída con la cadencia del original**, medida fotograma a fotograma en la
  grabación y llevada a la escala de Xantar (un piso del original, 32 px, son
  las 3 casillas de un piso de Xantar):
  - El ingrediente baja a velocidad constante, 170/32 casillas por segundo: un
    piso en unos 0,57 s, como en el original.
  - Cuando su base alcanza a un ingrediente quieto del piso de abajo, este
    empieza a caer en ese momento (la cadena ya no se calcula de antemano, y va
    de arriba abajo), y el que golpea rebota: sube 20/32 casillas, espera arriba
    y sigue bajando.
  - Al tocar un piso, el ingrediente se hunde un instante y vuelve a su sitio
    (adorno de la vista que sustituye al aplastamiento actual).
  - Al llegar al plato, rebota sobre la hamburguesa y vuelve a bajar hasta su
    sitio. La hamburguesa se completa cuando su último ingrediente queda
    quieto.
  - Los 50 puntos de cada ingrediente se conceden cuando termina su caída, no al
    activarlo.
- **Enemigos montados** (como en el original): los enemigos que están sobre un
  ingrediente cuando el chef lo suelta bajan montados en él. El ingrediente cae
  un piso más dos por cada enemigo montado (con uno, tres pisos), parando un
  instante en cada piso intermedio y golpeando lo que encuentra. Al terminar la
  caída, los enemigos montados salen del tablero como los aplastados y dan una
  bonificación de 500 puntos que se dobla con cada enemigo más (1000, 2000…).
  Mientras van montados no andan ni quitan vidas.
- **Aplastamiento por contacto**: un enemigo se aplasta cuando el ingrediente
  que cae le alcanza, no al empezar la caída. El que sale de la columna a tiempo
  se salva y el que se mete debajo se aplasta. El combo y la reaparición no
  cambian.
- La simulación pasa a conocer la posición vertical de cada ingrediente en
  todo momento (cayendo, rebotando o apilado) y el grosor de cada ingrediente
  al apilarse, que deja de ser un dato solo de la vista. La vista se limita a
  dibujar esa posición interpolada.
- Nuevo evento de enemigos montados soltados (con su posición y los puntos);
  el evento de ingrediente aterrizado pasa a emitirse cada vez que el
  ingrediente toca un piso o el plato.
- Se retiran `FALL_TICKS`, `FALL_STAGGER_TICKS`, la fase `waiting` del
  ingrediente y el cálculo de alturas de apilado de la vista (`stackLifts`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `gameplay-rules`: "Caída en cadena" (velocidad constante, golpe por contacto
  con rebote, puntos al terminar la caída), "Apilado en el plato" (grosor como
  regla, rebote en el plato, hamburguesa completa cuando el último queda
  quieto), "Aplastamiento de enemigos" (por contacto), "Pisado de segmentos"
  (los segmentos se reinician al terminar la caída), "Comportamiento de los
  enemigos" y "Contacto con enemigos y vidas" (los enemigos montados no andan ni
  quitan vidas); nuevo requisito "Enemigos montados en un ingrediente".
- `simulation-core`: "Eventos de simulación" incluye el toque de un piso o del
  plato y los enemigos montados soltados.
- `view-adapter`: "Dibujo interpolado" (la altura del ingrediente es la de la
  simulación, sin curvas propias), "Eventos a efectos" (adorno al tocar un piso
  y al soltar a los enemigos montados), "Apilado en el plato según el grosor"
  (la vista dibuja la altura que da la simulación) y "Paridad jugable con el
  POC" (la caída de los ingredientes, el aplastamiento y los enemigos montados
  cambian a propósito).
- `character-rigs`: "Estados de animación" (enemigo montado) y "Animaciones con
  interpolación y squash & stretch" (el ingrediente se hunde al tocar un piso
  en lugar de aplastarse).
- `audio`: "Sonidos a partir de los eventos de la partida" (aterrizar al tocar
  un piso o el plato, y el efecto de aplastar al soltar a los enemigos
  montados).

## Impact

- Simulación: `src/sim/rules.ts` (constantes de la caída, del rebote, de los
  enemigos montados y grosores de los ingredientes), `Ingredient` (posición
  vertical y nuevos estados), `IngredientField` (golpes, aterrizajes, puntos,
  enemigos montados), `Plate` (altura de la pila), `Enemy` (ir montado),
  `Simulation` (interfaz con los enemigos en lugar de `CrushTarget`) y
  `events.ts`. Pruebas de ingredientes, del campo, de las reglas y de
  determinismo.
- Vista: `IngredientView` (dibuja la altura de la simulación y el hundimiento),
  `GameScene`, `EnemyView` y los estados de los rigs (montado), la tabla de
  sonidos por evento; se borran `src/objects/stacking.ts` y su prueba, y el
  grosor de apilado sale de `src/view/art/graphics.ts`.
- Documentación: `README.md` (caídas, enemigos montados, puntuación y hoja de
  ruta), `docs/MANUAL.md`, `docs/STYLE_GUIDE.md`,
  `docs/GAMEDEV_FUNDAMENTALS.md` y el comentario de grosores de
  `tools/blender/ingredients.py`.
- Sin dependencias nuevas ni cambios en el formato de nivel.
- GitHub: issue #41 para este cambio, en el hito `v1.0.0`, que absorbe #9
  (enemigos montados; su regla de "un piso más por enemigo" se corrige a dos,
  como en el original) y #18 (aplastamiento por contacto); el PR cierra las
  tres.
