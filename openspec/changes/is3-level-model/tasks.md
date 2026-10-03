# Tasks

## 1. Rama y preparación

- [x] 1.1 Crear la rama de trabajo `change/is3-level-model` desde la issue #3 (panel Development) a partir de `develop/v1.0.0` actualizada, hacer checkout local y verificar con `git branch --show-current` y `git log --oneline -1` que parte del último commit de `develop/v1.0.0` (los push los hace el autor)
- [x] 1.2 Habilitar `resolveJsonModule` en `tsconfig.json` y verificar con un JSON temporal importado desde `src/` que `npm run typecheck` y `npm run build` lo aceptan; borrar el JSON temporal después
- [x] 1.3 Mover de forma mecánica el modelo de nivel de #2 a `src/sim/legacy-level/` (con sus pruebas e imports) para liberar los nombres definitivos de `src/sim/level/`, sin cambiar comportamiento; verificar con `npm run lint && npm run typecheck && npm run test` en verde

## 2. Formato, registro de piezas y carga

- [x] 2.1 Definir `LevelDocument` (formato, versión, nombre, `cols`, `rows`, `segments` opcional con valores 2, 3 o 4 y por defecto 4, tres capas), las constantes de formato y versión y `LevelError` con capa, fila y columna opcionales; implementar `parseLevelDocument(valor)` y `parseLevelJson(texto)`; verificar con pruebas de formato o versión no soportados, versión futura, `segments` no permitido o ausente, capas con filas o longitudes incorrectas y texto que no es JSON
- [x] 2.2 Implementar `serializeLevel(documento)` estable y legible (una cadena por fila de cada capa); verificar con pruebas de ida y vuelta, idempotencia de la salida y forma del texto
- [x] 2.3 Implementar `PieceDefinition`, `PieceRegistry`, la interfaz `LevelBuilder` y las piezas de la versión 1 (`.` `=` `H` `+` `_` en `structure`; `T` `L` `P` `B` en `ingredients`; `C` `h` `p` `e` en `actors`, con ancho 1, o el tamaño de unidad del nivel en ingredientes y platos); verificar con pruebas de resolución por capa, símbolo repetido rechazado, mismo símbolo en capas distintas y registro de una pieza nueva de prueba
- [x] 2.4 Implementar `assembleLevel` y la nueva clase inmutable `Level` (agrupación de rachas por ancho de pieza o tamaño de unidad del nivel, ids deterministas fila-columna, errores con posición para símbolo desconocido, racha no múltiplo del ancho, falta o exceso de inicio del chef y segmento de ingrediente sin plataforma debajo, consultas `landingBelow` y `destinationOf`, platos con `expected`); verificar con pruebas de cada error, de dos unidades contiguas con unidades de 4, 3 y 2 casillas y de destinos con caída parcial y fuera del tablero
- [x] 2.5 Crear la utilidad de pruebas `levelFromGrid` (niveles pequeños a partir de cuadrículas de texto) en `src/sim/testing/` y verificar que se usa en las pruebas del ensamblado
- [x] 2.6 Crear `src/levels/classic.level.json` (20×15 equivalente al nivel clásico: cuatro platos de cuatro casillas, cuatro columnas de ingredientes, enemigos en la fila 3 y chef en la fila 12) y verificar con pruebas de paridad de geometría, destinos de los 16 ingredientes y ida y vuelta por texto

## 3. Grafo de navegación

- [x] 3.1 Implementar `PlatformEdge`, `LadderEdge` y la derivación del grafo desde las casillas del nivel (tramos de plataforma, tramos de escalera entre cruces consecutivos, escaleras colgantes registradas aparte) y exponerlo como `Level.graph`; verificar con pruebas del nivel clásico (cuatro tramos de plataforma y doce de escalera), plataforma interrumpida, escalera colgante y cruces consecutivos
- [x] 3.2 Implementar `NavPlace` (valor inmutable), `graph.positionOf`, `graph.platformAt` y `graph.ladderNear` con los límites de 12/32 y el enganche a 0,6 casillas; verificar con pruebas de posición en plataforma y escalera, límites del tramo y selección de escalera hacia arriba y hacia abajo
- [x] 3.3 Implementar `graph.shortestPath` (Dijkstra con desempate determinista) y `graph.reachableFrom`; verificar con pruebas de mismo tramo, una escalera, elección de la escalera de menor recorrido total en un nivel irregular, empate, sin camino, destino sobre una escalera, origen sobre una escalera y alcanzabilidad desde el inicio del chef

## 4. Validador

- [x] 4.1 Implementar `LevelIssue`, `LevelRule` y `validateLevel` con las siete reglas de D7; verificar con una prueba por regla (error o aviso, código y posición), una prueba con varias incidencias a la vez y una prueba de que el nivel clásico no produce ninguna
- [x] 4.2 Implementar `loadLevel(documento, { registry, requirePlayable })` y `loadLevelJson`; verificar con pruebas de carga estricta con error, carga permisiva, solo avisos y mensaje con la lista de errores

