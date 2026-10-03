# Design

## Context

Estado tras #2 (ver `proposal.md` para la motivación):

- `src/sim/level/` contiene `LevelData` (listas de plataformas, escaleras,
  platos, ingredientes y marcadores), `loadLevel` (validación e integridad), y
  `Level` (consultas: `platformRunAt`, `laddersFromRow`, `ladderNear`,
  `bestLadderTowards`, `landingRowBelow`, `columns`). Las "columnas de caída"
  se derivan agrupando ingredientes con el mismo rango de casillas.
- `Chef` y `Enemy` guardan `row` y un destino de escalera (`#climbTargetRow`);
  la subida es automática hasta el otro extremo. `ChaseBrain` elige la escalera
  más cercana en x con `level.bestLadderTowards`.
- `Ingredient` es una máquina de estados (State) para un ingrediente monolítico
  que se activa al recorrerlo de lado a lado; `Burger` agrupa los ingredientes
  de una columna con su plato y activa "el sufijo" de la columna.
- La vista (`GameScene`, `IngredientView`) dibuja el laberinto desde `Level`
  (tramos, escaleras, platos de las columnas) y cada ingrediente como una sola
  barra.
- Restricciones del proyecto (`AGENTS.md`): núcleo `src/sim/` puro (sin Phaser,
  DOM ni `Date`/`Math.random`), orientación a objetos con inyección por
  constructor y campos `#`, estilo funcional para cálculo sin estado y datos
  inmutables, sin dependencias de ejecución nuevas, `verbatimModuleSyntax`.
- Seguimiento: issue #3, hito `v1.0.0`. Issues de hoja de ruta relacionadas:
  #4 visual, #5 escenas e i18n, #6 input/audio/CI/Electron, #7 editor,
  #8 replays, #9 enemigos montados sobre ingredientes.

## Goals / Non-Goals

**Goals:**

- Un formato de nivel versionado, legible y editable a mano, con importación y
  exportación JSON, que exprese plataformas irregulares y escaleras distintas por
  piso.
- Un registro de piezas extensible, separado del aspecto.
- Ingredientes de 2, 3 o 4 segmentos (según el nivel) con pisado, caída en cadena por impacto y
  platos con destino calculado.
- Un grafo de navegación único para chef, enemigos y validador, con posición
  "arista + desplazamiento" y camino más corto.
- Escaleras controladas por la entrada (parar e invertir a mitad).
- Un validador que detecte los niveles no jugables y se pueda reutilizar desde el
  editor.
- Mantener el nivel clásico jugable y cubierto por pruebas, y el núcleo
  determinista.

**Non-Goals:**

Estas líneas alimentarán, tras archivar, el repaso de la regla 9 de `AGENTS.md`;
todas están ya cubiertas por issues existentes y se enlazan en lugar de
duplicarse.

- Interfaz del editor de niveles (importar/exportar desde la UI, paleta,
  deshacer). → #7. Aquí solo se construyen el formato, el registro, el
  validador y las funciones de importar/exportar.
- Temas visuales y arte vectorial de las piezas. → #4. La vista sigue con
  formas simples.
- Enemigos montados sobre ingredientes y caída de varios pisos. → #9.
- Grabación de partidas y depuración. → #8.
- Recetas por plato (orden exigido de ingredientes): un plato se completa cuando
  han aterrizado todos los ingredientes que acaban en él. → #16.
- Comportamiento nuevo de los enemigos más allá de adaptarse al grafo
  (personalidades distintas por tipo). → #17.
- Aplastamiento por colisión continua (en vez de al empezar la caída). → #18.
- Mezclar tamaños de hamburguesa distintos en un mismo nivel (aquí un nivel tiene
  un único tamaño: 2, 3 o 4 casillas). → #19.

## Decisions

### D1. Formato de nivel v1: JSON con tres capas de cuadrícula

```json
{
  "format": "xantar-level",
  "version": 1,
  "name": "Classic",
  "cols": 20,
  "rows": 15,
  "segments": 4,
  "layers": {
    "structure":   ["....................", "...", "+========++========+", "..."],
    "ingredients": ["....................", "...", ".TTTTTTTT..TTTTTTTT.", "..."],
    "actors":      ["....................", "...", ".h.......p........e.", "..."]
  }
}
```

- `segments` (opcional; 2, 3 o 4; 4 por defecto) es el tamaño de unidad del
  nivel: número de segmentos de cada ingrediente y ancho en casillas de
  ingredientes y platos. Permite pantallas con minihamburguesas, como en el
  original. Todas las hamburguesas de un nivel comparten tamaño.
