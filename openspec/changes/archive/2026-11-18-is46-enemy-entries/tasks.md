# Tasks

## 1. Issue, rama y carpeta del cambio

- [x] 1.1 Con el PR #48 (is45) ya fusionado, crear desde la issue #46 la rama `change/is46-enemy-entries` a partir de `develop/v1.0.0` actualizada (`gh issue develop 46 --base develop/v1.0.0 --name change/is46-enemy-entries --checkout`), llevando la carpeta `openspec/changes/is46-enemy-entries/`, y comprobar que la issue #46 describe también la vuelta de los montados y tiene el hito `v1.0.0`; verificar con `git branch --show-current`, `gh issue view 46` y `openspec list`

## 2. Pasarelas y entradas en el nivel

- [x] 2.1 Añadir la pieza `walkway` (`-`, capa `structure`) a `defaultPieces.ts`, guardarla en `LevelAssembly`/`Terrain` (`hasWalkway`) fuera de los tramos de plataforma, y rechazar al ensamblar un marcador de enemigo sobre una pasarela sin plataforma al lado; verificar con pruebas de `assembleLevel` y del grafo (la pasarela no crea tramo de plataforma ni la pisa el chef) y `npm run test`
- [x] 2.2 Leer y escribir `entries` en `levelJson.ts` (`LevelDocument`, validación de tipos y de casillas dentro del tablero, `serializeLevel` solo si existe) y dar en `Level.enemySpawns` `delayTicks` y, para los marcadores sobre una pasarela, `joinX`; verificar con pruebas de `levelJson` (ida y vuelta con y sin `entries`, errores de formato) y de `assembleLevel` (retraso en ticks, `joinX` a izquierda y derecha)
- [x] 2.3 Añadir al validador `walkway-detached` y `entry-without-enemy` (errores) y hacer que `spawn-unreachable` use la plataforma de destino de las entradas; verificar con pruebas de `validateLevel` (los tres casos de la spec) y `npm run lint`
- [x] 2.4 Documentar la pasarela y `entries` en `docs/MANUAL.md` (§8.6: tabla de símbolos, campo `entries`, reglas del validador; receta §9.7); verificar con `npm run format:check` y las comprobaciones de entrega

## 3. Entrada y vuelta de los enemigos

- [x] 3.1 En `Enemy`, añadir el modo fuera (`#away`: ticks y forma de volver) y el modo entrando (`#entrance`: avance a `ENEMY_SPEED` hasta `joinX` y paso a la plataforma), con `reset` fuera con el retraso de su entrada, `squash()` fuera 150 ticks con un marcador al azar y `dropAt(place)` fuera 150 ticks con un sitio dado; verificar con pruebas de `Enemy` (oculto e inactivo hasta su retraso, avance constante por la pasarela, aturdido quieto en la pasarela, se une a la plataforma y decide, vuelta en el sitio dado con `enemyRespawned`)
- [x] 3.2 En `Simulation`, dejar a los enemigos fuera con sus retrasos al empezar el tablero y tras perder una vida, y soltar a los montados con `dropAt` en la plataforma de la fila del ingrediente o, si acabó en el plato, en la más baja por encima del plato; verificar con pruebas de reglas (tablero vacío hasta el primer retraso, orden de entrada, vuelta tras perder una vida, montado que vuelve donde paró y encima de la hamburguesa, aplastado que vuelve por un marcador, contacto y pimienta mientras entra) y la de determinismo
- [x] 3.3 Documentar la entrada y la vuelta en `README.md` ("Enemies": entran por los lados uno a uno; los montados vuelven donde paran), `docs/MANUAL.md` (§8.5: `Enemy`, modos fuera y entrando, `dropAt`, enemigos montados) y `docs/GAMEDEV_FUNDAMENTALS.md` (entrada escalonada de enemigos como dato del nivel); verificar con `npm run format:check`, `grep` de los nombres citados y las comprobaciones de entrega

## 4. Pasarela en pantalla

- [x] 4.1 Añadir el gráfico `walkway` (SVG 16×12 con la forma del tramo central en `f-platformEdge`, sin brillo) al catálogo y dibujarlo en `MazeView` en cada casilla de pasarela; verificar con las pruebas del arte, `npm run smoke` y la hoja de arte en `/tools/art-sheet.html`
- [x] 4.2 Documentar la pasarela en `docs/STYLE_GUIDE.md` (tabla de encaje de piezas); verificar con `npm run format:check`

## 5. Nivel clásico con los enemigos del original

- [x] 5.1 Poner en `src/levels/classic.level.json` las pasarelas de las filas 5 y 23 (columnas 0–3 y 35–38), los marcadores perrito (5, 0), perrito (5, 38), perrito (23, 0) y huevo (23, 38), y `entries` con 500, 1000, 2750 y 4500 ms para (23, 38), (23, 0), (5, 38) y (5, 0); actualizar `classic.level.test.ts` (cuatro entradas, tipos, retrasos y `joinX`; el nivel se puede terminar; el montado de la calle 3 baja tres pisos) y `Simulation.test.ts`; verificar con `npm run test`
- [x] 5.2 Probar en `npm run smoke` y en `npm run dev` que la pantalla empieza vacía, que los enemigos entran por los lados en el orden del original y que un montado vuelve donde paró; documentar el nivel en `docs/MANUAL.md` (§8.5) y la hoja de ruta de `README.md`; verificar con las comprobaciones de entrega

## 6. Integración

- [x] 6.1 Ejecutar las comprobaciones de entrega completas (`npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`, `npm run smoke`) y `openspec validate is46-enemy-entries --strict`; verificar que todo termina sin errores
- [x] 6.2 Jugar en `npm run dev` y en `npm run dev:desktop` comparando con la grabación: entradas por los lados con el orden y los tiempos del original, pasarelas que se distinguen del piso y enemigos montados que vuelven donde paran (lo verifica el autor)

## Workflow follow-up

- El autor hace el push; PR hacia `develop/v1.0.0` con `Closes #46`.
- Archivar el cambio tras la confirmación del autor, sincronizar las specs y revisar los Non-Goals del diseño para crear las issues de seguimiento que falten (los comportamientos por tipo ya están en #17 y el texto flotante en #24).
