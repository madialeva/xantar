# Design

## Context

- Los marcadores de enemigo (`h`, `p`, `e` en la capa `actors`) deben estar
  sobre una plataforma (`LevelAssembly#requireSupport`). `Level.enemySpawns` da
  su tipo, fila y `x`; `Simulation` crea un enemigo por marcador, colocado en
  ese sitio, y todos se mueven desde el primer tick de `playing`.
- `Enemy` lleva su estado en campos: `#active` (fuera del tablero mientras
  cuenta `#respawnTicks`), `#carrier` (montado), `#stunTicks`, `#climb` y la
  decisión de su `EnemyBrain`. `squash()` lo saca del tablero 150 ticks y
  `#stepRespawn` lo devuelve a un marcador elegido con `rng.pick`.
- `Simulation#release` trata a los montados como aplastados (`squash()`), con
  su bonificación y el evento `ridersDropped`. `#resetPositions` (al empezar el
  tablero y tras perder una vida) vuelve a colocar a cada enemigo en su
  marcador.
- La vista oculta a los enemigos inactivos (`EnemyView.setVisible(active)`) y
  dibuja el laberinto desde el nivel (`MazeView`).
- El nivel clásico (#45) tiene su campo de juego en las columnas 4–34: las
  columnas 0–3 y 35–38 están libres.

### La referencia: entradas y montados en el original

Medido en la grabación (`tmp/ejemplo-partida.webm`; la pantalla aparece a
11,25 s):

| Momento | Enemigo | Por dónde aparece |
|---|---|---|
| +0,5 s | huevo | extremo derecho del piso inferior |
| +1 s | perrito | extremo izquierdo del piso inferior |
| +2,75 s | perrito | extremo derecho del piso superior |
| +4,5 s | perrito | extremo izquierdo del piso superior |

Los enemigos asoman desde fuera de la pantalla, por el remate del piso, y
entran andando.

Enemigos montados: a 25,25 s el pan de la calle 4 termina su caída con un
perrito encima, el perrito desaparece y queda el "500" en su sitio; a 27,5 s
el perrito vuelve a aparecer justo ahí, encima del pan, y sigue andando. A
46,5 s pasa lo mismo en la calle 3, en el piso inferior, y reaparece a los
2,5 s. En el vídeo ningún viaje llega al plato; para ese caso se sigue lo que
pide el autor: la plataforma de abajo, justo encima de la hamburguesa.

## Goals / Non-Goals

**Goals:**

- Que la pantalla empiece vacía y los enemigos entren por los lados como en el
  original, con el orden y los retrasos como datos del nivel.
- Que un enemigo montado vuelva donde paró, sin reglas especiales en la vista.
- Que los niveles existentes y las cuadrículas de prueba sigan funcionando:
  un marcador sobre una plataforma aparece allí y sin `entries` no hay retraso.

**Non-Goals:**

- Comportamientos distintos por tipo de enemigo (#17): los cuatro persiguen
  igual.
- Usar al pepinillo en otras pantallas: no hay más niveles todavía.
- El texto flotante "500" del original (#24).
- Una animación propia de entrada: el enemigo entra con la de andar.
- Convertir `Enemy` al patrón State: los modos nuevos se añaden como dos
  objetos pequeños, igual que `#carrier` y `#climb`.

## Decisions

### 1. La pasarela de entrada es una pieza de estructura

Símbolo `-` en `structure`, pieza `walkway`. `LevelAssembly` la guarda aparte
(`Terrain.hasWalkway`), no aporta casillas de plataforma y, por tanto, no entra
en el grafo de navegación: el chef no puede pisarla y los enemigos solo la
recorren al entrar. Una racha de pasarela debe estar pegada, en su fila, al
extremo de un tramo de plataforma; esa plataforma es su destino.

Alternativa descartada: alargar los pisos superior e inferior hasta el borde
con plataforma normal. El chef podría salir del campo de juego y los enemigos
podrían usar la prolongación para perseguirle.

### 2. Entradas y retrasos como datos

Un marcador de enemigo sobre una pasarela es una entrada. `Level.enemySpawns`
pasa a dar, para cada marcador, `delayTicks` y, si es una entrada, el punto en
el que se une a la plataforma (`joinX`, el extremo de su tramo de plataforma
respetando `EDGE_MARGIN`). El documento de nivel admite `entries`, una lista
opcional de `{ "row", "col", "delayMs" }`; los milisegundos se pasan a ticks al
cargar, como las demás duraciones. Un marcador sin elemento en `entries` tiene
retraso 0, así que los niveles y cuadrículas actuales se comportan igual. El
formato sigue en la versión 1: el campo es opcional y `serializeLevel` solo lo
escribe si existe.

Alternativa descartada: retrasos fijos en `rules.ts` por orden de lectura de
los marcadores. El orden del original no es el de lectura y cada pantalla del
original tiene el suyo.

### 3. Fuera del tablero y entrando: dos modos nuevos de `Enemy`

- **Fuera** (`#away`): inactivo y oculto, cuenta los ticks que le quedan y
  sabe cómo volverá: por su marcador, por un marcador al azar o en un sitio
  concreto. `reset` lo deja fuera con el retraso de su entrada; `squash()`, con
  150 ticks y un marcador al azar (como hoy); `dropAt(place)`, con 150 ticks y
  ese sitio.
- **Entrando** (`#entrance`): activo, aparece en el marcador y avanza en
  horizontal a `ENEMY_SPEED` hacia `joinX`; al llegar pasa a la plataforma
  (`NavPlace.onPlatform`) y empieza a decidir. El aturdimiento se comprueba
  antes, así que un enemigo aturdido se queda quieto en la pasarela.

`#stepRespawn` se generaliza a la vuelta desde fuera y sigue emitiendo
`enemyRespawned` al reaparecer (no en la entrada inicial de cada tablero, como
ahora). Como el tiempo solo corre en `playing`, los retrasos cuentan desde que
termina `ready`.

### 4. Dónde vuelve un enemigo montado

`Simulation#release` calcula el sitio de cada montado antes de soltarlo:

- Si el ingrediente se ha quedado en un piso: la plataforma de su fila en la
  `x` del enemigo (`graph.platformAt(ingredient.row, enemy.x)`).
- Si ha terminado en su plato: la plataforma más baja por encima del plato que
  contiene esa `x`.
- Si no hay plataforma (un nivel raro): un marcador al azar, como un aplastado.

y llama a `enemy.dropAt(place)`. La bonificación y el evento `ridersDropped` no
cambian. Si el chef pierde una vida durante el viaje, `#resetPositions` deja al
montado fuera con su retraso, como a los demás.

### 5. Validación

Reglas nuevas: `walkway-detached` (error, pasarela sin plataforma al lado) y
`entry-without-enemy` (error, elemento de `entries` sin marcador). La comprobación
de aparición alcanzable (`spawn-unreachable`) usa la plataforma de destino de
las entradas. Al ensamblar solo se rechaza un marcador de enemigo sobre una
pasarela suelta, porque esa entrada no lleva a ningún sitio; una pasarela
suelta sin marcador llega al validador, que la informa como error.

### 6. La pasarela en pantalla

Gráfico nuevo `walkway` (SVG de 16×12), una casilla repetida a lo largo de la
pasarela: la misma forma que el tramo central de plataforma, en el tono más
oscuro del borde (`f-platformEdge`) y sin brillo, para que se lea como
prolongación del piso pero no como suelo del chef. Los remates del piso se
siguen dibujando en su sitio, entre el piso y la pasarela.

### 7. El nivel clásico

Pasarelas en las filas 5 y 23, columnas 0–3 y 35–38. Marcadores: perrito en
(5, 0), perrito en (5, 38), perrito en (23, 0) y huevo en (23, 38).
`entries`: (23, 38) 500 ms, (23, 0) 1000 ms, (5, 38) 2750 ms y (5, 0) 4500 ms.
Los retrasos son el momento en que el enemigo asoma por el borde; desde ahí
tarda unos 0,9 s en recorrer las cuatro casillas de pasarela hasta el campo.

### 8. Pruebas

- Nivel: lectura y escritura de `entries`, pieza `-`, ensamblado de entradas
  (`joinX`, retraso), reglas nuevas del validador.
- `Enemy`: fuera con retraso, entrada a velocidad constante hasta `joinX`,
  aturdido en la pasarela, vuelta por un sitio dado.
- Reglas de `Simulation`: tablero vacío hasta el primer retraso, orden de
  entrada, vuelta tras perder una vida, montado que vuelve donde paró y encima
  de la hamburguesa, aplastado que vuelve por un marcador.
- Nivel clásico: cuatro entradas, tipos y orden del original; se puede
  terminar.
- Las pruebas de reglas que suponen enemigos en su sitio desde el primer tick
  siguen valiendo: sus cuadrículas ponen los marcadores en plataformas y sin
  `entries`.

## Risks / Trade-offs

- **Un montado vuelve encima del chef y le quita una vida al momento.** Es lo
  que hace el original; el chef ve el "500" y tiene 2,5 s para apartarse.
- **El chef en el remate del piso cuando entra un enemigo.** Le alcanza como en
  el original; el remate está a 12 unidades del final del piso y la pasarela
  hace visible al enemigo antes de llegar.
- **Más estado en `Enemy`.** Dos modos más en campos; si siguen creciendo, el
  paso natural es el patrón State (fuera, entrando, andando, trepando, montado),
  que se deja para cuando lleguen los comportamientos por tipo (#17).
- **Cambian las secuencias aleatorias** al no colocar a los enemigos en el
  primer tick: la prueba de determinismo compara dos partidas entre sí, así que
  sigue valiendo.