- Cada capa es una lista de `rows` cadenas de `cols` caracteres. `structure`
  describe lo estático (`.` `=` `H` `+` `_`), `ingredients` los ingredientes
  iniciales (`T` `L` `P` `B`) y `actors` el chef y los enemigos (`C` `h` `p`
  `e`). Separar las capas permite que un enemigo o el chef compartan casilla
  con un ingrediente (el nivel clásico lo hace) y evita símbolos combinados.
- Los marcadores de enemigo cumplen también la función de puntos de aparición:
  desaparece `respawnPoints`. Un enemigo aplastado reaparece en un marcador
  elegido con el `Rng` (cambio menor respecto a #2, donde reaparecía en la fila
  superior sobre una columna de escalera).
- `version` es un entero. Añadir piezas nuevas al registro no cambia la versión;
  cambiar o retirar el significado de un símbolo sí. Un documento con una versión
  superior a la soportada se rechaza con un error claro.
- `parseLevelJson(texto)` valida la forma (formato, versión, tipos, número de
  filas y longitudes) y devuelve un `LevelDocument` tipado; `serializeLevel`
  escribe una cadena por fila, estable y apta para `git diff`. Ambas son
  funciones puras. `loadLevel(documento, opciones)` ensambla el `Level`.
- Errores: `LevelError` con `layer`, `row` y `col` opcionales además del
  mensaje.

*Alternativas descartadas*: una sola capa con símbolos combinados (explosión de
símbolos y sin solape chef/ingrediente); listas de objetos como en #2 (no
editable a mano y difícil de pintar); índices numéricos de pieza por casilla
(ilegible).

### D2. Registro de piezas (Strategy) y ensamblado

```ts
type LayerId = 'structure' | 'ingredients' | 'actors';

interface PieceDefinition {
  readonly id: string;
  readonly symbol: string;       // un carácter, único dentro de su capa
  readonly layer: LayerId;
  readonly width: number | 'unit'; // casillas; 'unit' = tamaño de unidad del nivel (ingredientes y platos)
  contribute(placement: Placement, builder: LevelBuilder): void;
}

class PieceRegistry {
  register(piece: PieceDefinition): void;          // rechaza símbolo repetido en la capa
  resolve(layer: LayerId, symbol: string): PieceDefinition | undefined;
  static createDefault(): PieceRegistry;
}
```

- `LevelBuilder` acumula lo que aportan las piezas (casillas de plataforma y de
  escalera, platos, ingredientes, inicio del chef, apariciones) y construye el
  `Level`. Una pieza nueva solo necesita llamar a los métodos del constructor;
  no se toca el ensamblado.
- `assembleLevel(documento, registro)` recorre cada capa fila a fila, agrupa las
  rachas del mismo símbolo, las divide en unidades del ancho de la pieza (el
  `segments` del nivel cuando el ancho es `'unit'`) y llama a `contribute`. Los errores estructurales llevan capa, fila y columna.
- Los identificadores de ingredientes, platos y apariciones se asignan en orden
  fila-columna, de modo que son deterministas para un mismo documento.
- Un segmento de ingrediente exige casilla de plataforma debajo en `structure`
  (comprobado al ensamblar). Un ingrediente ocupa `segments` segmentos contiguos.