## 5. Núcleo de juego sobre el modelo nuevo

Durante este grupo el árbol puede no compilar entero hasta el final de 5.5 (los consumidores del modelo antiguo se sustituyen uno a uno); cada tarea se verifica con las pruebas de sus propios archivos (`npx vitest run <ruta>`).

- [x] 5.1 Reescribir `Chef` sobre `NavPlace`: movimiento por plataforma, enganche a la escalera, movimiento sobre la escalera solo con entrada (parada e inversión a mitad, entrada lateral ignorada, arriba y abajo a la vez se anulan), llegada a extremo, escaleras consecutivas y snapshot con `onPlatform` y `place`; verificar con pruebas de cada escenario de `gameplay-rules` sobre escaleras
- [x] 5.2 Reescribir `Enemy`, `EnemyBrain` y `ChaseBrain` sobre el grafo (camino más corto, escalera completa en el sentido decidido, inversión del 20 %, sin camino) y reaparición en los marcadores de enemigo; verificar con pruebas de chef en otra plataforma, camino más corto en un nivel irregular, misma plataforma, sin camino, aturdimiento y reaparición
- [x] 5.3 Reescribir `Ingredient` con `segments` segmentos (`stompAt`, reinicio al aterrizar en plataforma, snapshot `stomped` y `left`/`width`); verificar con pruebas de pisado, pisado parcial persistente, activación al pisar el último segmento con 4, 3 y 2 segmentos y reinicio
- [x] 5.4 Implementar `Plate` y `IngredientField` (pisado desde la posición del chef, activación en cadena por impacto con retardo de 7 ticks, `startFall` con aplastamiento por filas y columnas, aterrizajes en plataforma o plato, completado del plato); verificar con pruebas de cadena consecutiva, solo cae lo golpeado, solape parcial, orden de apilado, plato incompleto, plato completo con puntos y pimienta y un nivel de minihamburguesas de 3 casillas completo
- [x] 5.5 Adaptar `Simulation` al modelo nuevo (nivel con grafo, `IngredientField`, platos, eventos `segmentStomped` y `plateId`, nivel superado cuando los platos con ingredientes están completos, `sim.ingredients` y `sim.plates` en lugar de `sim.burgers`); verificar con las pruebas de escenario (pisado, cadena, aplastamiento y combo, reaparición, pimienta, contacto, game over, nivel superado, nextLevel, newGame) y con la prueba de determinismo adaptada, y comprobar que `npm run typecheck` solo falla en la vista

## 6. Vista y limpieza

- [x] 6.1 Reescribir `IngredientView` con `segments` segmentos de una casilla y los pisados más bajos; verificar con `npm run typecheck`
- [x] 6.2 Adaptar `GameScene` para cargar `classic.level.json` con `parseLevelDocument` y `loadLevel`, dibujar plataformas, escaleras y platos desde el nivel y consumir `sim.ingredients` y `sim.plates`; verificar con `npm run typecheck` y `npm run build`
- [x] 6.3 Eliminar `LegacyLevel*`, `Burger`, `src/levels/classic.ts`, las constantes obsoletas (`INGREDIENT_INSET`, `TRAVERSAL_TOLERANCE`, `TRAVERSAL_REACH`) y las exportaciones sobrantes de `src/sim/index.ts`; verificar con `grep` que no quedan referencias y con `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` en verde
- [x] 6.4 Prueba automatizada en Electron sobre `dist/` (script de humo de #2: capturas y consola) que verifique sin errores de consola el pisado de segmentos, la caída al plato, una parada a mitad de escalera y la inversión del sentido; dejar las capturas para el autor

## 7. Documentación

- [x] 7.1 Actualizar `README.md`: cómo se juega con ingredientes de varios segmentos que se pisan (2, 3 o 4 según el nivel), caída en cadena por impacto y escaleras con parada e inversión, y la fila del modelo de nivel en la tabla de hoja de ruta; verificar con `npm run format:check` y relectura
- [x] 7.2 Actualizar `docs/MANUAL.md`: estructura de `src/sim/level` y `src/sim/nav`, formato de nivel v1 con un ejemplo, receta "Añadir una pieza al registro" y receta "Crear un nivel a mano y validarlo"; verificar que los comandos y símbolos documentados coinciden con el código y que `npm run format:check` pasa

## 8. Verificación final

- [x] 8.1 Ejecutar `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` y verificar que todo termina con código 0
- [x] 8.2 Comprobar con `npm run build:desktop:dir` que la aplicación de escritorio arranca y juega igual
- [ ] 8.3 Partida manual del autor con la lista: pisar segmentos sueltos y ver que persisten, completar un ingrediente, cadena de caídas en el nivel clásico, aplastar enemigos, pimienta, escaleras (parar e invertir a mitad), enemigos que bajan y suben por el camino más corto, completar un nivel y game over con Enter; anotar las diferencias de jugabilidad que no parezcan intencionadas
