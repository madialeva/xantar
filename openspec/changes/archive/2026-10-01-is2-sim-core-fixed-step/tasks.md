# Tasks

## 1. Rama, toolchain y tooling de pruebas

- [x] 1.1 Comprobar que existe `develop/v1.0.0` en `origin` con `package.json` en `1.0.0` (ya creada por el autor); crear la rama de trabajo `change/is2-sim-core-fixed-step` desde la issue #2 (panel Development) a partir de esa rama, hacer checkout local y verificar con `git branch --show-current` (los push los hace el autor)
- [x] 1.2 Actualizar la toolchain según la tabla de D12 (Vite 8.3, TypeScript 7.0.2 como único paquete `typescript`, Electron 44.5, Prettier, @types/node y wait-on a su última estable), cambiar `moduleResolution` en `tsconfig.electron.json` (TS 7 elimina `node10`) y adaptar `vite.config.ts` a lo que exija Vite 8; verificar con `npm install` sin errores de peer, `npx tsc -v` (7.x) y `npm run format:check && npm run typecheck && npm run build`
- [x] 1.3 Migrar de ESLint a Oxlint según D11: instalar `oxlint` y `oxlint-tsgolint`, crear `.oxlintrc.json` (categoría `correctness`, reglas con tipos, `no-unused-vars` con `^_`, `no-empty` con `catch` vacío permitido, entorno `browser` y `node` solo en `electron/**` y `scripts/**`), definir `lint` y `lint:fix` con una ejecución con tipos para el renderer y otra para Electron y scripts, y eliminar `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-config-prettier` y `eslint.config.js`; verificar que `npm run lint` analiza los archivos de `src/`, `electron/` y `scripts/` y que un archivo temporal con una promesa sin esperar hace fallar el lint en ambas ejecuciones (borrarlo después)
- [x] 1.4 Corregir los dos problemas que marca Oxlint sobre el código actual (la promesa sin esperar de `exitGame` en `GameScene` y el método sin enlazar de `TapScene`) sin cambiar su comportamiento; verificar con `npm run lint` con código 0 y comprobando a mano que la salida del juego y la pantalla de inicio siguen funcionando
- [x] 1.5 Fijar el entorno: `engines.node` `>=22.12.0` en `package.json` y `.nvmrc` con `24`; verificar que `npm install` no emite avisos de `engines` y que `cat .nvmrc` devuelve `24`
- [x] 1.6 Comprobar que el juego sigue funcionando con la toolchain nueva: `npm run dev` sirve la página en http://localhost:5173 y se puede jugar una partida corta, y `npm run build:desktop:dir` genera la app de escritorio que arranca; anotar cualquier fijación de versión por incompatibilidad y su motivo
- [x] 1.7 Añadir `vitest` (^5.0) como devDependency, configurarlo en `vite.config.ts` (entorno `node`, `include: ['src/**/*.test.ts']`) y añadir los scripts `test` y `test:watch`; verificar con una prueba temporal trivial que `npm run test` la ejecuta y termina con código 0, y borrarla después
- [x] 1.8 Añadir a `.oxlintrc.json` el bloque de `overrides` de `src/sim/**/*.ts` (imports, globales y `Math.random` restringidos según D11); verificar con un archivo temporal que importe `phaser`, use `window` y llame a `Math.random` que `npm run lint` falla con los tres errores, y borrarlo después
- [x] 1.9 Actualizar la documentación de este grupo: versiones y herramientas en `AGENTS.md` (Stack and constraints, "Prettier y Oxlint" en lugar de ESLint, comando de verificación con `npm run test`, tabla de comandos y regla de la frontera `src/sim/`), requisito de Node en `README.md`, y `docs/MANUAL.md` (secciones 2 y 3 de versiones y requisitos, sección 14.3 de lint y formato, nota del servidor de lenguaje del editor, y sección 11 de convenciones: ya usa `#`, pero su línea sobre el idioma de comentarios contradice AGENTS.md, que exige inglés); verificar con `npm run format:check` y relectura de los tres archivos

## 2. Fundamentos del núcleo

- [x] 2.1 Crear `src/sim/rules.ts` con las constantes de reglas en tiles y ticks según la tabla de conversión de D2, y verificar con una prueba que cada valor coincide con su equivalente del POC (p. ej. `CHEF_SPEED * 32 === 115`)
- [x] 2.2 Crear `src/sim/geometry.ts` con las funciones puras necesarias (solape de rangos, distancias, límites, conversión) y verificar con pruebas unitarias de casos límite
- [x] 2.3 Implementar `src/sim/rng.ts` (`interface Rng` y `SeededRng` mulberry32 con `next`, `int`, `pick`) y verificar con pruebas de reproducibilidad por semilla, rango de `int` y distribución básica
- [x] 2.4 Implementar `src/sim/events.ts` (unión `SimEvent` inmutable, `interface EventSink`, `EventQueue` con `emit` y `drain`) y verificar con pruebas de acumulación, vaciado y de que un tick sin sucesos devuelve una lista vacía
- [x] 2.5 Implementar `src/sim/stepper.ts` (`FixedStepper` con `advance`, `alpha` y límite `maxSteps`) y verificar con pruebas de los escenarios de la especificación: 55 ms → 3 ticks con 5 ms de resto, 8 ms → 0 ticks conservando el resto, pausa de 5 s → límite y descarte
- [x] 2.6 Crear `src/sim/index.ts` y verificar con `npm run typecheck` y `npm run lint` (incluidas las guardas de frontera) que el núcleo compila y cumple las restricciones

