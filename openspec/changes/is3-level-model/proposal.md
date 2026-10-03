# Proposal

Seguimiento: issue #3 (hito `v1.0.0`). Depende de #2 (núcleo de simulación,
archivado). Cambios siguientes del plan: #4 visual, #5 escenas e i18n, #6
input/audio/CI/Electron, #7 editor, #8 replays, #9 enemigos montados.

## Why

El núcleo de #2 lee el nivel de una estructura transitoria (listas de
plataformas, escaleras, ingredientes y platos) que solo sabe expresar el nivel
clásico: ingredientes monolíticos agrupados en "columnas de caída" por rango
idéntico de casillas, escaleras que el chef recorre de extremo a extremo sin
poder detenerse ni invertir, y una IA que elige "la escalera más cercana en x".
Los niveles reales de BurgerTime tienen plataformas irregulares, escaleras
distintas en cada piso y ingredientes de varios segmentos que se pisan uno a
uno. Y el objetivo del proyecto es que el usuario pueda **crear sus propias
pantallas** (#7). Para ello hace falta el modelo de nivel de verdad: un formato
versionado y editable, un registro de piezas extensible, segmentos de
ingrediente, un grafo de navegación y un validador que garantice que un nivel
se puede jugar.

## What Changes

- **Formato de nivel v1**: fichero JSON versionado (`format`, `version`,
  `name`, `cols`, `rows`, `segments` opcional y tres capas de cuadrícula de
  caracteres: `structure`, `ingredients`, `actors`). `segments` (2, 3 o 4; 4 por
  defecto) fija el tamaño de las hamburguesas del nivel, para tener pantallas
  con minihamburguesas. Funciones para importar y exportar
  JSON (`parseLevelJson`, `serializeLevel`) con errores que indican fila y
  columna. La interfaz de importar/exportar es de #7.
- **Registro de piezas extensible** (`PieceRegistry`): cada pieza (plataforma,
  escalera, cruce, plato, cuatro ingredientes, inicio del chef, tres enemigos)
  se define por id, símbolo, capa, ancho (fijo, o el tamaño de unidad del nivel
  para ingredientes y platos) y la forma en que aporta al nivel. Añadir una pieza no toca el núcleo; la lógica queda separada del
  aspecto (los temas son de #4).
- **Nivel clásico migrado** a `src/levels/classic.level.json` (cuadrícula de
  20×15 con cuatro platos de cuatro casillas). El formato transitorio de #2 se
  sustituye; no existen ficheros externos que migrar.
- **Ingredientes con segmentos**: tantos segmentos de una casilla como indique
  el nivel (2, 3 o 4). El chef pisa un segmento al entrar en su casilla
  caminando por la plataforma; los segmentos pisados permanecen pisados, y
  cuando están todos el ingrediente cae. Al aterrizar en otra plataforma se
  reinician.
- **Caída en cadena por impacto**: un ingrediente cae hasta el primer soporte
  por debajo (plataforma o plato bajo cualquiera de sus columnas); los
  ingredientes inmóviles que están en esa fila y solapan sus columnas son
  golpeados y caen también, recursivamente. Sustituye a "caen todos los de la
  columna por debajo".
- **Platos**: desaparecen `Burger` y las "columnas de caída". Cada plato conoce
  el número de ingredientes que acabarán en él (destino calculado al cargar) y
  se completa cuando han aterrizado todos; sin receta.
- **Grafo de navegación** derivado del nivel (tramos de plataforma y tramos de
  escalera unidos en los cruces) y **posición = arista + desplazamiento** para
  el chef y los enemigos.
- **El chef controla la escalera con la entrada**: sobre una escalera se mueve
  solo mientras pulsa arriba o abajo y puede detenerse e invertir el sentido en
  cualquier punto, como en el original. Sobre la plataforma puede girar siempre.
- **Enemigos sobre el grafo**: la IA elige el **camino más corto** hacia el chef
  (Dijkstra sobre los nodos de cruce) en vez de la escalera más cercana en x;
  mismo ritmo de decisión, misma probabilidad de inversión. El sentido de
  subida se decide al decidir, no al llegar.
- **Validador de niveles** (`validateLevel`): lista de incidencias con
  severidad, código, mensaje y posición (ingrediente inalcanzable, destino que
  no es un plato, escalera colgante, nivel sin ingredientes…). `loadLevel`
  rechaza por defecto los niveles con errores; el editor (#7) podrá cargar
  niveles incompletos.
- **Vista**: dibuja los segmentos de cada ingrediente (los pisados más
  bajos) y el laberinto, las escaleras y los platos a partir del nivel cargado.
- **BREAKING (jugabilidad, deliberado)**: pisado por segmentos en lugar de
  recorrer el ingrediente entero; la cadena de caídas afecta solo a lo golpeado;
  la escalera deja de recorrerse sola. Con el nivel clásico y filas
  consecutivas la cadena coincide con la actual.
- **Documentación**: `README.md` (cómo se juega) y `docs/MANUAL.md`
  (arquitectura, formato de nivel, receta para añadir una pieza).
- Al archivar, los Non-Goals de `design.md` se enlazan a las issues existentes
  (regla 9 de `AGENTS.md`) en lugar de duplicarse.

## Capabilities

### New Capabilities

- `level-pieces`: registro extensible de piezas de nivel (símbolo, capa, ancho,
  aportación al nivel) y reglas de agrupación de piezas de varias casillas.
- `level-validation`: validación de jugabilidad de un nivel cargado, con
  incidencias estructuradas y la política de carga.
- `navigation-graph`: grafo de navegación derivado del nivel, posición sobre el
  grafo (arista + desplazamiento) y búsqueda del camino más corto.

### Modified Capabilities

- `gameplay-rules`: escaleras del chef con inversión, pisado de segmentos en
  lugar de recorrido, caída en cadena por impacto, apilado en platos con
  destino, reaparición en puntos de aparición y enemigos con camino más corto.
- `level-data`: descripción del nivel como cuadrícula JSON versionada con
  importación y exportación, nivel clásico migrado, integridad estructural con
  posición del error; se elimina la agrupación en columnas de caída.
- `view-adapter`: dibujo de segmentos pisados y del laberinto a partir del nivel.

## Impact

- **Código**: se reescribe `src/sim/level/` (formato, registro, ensamblado,
  `Level`); nuevo `src/sim/nav/` (grafo, posición, camino más corto); se
  reescriben `Chef`, `Enemy`, `EnemyBrain` e `Ingredient` y se sustituyen
  `Burger` por `Plate` e `IngredientField`; se adapta `Simulation`; se adaptan
  `GameScene` e `IngredientView`; `src/levels/classic.ts` pasa a
  `classic.level.json`.
- **Dependencias**: ninguna nueva. Se habilita `resolveJsonModule` en
  `tsconfig.json`.
- **Jugabilidad**: cambios deliberados descritos arriba; requieren una
  comprobación manual del autor.
- **Documentación**: `README.md`, `docs/MANUAL.md` y las especificaciones.
- **Fuera de alcance** (issues existentes): interfaz del editor (#7), temas y
  arte vectorial (#4), enemigos montados sobre ingredientes (#9), replays (#8).
