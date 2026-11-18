# Tasks

## 1. Rama del cambio

- [x] 1.1 Crear desde la issue #45 la rama `change/is45-board-proportions` a partir de `develop/v1.0.0` actualizada (`gh issue develop 45 --base develop/v1.0.0 --name change/is45-board-proportions --checkout`), llevando consigo la carpeta `openspec/changes/is45-board-proportions/` y la nota de Blender de `AGENTS.md`; verificar con `git branch --show-current`, `gh issue view 45` (hito `v1.0.0`, rejilla de 16 y enlace a la carpeta) y `openspec list`

## 2. Rejilla de 16 en la simulación y la configuración

- [x] 2.1 En `src/sim/rules.ts`, exportar `CELL_UNITS = 16` y convertir con ella en `fromPx`; pasar `LADDER_GRAB_DISTANCE` y `STEP_OFF_DISTANCE` a `fromPx(19.2)` y `fromPx(12.8)`; en `src/config.ts`, derivar `TILE` de `CELL_UNITS` y poner `COLS = 39` y `ROWS = 30`; corregir las pruebas de la simulación que fijan distancias en casillas de 32 (expresarlas con `fromPx` o en unidades); verificar con `npm run test` y `npm run typecheck`
- [x] 2.2 Convertir provisionalmente `src/levels/classic.level.json` a la rejilla nueva (cada casilla en 2×2, centrado en 39×30, ingredientes de 4 casillas sobre la mitad izquierda de su ancho antiguo y platos debajo) y ajustar `classic.level.test.ts`, `NavigationGraph.test.ts` y `Simulation.test.ts` a ese nivel; verificar con `npm run test` y `npm run lint`
- [x] 2.3 Pasar `MazeView`, `IngredientView`, `EventEffects` y `ArtSheetScene` a desplazamientos que no supongan casillas de 32 (por ejemplo, el destello del plato a 96 unidades y no a `3 * TILE`); colocar a los personajes por los pies (`platformY(y) − 6`, con `FEET_Y = 10` en `CharacterRig`) en `ChefView` y `EnemyView`; poner `board.backdrop` a 624×480 (SVG y catálogo); actualizar `computeLayout.test.ts` (tablero de 624, mínimo de 816, paneles de 114,5 en 16:9); verificar con `npm run test`, `npm run smoke` y en `npm run dev` (el juego funciona sobre la rejilla nueva con el arte antiguo comprimido y los personajes con los pies en el suelo)
- [x] 2.4 Documentar la rejilla de 16, el tablero de 39×30 (624×480) y el área de juego de 816–1152 en `AGENTS.md`, `README.md` ("20×15 board"), `docs/MANUAL.md` (§8.1, §8.5, §8.6 y §8.7: `CELL_UNITS`, `TILE`, convenio de los pies) y `docs/GAMEDEV_FUNDAMENTALS.md` (la rejilla de caracteres del original a escala ×2; pantalla y layout); verificar con `grep -rn "640\|20×15\|832\|casillas de 32" AGENTS.md README.md docs` sin restos que no sean históricos, `npm run format:check` y las comprobaciones de entrega

## 3. Arte del laberinto a 16 de ancho

- [x] 3.1 Redibujar en SVG `platform.left/mid/right` y `crossing` (16×12), `ladder` (16×16, con peldaños para ese ancho) y `plate.left/mid/right` (16×10), y cambiar sus tamaños en `src/view/art/graphics.ts`; verificar con las pruebas del arte (`graphics.test.ts`, `art.test.ts`, `svgProblems.test.ts`), `npm run smoke` y la hoja de arte en `/tools/art-sheet.html` (tramos sin costuras, remates y cruces encajados, escalera de una casilla)
- [x] 3.2 Actualizar `docs/STYLE_GUIDE.md` (rejilla de 16, tabla de tamaños de las piezas y fondo de 624×480); verificar con `npm run format:check`

## 4. Ingredientes renderizados a 16 de ancho

- [x] 4.1 Poner `TILE = 16` en `tools/blender/common.py`, ajustar en `tools/blender/ingredients.py` lo que dependa de la casilla de 32 (patrones, semillas y encuadre) y renderizar los cuatro ingredientes con `blender -b --factory-startup --python tools/blender/ingredients.py --`; cambiar sus tamaños en el catálogo a 16×(12–18); verificar con las pruebas del arte, las vistas previas de `tmp/blender/` y la hoja de arte (ingrediente continuo sin costuras y hamburguesa apilada como antes)
- [x] 4.2 Si el render cambia los grosores de `tmp/blender/metrics.json`, actualizar `INGREDIENT_THICKNESS`, sus pruebas y el requisito "Grosor de los ingredientes" del delta de `gameplay-rules`; documentar el ancho de 16 en `docs/STYLE_GUIDE.md` (tabla de ingredientes) y en `docs/MANUAL.md` (§8.7); verificar con `npm run test`, `openspec validate is45-board-proportions --strict` y las comprobaciones de entrega

## 5. Personajes de 2×2 casillas