## 3. Nivel

- [x] 3.1 Definir en `src/sim/level/LevelData.ts` los tipos `LevelData`, `IngredientKind` y `EnemyKind` y verificar que `npm run typecheck` pasa
- [x] 3.2 Implementar `Level` (consultas de navegación: tramo de plataforma de una posición, escaleras que parten de una fila hacia arriba o abajo, escalera cercana, mejor escalera hacia una fila objetivo, puntos de reaparición, columnas de caída) y verificar con pruebas sobre un nivel mínimo
- [x] 3.3 Implementar `loadLevel` (validación de integridad, fusión de tramos contiguos, derivación de columnas con su plato, `LevelError`) y verificar con pruebas de los escenarios de `level-data`: ingrediente fuera del tablero, nivel sin chef, columna sin plato, tramos contiguos fusionados, columna derivada y ordenada
- [x] 3.4 Migrar el nivel del POC a `src/levels/classic.ts` (cuatro filas de plataforma, escaleras en las columnas 0, 9, 10 y 19, cuatro columnas de ingredientes con cuatro platos, inicio del chef, tres enemigos y puntos de reaparición) y verificar con pruebas de paridad de geometría y de ida y vuelta por JSON

## 4. Entidades base, chef y estadísticas

- [x] 4.1 Implementar `MovingEntity` (`x`, `y`, `prevX`, `prevY`, `beginTick`, `teleportTo`) y las interfaces de solo lectura `ChefSnapshot` y `StatsSnapshot` (las de enemigo, ingrediente y hamburguesa se añaden con sus clases en los grupos 5 y 6); verificar con pruebas de que `beginTick` copia la posición y `teleportTo` iguala `prev`
- [x] 4.2 Implementar `Chef` con el movimiento horizontal (velocidad, orientación, límites del tramo de plataforma, direcciones opuestas simultáneas) y verificar con pruebas de caminar 60 ticks (115/32 tiles), extremo del tramo y direcciones opuestas
- [x] 4.3 Implementar las escaleras del chef (búsqueda a ≤ 0,6 tiles, centrado, recorrido a 80/32 tiles/s, sin movimiento lateral durante el recorrido) y verificar con pruebas de subir, no subir sin escalera y entrada lateral durante la subida
- [x] 4.4 Implementar `GameStats` (puntos, vidas, pimientas, nivel, combo; emite `scoreChanged`) y verificar con pruebas de sumar puntos, consumir pimienta y reinicio del combo
- [x] 4.5 Implementar el esqueleto de `Simulation` (constructor con nivel, `Rng` y `EventSink`, `step`, `startBoard`, estado `playing`/`levelClear`/`gameOver`, tick inerte fuera de `playing`) y verificar con pruebas de construcción, evento `boardStarted`, tick sin eventos, posición previa y reinicio (el tick inerte con `gameOver` se prueba en 6.5, cuando ese estado es alcanzable)

## 5. Ingredientes y hamburguesas

- [x] 5.1 Implementar `Ingredient` con el patrón State (`Idle`, `Waiting`, `Falling`, `Stacked`), incluido el recorrido por el chef (armado por extremo, tolerancias, cancelación al salir o cambiar de fila); verificar con pruebas de recorrido completo, recorrido abandonado y transiciones de estado con progreso de caída
- [x] 5.2 Implementar `Burger` (columna + plato): activación del sufijo en cadena con retardo de 7 ticks, caída de 12 ticks, puntos por ingrediente en la activación, hueco de pila y finalización de hamburguesa al aterrizar la última pieza (400 puntos, +1 pimienta); verificar con pruebas de activar el superior (200 puntos, caen de abajo arriba), activar el inferior (cae solo uno), hamburguesa completa, orden de apilado y que no se completa antes del aterrizaje de la última pieza
- [x] 5.3 Implementar el aplastamiento mediante la interfaz inyectada `CrushTarget` (rango de columnas y filas al iniciar la caída), el combo y la reaparición a los 150 ticks; verificar con pruebas de aplastamientos consecutivos (100 y 200 puntos) y de reaparición

## 6. Enemigos, pimienta y partida

