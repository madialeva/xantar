# Design

## Context

Estado actual (ver `proposal.md` - Why para la motivación):

- `src/scenes/GameScene.ts` concentra estado de partida, reglas, input, HUD y
  overlays; `src/objects/{Chef,Enemy,Ingredient}.ts` son `Container` de Phaser
  con lógica y estado propios; `src/level.ts` y `src/config.ts` fijan un único
  nivel con constantes en píxeles.
- El bucle usa `delta` variable. La caída de ingredientes, el aturdimiento y la
  reaparición dependen de tweens y `delayedCall` de Phaser.
- Restricciones del proyecto (AGENTS.md): el código de `src/` es solo de
  navegador (`types: []`, sin APIs de Node); `verbatimModuleSyntax` e
  `import type` obligatorios; `override` obligatorio; campos privados `#`;
  sin dependencias de ejecución nuevas sin cambio aprobado.
- **Filosofía de diseño** (sección "Design philosophy" de AGENTS.md): el código
  es orientado a objetos por defecto, con estilo funcional donde encaje mejor.
  Este diseño aplica esa regla.
- Decisión del autor sobre versiones: se abandona la compatibilidad con Node
  antiguo y se usan las versiones estables más recientes mutuamente
  compatibles (ver D12).
- No existe ninguna especificación previa ni suite de pruebas. Tampoco hay
  referencia ejecutable del comportamiento del POC (no es determinista), así
  que la paridad se verifica con pruebas de reglas y una comprobación manual.