- Las piezas no contienen nada gráfico; los temas (#4) mapearán `id` de pieza a
  aspecto.

*Alternativa descartada*: un `switch` por símbolo dentro del cargador. Obliga a
tocar el cargador con cada pieza nueva, justo lo que el editor y los temas
necesitan evitar.

### D3. `Level` inmutable y soporte de caída

`Level` es el resultado inmutable del ensamblado: `cols`, `rows`, `name`,
`platformRuns` y `ladders` (para dibujar), `ingredients` (id, tipo, fila,
columna inicial, ancho), `plates` (id, fila, columnas, número de ingredientes
que acaban en él), `chefStart`, `enemySpawns`, y `graph`. Consultas:

- `landingBelow(row, left, right)`: primera fila por debajo de `row` con una
  casilla de plataforma o de plato bajo alguna casilla de `[left, right)`;
  devuelve la fila y, si hay plato, el plato (el plato tiene prioridad).
- `destinationOf(ingredient)`: sigue `landingBelow` desde la fila del ingrediente
  hasta un plato (o ninguno si sale del tablero). Se calcula una vez al ensamblar
  y alimenta `Plate.expected` y el validador.
- El soporte parcial basta: un ingrediente cuyo extremo sobresale de una
  plataforma sigue apoyado si alguna de sus casillas tiene plataforma debajo.

### D4. Grafo de navegación y posición "arista + desplazamiento"

Paquete `src/sim/nav/`:

- `PlatformEdge` (fila, `left`, `right` en bordes de casilla) y `LadderEdge`
  (columna, `topRow`, `bottomRow`, longitud `bottomRow - topRow`), con los
  extremos unidos a su `PlatformEdge` en el centro de la columna.
- Derivación: los tramos de plataforma son rachas de casillas `=`/`+` de una fila;
  una escalera es una racha vertical de casillas con escalera (`H`/`+`) y sus
  tramos van entre cada par de `+` consecutivos; las rachas sin plataforma en un
  extremo se registran como **escaleras colgantes** (no generan arista y las
  informa el validador).
- `NavPlace` es un valor inmutable `{ edge, along }`. En plataforma, `along` es la
  x en casillas, limitada a `[left + 12/32, right - 12/32]`; en escalera es la
  distancia desde el extremo superior (`y = topRow + along`, `x = col + 0,5`).
  `graph.positionOf(place)` devuelve `{x, y}`. Mover es una función pura que
  devuelve un `NavPlace` nuevo.
- `graph.platformAt(row, x)` y `graph.ladderNear(platform, x, goingUp, 0,6)`
  sustituyen a `level.platformRunAt`/`level.ladderNear`.
- Camino más corto (`graph.shortestPath(from, to)`): Dijkstra sobre los extremos
  de escalera como nodos (arcos: caminar entre cruces de una misma plataforma por
  distancia; subir/bajar una escalera por su longitud), con nodos virtuales para
  origen y destino. Comparación de costes con una tolerancia de 1e-9; el empate se
  resuelve por la distancia del origen al cruce de la primera escalera y luego por
  el identificador de la escalera (determinista). Resultado: `same-platform`,
  `ladder { ladder, direction, junctionX }` o `none`.
- `graph.reachableFrom(place)` (BFS) alimenta el validador.

El campo `row` de los snapshots se mantiene como "fila de la última plataforma en
la que estuvo": en plataforma es su fila; sobre una escalera sigue siendo la de
salida hasta llegar. El aplastamiento (por filas, al empezar la caída) y los
ingredientes siguen usando ese campo, así que no cambia su semántica.

*Alternativas descartadas*: partir las plataformas en una arista por cruce
(complica el movimiento horizontal continuo y obliga a gestionar el paso entre
aristas al caminar); A* con heurística (el grafo es minúsculo, Dijkstra es más
simple y suficiente).

### D5. Movimiento del chef y de los enemigos sobre el grafo

- **Chef.** Mantiene `#place`, `#facing` y `#lastRow`. Sobre plataforma: avanza
  como hasta ahora (velocidad 115/32, límite del tramo, entrada neta); si hay
  entrada vertical y `ladderNear` encuentra una escalera (a ≤ 0,6 casillas del
  cruce), se centra y entra en ella por el extremo correspondiente (`along = length`
  si sube, `0` si baja) sin moverse ese tick. Sobre escalera: la entrada neta
  vertical (arriba y abajo a la vez se anulan) mueve `along` a 80/32; sin entrada
  no se mueve; al acercarse a un extremo a menos de 3/32 en el sentido de avance,
  se coloca en la plataforma de ese extremo centrado en la columna. La entrada
  lateral se ignora salvo a 0,4 casillas o menos de un extremo
  (`STEP_OFF_DISTANCE`), donde hace pasar al chef a la plataforma de ese extremo
  y caminar en ese sentido: así se puede salir a una plataforma intermedia sin
  soltar la tecla en un instante exacto. En plataforma, la entrada lateral tiene
  prioridad sobre la vertical (con entrada lateral no se engancha a una
  escalera); mantener solo arriba o abajo en un cruce sigue encadenando las
  escaleras.
- **Enemigo.** Mantiene `#place`, dirección y la intención de escalera
  (`{ ladder, direction }`). Camina; cuando llega al cruce de su escalera (< 3/32)
  entra en ella y la recorre entera a 68/32 en el sentido decidido; al llegar al
  extremo vuelve a plataforma. El sentido se fija al decidir (antes se calculaba
  al llegar); es una corrección deliberada del caso en que el chef cambiaba de
  fila mientras el enemigo caminaba hacia la escalera.
- **`EnemyBrain` (Strategy)** recibe ahora el grafo: `decide(enemy, chef, graph,
  rng)` devuelve `{ direction, ladder? }`. `ChaseBrain` usa `shortestPath`:
  `ladder` ⇒ dirige al cruce; `same-platform` o `none` ⇒ hacia el chef en
  horizontal con 20 % de inversión (mismo orden de consumo del `Rng` que en #2:
  primero el desempate de signo si hace falta y luego la inversión).
- El umbral de llegada de 3/32 sigue siendo mayor que el avance por tick (se
  mantiene la prueba de #2 que lo comprueba).

### D6. Ingredientes con segmentos, caída en cadena por impacto y platos

- **`Ingredient`** conserva los estados (State: `idle`, `waiting`, `falling`,
  `stacked`). En `idle` guarda los segmentos pisados (`boolean[segments]`).
  `stompAt(x)` pisa el segmento de la casilla `floor(x - left)` si cae dentro y
  devuelve si fue nuevo; el campo `stomped` de su snapshot lo lee la vista. Al
  pasar a `idle` tras aterrizar en una plataforma, los segmentos se reinician.
- **Pisado.** `IngredientField.step(chef)`: para cada ingrediente `idle` en la
  fila del chef con `chef.onPlatform` y `chef.row === ingredient.row`, pisa el
  segmento bajo `chef.x`. Si es nuevo, emite `segmentStomped`; si todos están
  pisados, activa el ingrediente. El chef sobre una escalera no pisa nada.
- **Activación y cadena.** `IngredientField.activate(ingredient)` calcula el
  conjunto afectado por recorrido en anchura: para cada ingrediente `Y` del
  conjunto obtiene `level.landingBelow(Y.row, Y.left, Y.right)`; si el soporte es
  una plataforma, añade los ingredientes `idle` de esa fila cuyas columnas solapen
  las de `Y`. Se ordenan de la fila más baja a la más alta (y por columna e id) y
  cada uno pasa a `waiting` con retardo `índice × 7` ticks; se suman 50 puntos por
  cada uno y se emite `ingredientsTriggered`. Solo se golpea lo realmente alcanzado
  (cambio deliberado respecto a #2); con las filas consecutivas del nivel clásico
  el resultado es el mismo.
- **Inicio de caída (`IngredientHost.startFall`).** Calcula el soporte, solicita
  el aplastamiento de enemigos por filas y columnas del ingrediente (`CrushTarget`,
  igual que en #2) y devuelve el plan: fila destino, y si cae en plato, el plato y
  el hueco de pila.
- **`Plate`** (sustituye a `Burger`): tiene id, posición, `expected` (calculado al
  cargar), asigna huecos de pila y cuenta aterrizajes; se completa cuando
  `landed === expected` (+400 puntos, +1 pimienta, evento `burgerDone`). El nivel
  se supera cuando todos los platos con ingredientes están completos.
- **Eventos.** Se añade `segmentStomped { ingredientId, segment }`. Los eventos
  `ingredientsTriggered`, `ingredientLanded` y `burgerDone` sustituyen `burgerId`
  por `plateId` (nulo cuando el ingrediente aterriza en una plataforma).
- Se eliminan `INGREDIENT_INSET` y las constantes del recorrido
  (`TRAVERSAL_TOLERANCE`, `TRAVERSAL_REACH`); aparecen `DEFAULT_SEGMENTS` (=4) y `ALLOWED_SEGMENTS` (2, 3 y 4); el
  tamaño real viene de `Level.segments`.

### D7. Validador

`validateLevel(level)` ejecuta una lista de reglas (`LevelRule`, Strategy) y
devuelve `LevelIssue[]` con `severity`, `code`, `message`, `row`, `col`. Reglas
iniciales:

| Código                    | Severidad | Condición                                              |
| ------------------------- | --------- | ------------------------------------------------------ |
| `ingredient-unreachable`  | error     | la plataforma del ingrediente no es alcanzable del chef |
| `ingredient-no-plate`     | error     | `destinationOf` no termina en un plato                  |
| `ladder-dangling`         | error     | escalera con un extremo sin plataforma                  |
| `no-ingredients`          | error     | el nivel no tiene ingredientes                          |
| `plate-empty`             | warning   | `expected === 0`                                        |
| `platform-unreachable`    | warning   | tramo de plataforma no alcanzable por el chef           |
| `spawn-unreachable`       | warning   | aparición de enemigos no alcanzable por el chef         |

`loadLevel(documento, { registry, requirePlayable = true })` ensambla, valida y,
si hay errores y `requirePlayable`, lanza `LevelError` con la lista. El editor (#7)
usará `requirePlayable: false` y mostrará las incidencias. La alcanzabilidad usa
`graph.reachableFrom(chefStart)`.

### D8. Vista

- `IngredientView` pasa a `segments` rectángulos de una casilla (con una pequeña
  separación) y baja unos píxeles los segmentos pisados; el resto del movimiento
  de caída (interpolación y aceleración) no cambia.
- `GameScene` dibuja plataformas desde `level.platformRuns`, escaleras desde
  `level.ladders` y platos desde `level.plates`, y consume `sim.ingredients` y
  `sim.plates` (desaparece `sim.burgers`). El nivel clásico se importa como JSON
  (`resolveJsonModule`) y se carga con `parseLevelDocument` + `loadLevel`.
- Las posiciones de chef y enemigos siguen llegando como `x`, `y`, `prevX`,
  `prevY` interpolables, así que la vista no cambia en ese aspecto. Un chef
  parado a mitad de escalera se dibuja ahí.

### D9. Pruebas

- Funciones auxiliares de prueba para construir niveles pequeños a partir de
  cuadrículas de texto (`testing/levels.ts`): ya no hay listas de objetos.
- Pruebas por clase (documento, registro, ensamblado, grafo, `NavPlace`, camino
  más corto con niveles irregulares, `Chef`, `Enemy`/`ChaseBrain`, `Ingredient`,
  `Plate`, `IngredientField`, validador) y de escenario con `Simulation` (pisado,
  cadena, aplastamiento, platos, nivel completado, inversión en escalera).
- Un nivel pequeño con `segments` igual a 3 y otro con 2 cubren las
  minihamburguesas (carga, pisado, cadena, destinos y platos).
- El nivel clásico se verifica contra la geometría esperada (cuatro platos,
  cuatro columnas de ingredientes, cuatro tramos de plataforma, doce tramos de
  escalera) y sin incidencias del validador.
- La prueba de determinismo de #2 se mantiene con entradas guionizadas
  adaptadas.
- Verificación manual del autor al final (ver tareas): pisado, escaleras con
  parada e inversión, cadena, enemigos y nivel completo.

## Risks / Trade-offs

- **[Cambio grande: formato, registro, grafo, movimiento, ingredientes y
  validador a la vez]** → Tareas por capas con pruebas en cada grupo; la
  sustitución del modelo antiguo se concentra en un único grupo y el árbol vuelve
  a compilar entero al terminar ese grupo. Si el autor lo prefiere, se puede
  dividir en dos cambios (formato y grafo; ingredientes y movimiento) antes de
  empezar.
- **[Cambios de jugabilidad deliberados]** (pisado por segmentos, la cadena solo
  alcanza lo golpeado, la escalera deja de recorrerse sola, sentido de subida
  decidido al decidir) → Documentados como MODIFIED en las especificaciones y
  comprobación manual del autor; el nivel clásico sigue siendo jugable con la
  misma estructura.
- **[Coma flotante en uniones de plataforma y escalera]** → Posiciones expresadas
  en casillas con múltiplos de 1/32 (exactos en binario), umbrales explícitos
  (3/32, 12/32) y comparaciones con tolerancia solo en el camino más corto; pruebas
  que cruzan cruces y extremos.
- **[Un único tamaño de hamburguesa por nivel (2, 3 o 4)]** → Suficiente para
  las pantallas de minihamburguesas del original; mezclar tamaños en un nivel es
  la issue #19. Las rachas que no son múltiplo del tamaño del nivel fallan con un
  mensaje claro.
- **[Formato público difícil de cambiar]** → Versión explícita, rechazo de
  versiones futuras, piezas nuevas sin cambio de versión y pruebas de ida y vuelta.
- **[`resolveJsonModule` y tipado del JSON importado]** → El JSON se trata como
  `unknown` y pasa siempre por `parseLevelDocument`, que lo valida.
- **[Camino más corto en cada decisión]** → El grafo es pequeño y las decisiones
  ocurren cada 30–66 ticks por enemigo; el coste es despreciable. Se verifica con
  una prueba de rendimiento básica sobre el nivel clásico.