- [ ] 5.1 Añadir `scale` (por defecto 1) a `RigDefinition` y aplicarla en `CharacterRig` con el origen en los pies; verificar con una prueba de que una escala de 0,5 deja los pies en su sitio y lleva lo alto del gorro a la mitad de su distancia a los pies
- [ ] 5.2 Medir la altura visible de la postura base de cada rig (píxeles opacos de cada parte colocada como en el rig) y fijar en `src/view/rigs/rigs.ts` la escala del chef para que mida 32 y la de cada enemigo para que quede entre 30 y 33; añadir una prueba en `rigs.test.ts` que lo compruebe (chef 32 ± 1, enemigos ≤ 34, pies en el suelo); verificar con `npm run test` y en `npm run dev` (el gorro del chef al pie de una escalera de dos filas llega al suelo del piso de arriba)
- [ ] 5.3 Documentar la escala de los rigs y la altura de los personajes en `docs/STYLE_GUIDE.md` (las "unas 38 unidades" pasan a 32 tras la escala), `docs/MANUAL.md` (§8.7 y receta §9.10) y `docs/GAMEDEV_FUNDAMENTALS.md` (la altura del personaje como unidad del tablero); verificar con `npm run format:check`, `grep` de los nombres citados y las comprobaciones de entrega

## 6. Caída a escala ×2

- [ ] 6.1 En `src/sim/rules.ts`, `FALL_SPEED = fromPx(113)` y `BOUNCE_HEIGHT = fromPx(13)`, y en `src/objects/IngredientView.ts` un `TOUCH_DOWN` de 8 unidades; actualizar `Ingredient.test.ts` (64 unidades de caída libre en 34 ticks bajando lo mismo cada tick; rebote de 13 unidades en 5 ticks) y cualquier prueba que cite las distancias antiguas; verificar con `npm run test` y `grep -rn "fromPx(170)\|fromPx(20)" src` sin restos
- [ ] 6.2 Documentar la escala ×2 (un píxel del original son 2 unidades; un piso de dos cocineros en 0,57 s) en `docs/MANUAL.md` (§8.5) y en `docs/GAMEDEV_FUNDAMENTALS.md` si menciona la ×3; verificar con `grep -rn "×3\|170" docs README.md` sin restos y `npm run format:check`

## 7. Primera pantalla como la del original

- [ ] 7.1 Añadir la regla `ladder-odd-span` (aviso por tramo de escalera con un número impar de filas, en la fila y columna de su extremo superior) a `src/sim/level/validation/rules.ts`; verificar con pruebas de `validateLevel` (tramo de dos filas sin incidencias, tramo de tres con el aviso, y el nivel se carga igualmente)
- [ ] 7.2 Sustituir `src/levels/classic.level.json` por la cuadrícula de 39×30 de design.md (decisión 3) y reescribir `classic.level.test.ts`: 39×30 con unidades de 4; filas de plataforma 5, 9, 11, 13, 15, 17, 19 y 23 con separaciones 4, 2, 2, 2, 2, 2, 4; plataformas entre las columnas 4 y 34; escaleras en las columnas 5, 8, 12, 15, 19, 22, 26, 29 y 33, con una a cada lado de cada hamburguesa y una debajo; ingredientes por calle y fila; platos en la fila 28; cada ingrediente sobre su plato; chef en (23, 19,5) y enemigos en la fila 5 en x = 5,5, 19,5 y 33,5; verificar con `npm run test`
- [ ] 7.3 Actualizar `NavigationGraph.test.ts` (10 tramos de plataforma y 29 de escalera, sin colgantes) y las demás pruebas que usan el nivel clásico (`Simulation.test.ts`, validación sin incidencias, carga, determinismo); verificar con `npm run test` y `npm run lint`
- [ ] 7.4 Probar en `npm run dev` que todo el nivel es jugable: el chef llega a todos los pisos, cada hamburguesa se completa en su plato, un enemigo montado en el pan de la calle 3 baja tres pisos y el nivel termina; verificar con `npm run smoke` (captura de la partida en 16:9, 4:3 y 19,5:9)
- [ ] 7.5 Documentar la nueva primera pantalla en `README.md` (pisos a varias alturas, hamburguesas separadas por escaleras), `docs/MANUAL.md` (§8.5 y §8.6: nivel clásico, casillas de medio cocinero y aviso `ladder-odd-span`; receta §9.7) y `docs/GAMEDEV_FUNDAMENTALS.md` (medir las proporciones de un juego de referencia en una grabación: rejilla de caracteres y mapa por mayoría de fotogramas); verificar con `npm run format:check`, `grep` de los nombres citados y las comprobaciones de entrega

## 8. Integración

- [ ] 8.1 Ejecutar las comprobaciones de entrega completas (`npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`, `npm run smoke`) y `openspec validate is45-board-proportions --strict`; verificar que todo termina sin errores y revisar la hoja de arte en `/tools/art-sheet.html`
- [ ] 8.2 Jugar en `npm run dev` y en `npm run dev:desktop` comparando con la grabación del original: misma estructura de pisos y escaleras, chef de dos casillas de alto, hamburguesas de dos cocineros de ancho, escaleras de 1 a 9 cocineros, caída de un piso de dos cocineros en ≈ 0,57 s y personajes legibles en un móvil apaisado (lo verifica el autor)

## Workflow follow-up

- El autor hace el push; PR hacia `develop/v1.0.0` con `Closes #45`.
- Archivar el cambio tras la confirmación del autor, sincronizar las specs y actualizar a mano el `Purpose` de `openspec/specs/screen-layout/spec.md` (cita el tablero de 20×15).
- Revisar los Non-Goals del diseño: las velocidades ya están en #43 y la inclinación del pisado en #42; valorar issues de seguimiento para la entrada de los enemigos como en el original y para recalibrar las distancias de pimienta y contacto al tamaño nuevo de los personajes.