- [x] 6.1 Implementar `EnemyBrain` (Strategy) y `ChaseBrain` (decisión cada 30–66 ticks con `Rng`, escalera más cercana hacia el chef, 20 % de inversión) y `Enemy` (movimiento, recorrido de escalera, aturdimiento, aplastado y reaparición) con `createEnemy`; verificar con pruebas de chef en otra fila (baja/sube por escalera), en la misma fila (se acerca) y de inmovilidad al estar aturdido
- [x] 6.2 Verificar con una prueba que el avance por tick en escalera y en paseo de enemigo es menor que la ventana de alineado (umbral seguro de D2) para las constantes vigentes
- [x] 6.3 Implementar la pimienta (5 iniciales, consumo, nube, aturdimiento a 300 ticks dentro del área, pulsación puntual); verificar con pruebas de aturdir cercano, sin pimientas y pimienta mantenida que solo se consume una vez
- [x] 6.4 Implementar el contacto con enemigos, las vidas, el reinicio de posiciones y `gameOver`; verificar con pruebas de contacto con vidas restantes, última vida y enemigo aturdido inocuo
- [x] 6.5 Implementar `levelClear`, `nextLevel` y `newGame`; verificar con pruebas de última hamburguesa (nivel +1), continuar conservando puntuación/vidas/pimientas y nueva partida tras `gameOver`
- [x] 6.6 Verificar con pruebas que los eventos se emiten con los datos esperados (aplastamiento con id, posición y puntos)

## 7. Determinismo e integración del núcleo

- [x] 7.1 Añadir una prueba de determinismo: dos simulaciones con la misma semilla y una secuencia de entradas guionizada durante 3600 ticks producen el mismo estado y los mismos eventos; y con semilla distinta divergen
- [x] 7.2 Añadir una prueba de interpolación: tras reinicio de tablero, reaparición y pérdida de vida, `prev` coincide con la posición actual
- [x] 7.3 Ejecutar `npm run lint && npm run typecheck && npm run test` y verificar que pasan con el núcleo completo, sin que la vista use todavía el núcleo

## 8. Adaptador de vista

- [x] 8.1 Crear `ChefView`, `EnemyView` e `IngredientView` en `src/objects/` (mismo dibujo, sin lógica, campos `#`, con `sync(snapshot, alpha)` y conversión tiles → píxeles con los desplazamientos visuales propios) y verificar con `npm run typecheck`
- [x] 8.2 Reescribir `GameScene` como adaptador: crear `Simulation` (con `SeededRng` sembrado con `Date.now()`) y `FixedStepper`, leer teclas a `SimInput`, guardar la pulsación de pimienta pendiente hasta el primer tick ejecutado, ejecutar los ticks del fotograma y sincronizar vistas con `alpha`
- [x] 8.3 Dibujar el laberinto desde el nivel (tramos, escaleras, cuatro platos) y reconstruir las vistas de ingredientes con el evento `boardStarted`
- [x] 8.4 Traducir eventos a efectos (destello al perder vida, nube de pimienta, balanceo al aturdir, aceleración de caída) y al HUD y overlays existentes, con Enter llamando a `startBoard`, `nextLevel` o `newGame` según el estado
- [x] 8.5 Eliminar `src/level.ts`, los `Chef/Enemy/Ingredient` antiguos y las constantes de reglas de `config.ts` (dejando tile, tamaño de pantalla, colores, alturas de dibujo y conversiones); verificar con `npm run lint && npm run typecheck && npm run build` y con `grep` que no quedan referencias a lo eliminado
- [x] 8.6 Actualizar `docs/MANUAL.md` (estructura del repositorio, arquitectura núcleo/vista y su modelo de objetos, comandos de prueba, receta para añadir una regla con su prueba) y verificar con `npm run format:check`

## 9. Verificación final

- [x] 9.1 Ejecutar `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` y verificar que todo termina con código 0
- [x] 9.2 Partida manual en `npm run dev` (caminar, escaleras, caídas en cadena, aplastar, pimienta, perder vidas, fin de nivel con Enter, fin de partida con Enter) y comprobar la paridad jugable con el POC; dejar el resultado anotado para el autor
- [x] 9.3 Comprobar con las herramientas de desarrollo del navegador (limitación de CPU y, si es posible, monitor de alta frecuencia) que la velocidad de chef y enemigos no depende del framerate y que tras minimizar la ventana no hay saltos
- [x] 9.4 Comprobar con `npm run build:desktop:dir` que la aplicación de escritorio arranca y juega igual; el árbol queda sin commit a la espera de la validación del autor

Notas de verificación (9.2 validada por el autor en su partida manual: fluidez correcta; las mecánicas que faltan respecto al original se tramitan en #3 y #9):

- Prueba automatizada en Electron sobre `dist/` (Xvfb, canvas): sin errores de consola; el chef camina, sube escaleras, un ingrediente activado cae en cadena al plato (+50), la pimienta consume una unidad y muestra la nube, los enemigos bajan por las escaleras, el contacto resta vida, y tras perder las 3 vidas aparece GAME OVER y Enter reinicia con el estado inicial.
- Velocidad independiente del framerate: con limitación de CPU de 1×, 6× y 20× (61, 61 y 43 fps) el chef recorre 2,88, 2,88 y 2,77 tiles en 0,8 s (esperado 2,88).
- No comprobado de forma interactiva: completar un nivel entero con la partida real (cubierto por pruebas unitarias de la simulación) y la comprobación visual fina del autor.