- Seguimiento: issue #2, hito `v1.0.0`; hay issues de hoja de ruta para los
  cambios siguientes (#3 modelo de nivel, #4 visual, #5 escenas e i18n, #6
  input/audio/CI/Electron, #7 editor).

## Goals / Non-Goals

**Goals:**

- Un núcleo `src/sim/` puro, determinista y testeable, modelado como objetos
  con estado encapsulado y comportamiento propio, que contenga todas las reglas
  del POC con paso fijo a 60 Hz.
- Una vista Phaser fina: entrada, interpolación y eventos → efectos.
- Un formato de nivel de datos que el núcleo consuma, con el nivel actual
  migrado, suficientemente genérico para no rehacer el núcleo en el cambio #3.
- Pruebas automatizadas por objeto y fronteras protegidas por el linter.
- Toolchain actualizada a las últimas versiones compatibles.

**Non-Goals:**

Estas líneas alimentarán issues de seguimiento al archivar el cambio (regla 9
de AGENTS.md); las que ya cubre una issue de la hoja de ruta se enlazan a ella
en vez de duplicarse.

- Cambiar la jugabilidad: segmentos de ingrediente, movimiento sobre grafo,
  inversión de sentido en escalera, aplastamiento por colisión, dificultad por
  nivel, corrección del combo. → #3 (modelo de nivel, segmentos, grafo) y
  futuros cambios de jugabilidad sobre la línea base de las especificaciones.
- Formato definitivo de nivel (rejilla de piezas, registro, validador de
  jugabilidad). → #3.
- SVG, temas, paneles laterales. → #4.
- Máquina de estados de escenas, i18n, `exitGame` por recarga de página. → #5.
- Abstracción de input, audio, CI y endurecimiento de Electron. → #6.
- Editor de niveles. → #7.
- Grabación/reproducción de partidas y panel de depuración. → #8.

## Decisions

### D1. Modelo de objetos del núcleo

El núcleo es un modelo de objetos; las funciones puras se reservan para el
cálculo sin estado.

```
src/sim/
  rules.ts            constantes de reglas en tiles/ticks (antes en config.ts)
  geometry.ts         funciones puras: distancias, solapes de rangos, límites
  rng.ts              interface Rng + class SeededRng (mulberry32)
  events.ts           SimEvent (unión discriminada inmutable), interface
                      EventSink, class EventQueue implements EventSink
  stepper.ts          class FixedStepper
  level/
    LevelData.ts      tipos de datos serializables del nivel
    Level.ts          class Level: nivel cargado e inmutable con consultas de
                      navegación
    loadLevel.ts      función pura LevelData → Level (validación + derivación)
  entities/
    MovingEntity.ts   base mínima: x, y, prevX, prevY, beginTick(), teleportTo()
    Chef.ts           class Chef extends MovingEntity
    Enemy.ts          class Enemy extends MovingEntity (+ aturdimiento, aplastado)
    EnemyBrain.ts     interface EnemyBrain (Strategy) + class ChaseBrain
    createEnemy.ts    fábrica: EnemyKind → Enemy con su EnemyBrain
    Ingredient.ts     class Ingredient con estados (State)
    Burger.ts         class Burger: columna de ingredientes + plato
  GameStats.ts        class GameStats: puntos, vidas, pimientas, nivel, combo
  Simulation.ts       class Simulation: agregado y orquestador del tick
  index.ts            API pública del núcleo
src/levels/
  classic.ts          nivel actual migrado al formato LevelData
```

Pruebas junto al código (`*.test.ts`), una por objeto.

**Responsabilidades**

- `Simulation` es el agregado raíz: posee `Level`, `Chef`, `Enemy[]`,
  `Burger[]`, `GameStats`, `Rng` y el `EventSink`, ejecuta cada tick en orden
  fijo (inicio de tick de las entidades → chef → ingredientes y caídas →
  enemigos → pimienta → contacto), equivalente al de `GameScene.update`, y
  expone órdenes (`startBoard`, `nextLevel`, `newGame`) y el estado de solo
  lectura.
- `Level` es un objeto inmutable tras la carga que responde consultas de
  navegación: tramo de plataforma en una fila, escaleras que parten de una fila
  hacia arriba o abajo, escalera cercana, mejor escalera hacia una fila,
  puntos de reaparición, columnas de caída. Absorbe lo que hoy hace
  `src/level.ts`.
- `Chef` encapsula posición, orientación y recorrido de escalera; su método
  `step(input, level)` aplica movimiento y escaleras. `Enemy` encapsula
  posición, aturdimiento, estado de activo/aplastado, reaparición y recorrido
  de escalera; delega la decisión de dirección en su `EnemyBrain`.
- `Ingredient` y `Burger` modelan la caída: `Burger` agrupa los ingredientes de
  una columna con su plato, activa el sufijo en cadena, gestiona los
  ingredientes activos y la pila, y decide la finalización; `Ingredient`
  gestiona su ciclo de vida (D6).
- `GameStats` guarda y modifica los contadores de la partida y emite
  `scoreChanged`.

**Patrones aplicados (solo donde varía el comportamiento)**

- *Strategy*: `EnemyBrain` (la IA actual es `ChaseBrain` para los tres tipos;
  cambios futuros darán personalidad propia a cada uno sin tocar `Enemy`).
- *State*: ciclo de vida del `Ingredient` (D6).
- *Observer*: `EventSink` inyectado en las entidades; `EventQueue` acumula los
  eventos que `Simulation.step` devuelve.
- *Factory*: `createEnemy(kind, …)` y la construcción de `Burger` desde las
  columnas de `Level`.
- *Dependency injection manual*: `Rng`, `EventSink` y `Level` se pasan por
  constructor como interfaces o valores, con una única raíz de composición (la
  escena crea la `Simulation` y sus colaboradores). Sin contenedor de DI: en
  TypeScript la inyección por constructor y las fábricas bastan y no añaden
  dependencias. Las pruebas sustituyen el `Rng` por uno fijo y el `EventSink`
  por una cola inspeccionable.

**Estilo funcional donde encaja**: `geometry.ts`, `loadLevel`, las
conversiones de unidad, la construcción de eventos (objetos inmutables
`readonly`) y las consultas sobre colecciones (`filter`/`map`/`reduce`) en vez
de bucles manuales.

*Alternativas descartadas*:

- Funciones de reglas sobre un estado plano mutable (ECS ligero). Más corto,
  pero es el estilo procedimental que el autor ha pedido evitar y reproduce
  "bolsa de datos + funciones libres".
- Una subclase por tipo de enemigo (`HotDog`, `Pickle`, `Egg`). Hoy solo
  difieren en el tipo y, en el futuro, en su `EnemyBrain`: composición mediante
  Strategy evita una jerarquía que no aporta comportamiento propio.
- Una única clase `Game` grande: reproduciría el problema de `GameScene`.

### D2. Unidades: tiles y ticks

- Posición en tiles, sin píxeles. Convención de ejes heredada del POC: una
  entidad sobre la fila `r` tiene `y = r`; la línea de plataforma está en
  `y = r + 0,5`; el centro de la columna `c` está en `x = c + 0,5`.
- La vista convierte con `px = tile * TILE` y mantiene localmente alturas y
  desplazamientos visuales (p. ej. la altura del ingrediente o el hueco de la
  pila), que no son reglas.
- Conversión exacta de las constantes (TILE = 32 px; 60 ticks/s):

| Constante POC            | Valor en el núcleo                        |
| ------------------------ | ----------------------------------------- |
| `CHEF_SPEED` 115 px/s    | 115/32 tiles/s (`/60` por tick)           |
| `CLIMB_SPEED` 80 px/s    | 80/32 tiles/s                             |
| `ENEMY_SPEED` 68 px/s    | 68/32 tiles/s                             |
| Umbral de llegada 3 px   | 3/32 tiles                                |
| Margen de borde 12 px    | 12/32 tiles                               |
| `STUN_MS` 5000 ms        | 300 ticks                                 |
| Reaparición 2500 ms      | 150 ticks (se usa por fin `SQUASH_RESPAWN_MS`) |
| Caída (tween) 200 ms     | 12 ticks                                  |
| Retardo entre caídas 110 ms | 7 ticks (6,6 redondeado; +0,4 tick)    |
| Decisión enemiga 500–1100 ms | 30–66 ticks (entero aleatorio)        |

- Único redondeo real: el retardo de la caída en cadena (110 ms → 7 ticks =
  116,7 ms). Se documenta como diferencia aceptada.
- Con paso fijo, los umbrales de llegada son seguros: el avance por tick
  (1,33 px el chef en escalera, 1,13 px el enemigo) es menor que la ventana de
  alineado (±3 px), de modo que no se puede saltar una escalera ni oscilar al
  llegar. Se añade una prueba que lo verifica para las constantes vigentes.

*Alternativa descartada*: mantener píxeles en el núcleo. Habría atado las
reglas a una resolución, contradiciendo la decisión de estilo vectorial y
escalable acordada para el proyecto.

### D3. Paso fijo: `FixedStepper`

Clase sin dependencias: `advance(dtMs): number` suma al acumulador,
devuelve `floor(acumulado / (1000/60))` limitado a `maxSteps` (por defecto 5,
≈83 ms) y conserva el resto; si se supera el límite, el resto sobrante se
descarta. Expone `alpha` (fracción de tick restante, 0–1) para la
interpolación. Vive en `src/sim/` porque es lógica pura y testeable, aunque la
usa la vista.

Se eligió acumulador con interpolación (*Fix Your Timestep*) frente a dejar
`delta` variable porque hace el resultado independiente del framerate y la
simulación reproducible; el coste (`prev` de posiciones) es pequeño.

### D4. Estado encapsulado e instantánea previa

Cada entidad guarda su estado en campos `#privados` y lo modifica solo con su
comportamiento. Las entidades móviles heredan de `MovingEntity` (un único nivel
de herencia, solo para compartir posición e instantánea previa), que ofrece
`beginTick()` (copia `x`,`y` en `prevX`,`prevY`) y `teleportTo(x, y)` (iguala
también `prev`, para evitar estelas de interpolación en reinicios y
reapariciones). `Simulation` llama a `beginTick()` en todas las entidades al
inicio de cada tick.

La vista no recibe las clases completas, sino **interfaces de solo lectura**
declaradas en el núcleo (`ChefSnapshot`, `EnemySnapshot`, `IngredientSnapshot`,
`BurgerSnapshot`, `StatsSnapshot`) que las clases implementan; así la vista
puede leer posición, estado y progreso de caída sin acceso a los métodos que
mutan. El acceso de lectura se hace con accesores `get` sobre los campos `#`
(justificados por ser exposición de solo lectura de estado encapsulado).

*Alternativa descartada*: estado inmutable con copia por tick. Más puro pero
innecesariamente costoso y verboso para este tamaño; el estilo funcional se
reserva para eventos, valores y cálculo.

### D5. Eventos

Los eventos son valores inmutables (unión discriminada por `type`, campos
`readonly`): `boardStarted`, `ingredientsTriggered`, `ingredientLanded`,
`enemySquashed`, `enemyRespawned`, `pepperThrown`, `enemyStunned`,
`burgerDone`, `chefHit`, `scoreChanged`, `levelCleared`, `gameOver`. Cada uno
lleva los datos que la vista necesita (ids, posiciones en tiles, puntos).

Las entidades reciben un `EventSink` por constructor y emiten directamente;
`EventQueue` (implementación por defecto) los acumula y `Simulation.step(input)`
devuelve `readonly SimEvent[]` de ese tick (vacío si no hay sucesos). La vista
acumula los eventos de los ticks del fotograma y los procesa después de
sincronizar el estado.

### D6. Caída, apilado y combo: estado del `Ingredient` (State) y `Burger`

El ciclo de vida del `Ingredient` se modela con el patrón State; los estados
son objetos con una interfaz común (`enter`, `step`, y transiciones al
siguiente estado):

- `Idle`: inmóvil sobre una plataforma; observa el recorrido del chef (armado
  por extremo, tolerancias y cancelación del POC) y avisa a su `Burger`.
- `Waiting`: activado, esperando su turno (`índice * 7` ticks) en la caída en
  cadena.
- `Falling`: avanza `fallProgress` de 0 a 1 en 12 ticks.
- `Stacked`: aterrizado sobre el plato.

`Burger` implementa la lógica de la columna, equivalente a la del POC:

- Al activarse un ingrediente, el sufijo de la columna (él y los de debajo)
  pasa a `Waiting`; se suman los 50 puntos por cada uno en ese instante y se
  retiran de los activos (igual que el POC).
- Al vencer la espera, el ingrediente "inicia" su caída: se evalúa el
  aplastamiento (por rango de columnas y filas, como el POC) a través de una
  interfaz inyectada (`CrushTarget`, implementada por la colección de enemigos
  de `Simulation`, de modo que `Burger` no conoce a `Enemy`), se le asigna la
  fila siguiente (o el hueco de pila si cae al plato) y se reinserta en los
  activos.
- La simulación expone `fallFromRow`, `fallToRow` (o plato + hueco),
  `fallProgress` lineal; la vista elige su propio perfil de aceleración
  (`Quad.easeIn`) y sus desplazamientos en píxeles.
- **Desviación deliberada mínima**: el POC comprobaba la hamburguesa al
  aterrizar cualquier pieza contando las *ya asignadas* a la pila (no las
  aterrizadas), de modo que podía completarse hasta ~7 ticks antes de que la
  última pieza tocara el plato. Aquí se completa cuando todas han
  **aterrizado**, coherente con la especificación. Se prueba explícitamente.

*Alternativa descartada*: un campo `state: 'idle' | 'falling' | 'stacked'` y
`switch` en el bucle (como el POC). Dispersa la lógica de cada fase por el
código y no escala a los estados nuevos que traerá el modelo de segmentos (#3).

### D7. RNG con semilla

`interface Rng { next(): number; int(min, max): number; pick<T>(items): T }`
con `SeededRng` (mulberry32) como implementación. `Simulation` recibe un `Rng`
por constructor y lo pasa a quien lo necesita (`ChaseBrain` para decisión e
inversión de sentido, reaparición de enemigos, sentido inicial). La vista crea
`new SeededRng(Date.now())` al crear la partida (la vista puede usar `Date`);
los tests usan semillas fijas o un `Rng` falso. No se intenta reproducir la
secuencia aleatoria del POC (no era reproducible).

### D8. Formato de nivel de datos (transitorio) y `Level`

```ts
interface LevelData {
  cols: number;
  rows: number;
  platforms: { row: number; x0: number; x1: number }[];       // columnas inclusivas
  ladders: { col: number; topRow: number; bottomRow: number }[];
  plates: { row: number; x0: number; x1: number }[];
  ingredients: { kind: IngredientKind; row: number; x0: number; x1: number }[];
  chefStart: { row: number; col: number };
  enemyStarts: { kind: EnemyKind; row: number; col: number }[];
  respawnPoints: { row: number; col: number }[];
}
```

- `loadLevel(data): Level` (función pura) valida integridad (límites;
  escaleras e ingredientes sobre plataforma; chef definido; columna de caída
  con plato; respawn sobre plataforma), fusiona tramos de plataforma contiguos
  por fila y deriva las columnas de caída (ingredientes con el mismo `x0`/`x1`,
  ordenados por fila) enlazadas con el plato que las cubre. Lanza `LevelError`
  con mensaje descriptivo.
- Las columnas se derivan, no se declaran: es la parte que el cambio #3
  sustituirá por segmentos. Se aísla en `loadLevel`/`Level` para que el resto
  del núcleo dependa solo de la estructura derivada.
- El inset visual del ingrediente (2 px a cada lado) es una constante de regla
  (`INGREDIENT_INSET = 2/32`) aplicada a las columnas del nivel.
- **Desviación visual menor**: el nivel clásico define **cuatro platos**, uno
  por columna de caída (el POC dibujaba una sola barra). Mejora el encaje con
  el concepto de plato y no afecta a las reglas.
- El chef y los enemigos limitan su desplazamiento al tramo continuo de
  plataforma de su fila (con margen de 12/32). En el nivel clásico es el ancho
  completo, idéntico al POC.
- El nivel clásico vive en TypeScript (`src/levels/classic.ts`), no en JSON,
  por ahora: da tipado y evita un cargador. Sigue siendo serializable (prueba de
  ida y vuelta por JSON).

*Alternativa descartada*: definir ya el formato de rejilla con registro de
piezas. Es el objetivo del cambio #3 y exige decisiones de diseño (segmentos,
grafo) que conviene tomar sobre un núcleo ya estable y probado.

### D9. `Simulation` y órdenes

```ts
new Simulation({ level, rng })               // posee su EventQueue interna
step(input: SimInput): readonly SimEvent[]   // un tick
startBoard()        // reinicia tablero (ingredientes, chef, enemigos)
nextLevel()         // desde levelClear: reconstruye conservando puntuación
newGame()           // reinicia partida completa
readonly chef, enemies, burgers, stats, status   // snapshots de solo lectura
```

`SimInput = { left, right, up, down, pepper }` (objeto de valor inmutable);
`pepper` es de un solo tick (pulsación puntual). El estado de partida
(`playing | levelClear | gameOver`) es mínimo; el cambio #5 lo sustituirá por
una máquina de estados mayor (muerte animada, "READY!", pausa), previsiblemente
con el patrón State.

### D10. Vista

- `GameScene` crea `Simulation` y `FixedStepper`. En `update(_, delta)`: lee
  teclas (mismo mapeo que hoy: cursores + WASD + Espacio, Enter, Esc) → arma
  `SimInput`; una pulsación de pimienta detectada con `JustDown` se guarda en
  un pendiente y se consume en el primer tick ejecutado (no se pierde si el
  fotograma ejecuta 0 ticks); ejecuta `steps = stepper.advance(delta)` ticks;
  sincroniza vistas con `alpha`; procesa eventos.
- Los objetos pasan de `Chef/Enemy/Ingredient` a `ChefView/EnemyView/
  IngredientView` en `src/objects/` (mismo dibujo con rectángulos, sin lógica,
  campos `#`, con `sync(snapshot, alpha)` y conversión tiles → píxeles). Se
  renombran para no confundirlos con las entidades del núcleo y reciben solo los
  snapshots de solo lectura.
- Los efectos adorno (nube de pimienta, destello, balanceo al aturdir,
  aceleración de caída) siguen usando tweens, pero sin ninguna repercusión en
  las reglas. El balanceo usa `stunTicksLeft` del snapshot.
- El laberinto se dibuja a partir del `Level`/`LevelData` (tramos, escaleras,
  platos), no de constantes.
- `boardStarted` reconstruye las vistas de ingredientes, de modo que reiniciar
  no deja efectos pendientes del tablero anterior.
- Sin cambios en `TapScene`, textos del HUD (siguen en español hasta el
  cambio #5) ni en `exitGame`.

### D11. Linter: Oxlint con reglas con tipos y fronteras de `src/sim/`

Se sustituye ESLint (+ `typescript-eslint`, `@eslint/js`, `globals`,
`eslint-config-prettier`) por **Oxlint** con **tsgolint** (reglas con
información de tipos sobre el compilador nativo de TypeScript 7). Prettier se
mantiene para el formato. Configuración en `.oxlintrc.json`:

- Categoría `correctness` en error y plugin `typescript`.
- Reglas con tipos: `no-floating-promises`, `no-misused-promises`,
  `await-thenable`, `unbound-method`, `switch-exhaustiveness-check` (esta
  última es clave para las uniones discriminadas de eventos).
- `no-unused-vars` con patrón `^_` para argumentos y capturas; `no-empty`
  permitiendo `catch` vacío (equivalente a la configuración ESLint actual).
- Entorno `browser` por defecto y `node` solo en `electron/**` y `scripts/**`
  mediante `overrides` (corrige que `globals.node` se aplicara también a
  `src/`).
- Bloque `overrides` para `src/sim/**/*.ts` con las fronteras del núcleo:
  - `no-restricted-imports`: `phaser`, `phaser/*`, `node:*` y cualquier ruta que
    apunte a `scenes/`, `objects/` o `config` (el núcleo no depende de la vista).
  - `no-restricted-globals`: `window`, `document`, `navigator`, `localStorage`,
    `sessionStorage`, `setTimeout`, `setInterval`, `requestAnimationFrame`,
    `performance`, `Date`.
  - `no-restricted-properties`: `Math.random`.
- Los archivos `*.test.ts` del núcleo quedan sujetos a las mismas reglas salvo
  la importación de `vitest`.
- Scripts: `lint` = `oxlint --type-aware`; `lint:fix` = `oxlint --type-aware
  --fix`. Las reglas con tipos usan un `tsconfig` por ejecución: se lanza una
  para el renderer (`tsconfig.json`) y otra para `electron/` y `scripts/`
  (`tsconfig.electron.json`), y se verifica que ambas cubren sus archivos.
- Se verificó en una prueba aislada (TypeScript 7.0.2, `oxlint` 1.86,
  `oxlint-tsgolint` 7.0.2003) que las fronteras y las reglas con tipos
  funcionan y que sobre el código actual de Xantar tarda unos 0,4 s. Sobre ese
  código marca dos problemas reales que ESLint no veía y que se corrigen en
  este cambio: la promesa sin esperar de `exitGame` y el método sin enlazar de
  `TapScene`.

La dirección de dependencias es vista → núcleo, nunca al revés; `src/levels/`
solo importa tipos del núcleo.

*Alternativas descartadas*:

- Mantener ESLint + `typescript-eslint`: no soporta TypeScript 7 (su rango
  llega hasta antes de 6.1) y obligaba a un alias temporal de TypeScript 6 como
  API JS.
- Biome (formateador + linter): se probó y reproduce el formato actual sin
  diferencias, pero sus reglas con tipos están en el grupo inestable `nursery`
  y usan inferencia propia en vez del compilador real. Se prefirió la precisión
  de tsgolint; la decisión de formateador puede revisarse más adelante.
- Oxfmt como formateador: sigue en versión 0.x; se mantiene Prettier.

### D12. Toolchain y pruebas

Se abandona el mínimo Node 20.19 y se actualiza a las últimas versiones
estables compatibles entre sí (primer grupo de tareas):

| Paquete            | Versión objetivo | Nota                                            |
| ------------------ | ---------------- | ----------------------------------------------- |
| `vite`             | ^8.3             | Node ^20.19 / >=22.12                           |
| `vitest`           | ^5.0             | Admite Vite 8; exige Node ^22.12 / ^24 / >=26   |
| `typescript`       | ^7.0.2           | Compilador nativo (`tsc`); un único paquete, sin alias |
| `oxlint`           | ^1.86            | Sustituye a ESLint (ver D11)                    |
| `oxlint-tsgolint`  | ^7.0.2003        | Reglas con tipos sobre el compilador de TS 7    |
| `electron`         | ^44.5            | parches                                         |
| `prettier`, `@types/node`, `wait-on` | último estable | parches |
| `phaser`           | ^4.2.1           | ya es la última estable                         |

- `engines.node` = `>=22.12.0` y `.nvmrc` con `24` (LTS en uso por el autor).
- Vitest: configuración en `vite.config.ts` (importando `defineConfig` de
  `vitest/config`): entorno `node`, `include: ['src/**/*.test.ts']`. Se importan
  `describe/it/expect` desde `vitest` (sin globales, por `types: []`).
- Scripts: `test` (`vitest run`) y `test:watch`.
- Niveles mínimos de prueba construidos con `LevelData` (una plataforma, una
  escalera, una columna de dos ingredientes…) para aislar cada regla; `Rng` y
  `EventSink` falsos inyectados en las pruebas de cada objeto.
- Pruebas obligatorias: un escenario por cada escenario de `gameplay-rules`;
  determinismo (misma semilla/entradas → misma traza de estado y eventos
  durante 3600 ticks); `FixedStepper` (fotogramas lentos/rápidos/pausa);
  umbrales seguros con paso fijo; integridad de `loadLevel`; ida y vuelta JSON
  del nivel clásico.
- Se añade `npm run test` al comando de verificación previa a la entrega.
- **TypeScript 7 (decisión del autor).** El paquete `typescript@7` trae el
  compilador nativo (`tsc`). `tsconfig.json` ya compila con él sin cambios;
  `tsconfig.electron.json` falla por `moduleResolution: node10` (eliminado en
  TS 7) y debe pasar a una resolución soportada. `typecheck` sigue siendo
  `tsc --noEmit && tsc -p tsconfig.electron.json --noEmit`.
- Se eliminan `eslint`, `@eslint/js`, `typescript-eslint`, `globals` y
  `eslint-config-prettier`, y `eslint.config.js`.
- El servidor de lenguaje del editor puede usar otra versión de TypeScript que
  la del proyecto; se documenta en `docs/MANUAL.md`.

## Risks / Trade-offs

- **[Paridad no demostrable al 100 %: el POC no es determinista ni hay
  grabaciones]** → Pruebas de reglas derivadas de la especificación, lista de
  diferencias documentadas (retardo de caída 7 ticks, completado al
  aterrizar, cuatro platos) y una comprobación manual de la partida completa
  por el autor antes de dar el cambio por bueno (AGENTS.md: sin commit hasta
  validación visual).
- **[Reescritura amplia de `GameScene` y objetos]** → Orden de tareas que
  deja el proyecto compilable en cada paso: primero el núcleo completo con sus
  pruebas sin tocar la vista; después el cambio de vista de una vez.
- **[Sobreingeniería orientada a objetos en un juego pequeño]** → Los patrones
  se aplican solo donde el comportamiento varía (IA, estados de ingrediente,
  eventos); el resto son clases simples. Una sola capa de herencia
  (`MovingEntity`).
- **[Saltos de versión simultáneos (Vite 8, TypeScript 7, Vitest 5) con
  ruptura de configuración]** → Se hacen primero y de forma aislada, con
  verificación de `lint`, `typecheck`, `build`, `dev` y arranque de Electron
  antes de tocar el código del juego; si alguna versión da problemas, se fija
  la anterior compatible y se anota el motivo.
- **[Oxlint/tsgolint: ecosistema de reglas más pequeño y herramienta más joven
  que ESLint]** → Se comprobó que cubre lo que el proyecto usa hoy (reglas
  recomendadas, reglas con tipos, restricciones por ruta). Si en el futuro
  hiciera falta una regla propia, se reevaluaría. El análisis con tipos usa un
  `tsconfig` por ejecución: se lanzan dos (renderer y Electron) y se verifica la
  cobertura.
- **[Inyección de dependencias manual frente a un contenedor]** → Sin
  contenedor (ni decoradores ni `reflect-metadata`) por no añadir dependencias
  de ejecución ni magia; la raíz de composición es la escena. Si el grafo de
  objetos creciera mucho, se reevaluaría en un cambio propio.
- **[El formato de nivel transitorio genera retrabajo en #3]** → Lo derivado
  (columnas) está aislado en `loadLevel`/`Level`; el formato lleva toda la
  geometría como datos, de modo que la migración es un conversor v0 → rejilla,
  no una reescritura de reglas.
- **[Interpolación: artefactos en reinicios o cambios de fila]** → `teleportTo`
  iguala `prev` en toda discontinuidad; prueba que lo comprueba.
- **[Reglas de `no-restricted-globals` demasiado estrictas]** → Se aplican
  solo a `src/sim/`; si bloquean algo legítimo, se ajusta la lista con el
  motivo documentado en el propio config.

## Migration Plan

0. Prerrequisito (lo prepara el autor): existe la rama de desarrollo
   `develop/v1.0.0` con `package.json` en `1.0.0`.
1. Rama de trabajo `change/is2-sim-core-fixed-step` creada desde la issue #2 a
   partir de `develop/v1.0.0`.
2. Actualizar toolchain, migrar a Oxlint y añadir Vitest y las guardas de `src/sim/` (el juego sigue
   funcionando con el código antiguo).
3. Implementar el núcleo completo con pruebas (`src/sim/`, `src/levels/`),
   todavía sin usarlo desde la vista.
4. Sustituir la vista por el adaptador (`GameScene`, `*View`), eliminar
   `src/level.ts` y las constantes de reglas de `config.ts`.
5. Documentar (`AGENTS.md`, `README.md`, `docs/MANUAL.md`) y verificación final
   (`lint`, `format:check`, `typecheck`, `test`, `build`, partida manual).

Retroceso: el trabajo queda sin commit hasta la validación del autor; se
puede descartar el árbol de trabajo o la rama `change/is2-sim-core-fixed-step`
sin efectos externos (no hay datos persistentes ni cambios de distribución).

## Open Questions

- Valor por defecto de `maxSteps` (5): se ajustará con la prueba manual si se
  observan saltos tras minimizar la ventana.
- Grabación y reproducción de entradas para depuración: queda **fuera** de
  este cambio y se tramita en la issue #8. Este cambio deja la base que la
  hace posible (semilla, entrada abstracta, núcleo determinista y la prueba de
  determinismo con entradas guionizadas) sin cambiar las especificaciones.
