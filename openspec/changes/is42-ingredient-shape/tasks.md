# Tasks

## 1. Issue, rama y carpeta del cambio

- [x] 1.1 Asignar la issue #42 al hito `v1.0.0` y enlazar en ella `openspec/changes/is42-ingredient-shape/` (incluyendo la forma del pan de arriba en su alcance); crear desde la issue la rama `change/is42-ingredient-shape` a partir de `develop/v1.0.0` actualizada (`gh issue develop 42 --base develop/v1.0.0 --name change/is42-ingredient-shape --checkout`), llevando la carpeta del cambio; verificar con `git branch --show-current`, `gh issue view 42` y `openspec list`

## 2. Profundidad de los segmentos en la simulación

- [x] 2.1 En `Ingredient`, cambiar `IdleState` para guardar la profundidad de cada segmento (`#sink`): pisar uno sin pisar sube uno los ya pisados y pone el nuevo a 1; derivar `stomped` de `sink > 0`; añadir `sink` a `IngredientSnapshot`, a cero en los demás estados y tras `resetSegments`; verificar con pruebas de `Ingredient.test.ts` (rampa 3·2·1·0 y 0·1·2·3, recorrido retomado 3·2·0·1, volver a pisar sin cambios, cero al caer, al rebotar, en el plato y tras reiniciar, ingredientes de dos y tres segmentos) y `npm run test`
- [x] 2.2 Añadir a `IngredientField.test.ts` el chef que cruza tres segmentos y deja la rampa, e incluir `sink` en el resumen de `Simulation.determinism.test.ts`; verificar con `npm run test`
- [x] 2.3 Documentar la profundidad de los segmentos en `docs/MANUAL.md` (§8.5, mecánica principal, punto 1, y el modelo de `Ingredient`) y en `README.md` ("Ingredients and falls": el ingrediente se inclina al pisarlo); verificar con `npm run format:check` y las comprobaciones de entrega

## 3. Rampa, caída plana y arco en la vista

- [x] 3.1 Escribir la función pura `segmentPoses(snapshot, arched)` en `src/objects/segmentPoses.ts` (`STOMP_STEP = 2` unidades por escalón de `sink`; `ARCH_DEPTH = 2` en los extremos si `arched` y el ingrediente tiene tres o más segmentos; cada segmento girado para que sus bordes coincidan con los de sus vecinos y media unidad más ancho por lado si está girado) con su prueba de Vitest (plano en reposo, pendiente continua, sentido del giro, solape, arco solo con tres o más segmentos); verificar con `npm run test`
- [x] 3.2 Usarla en `IngredientView.sync` (altura, giro y ancho de cada segmento, respetando la escala del nivel de render), con `arched` cuando `phase` es `bouncing` o no han pasado `TOUCH_DOWN_ARCH_MS = 230` ms desde `touchDown` (reloj de la escena), y retirar `STOMP_DEPTH`; verificar con las comprobaciones de entrega y `npm run smoke`, mirando un ingrediente a medio pisar en la hoja de arte (`/tools/art-sheet.html`, que muestra uno con la rampa 2·1·0·0)

## 4. Arte de los ingredientes: pan de arriba en cúpula, lechuga y carne

- [x] 4.1 En `tools/blender/ingredients.py`, añadir `crown_taper(x)` (1 en los tramos centrales; coseno elevado hasta `CROWN_TIP = 0,25` en las puntas) y aplicarla en `build_bun_top` a la altura sobre el pie de los vértices y a las semillas; verificar ejecutando `blender -b --factory-startup --python tools/blender/ingredients.py -- --only bunTop` y revisando `tmp/blender/bunTop.game.png` (sin costuras entre tramos, puntas bajas, semillas sobre la superficie) y que el soporte sigue en 13,5 en `tmp/blender/metrics.json`
- [x] 4.2 Subir la carne (disco de 13 unidades, marco de 17), la lechuga (hojas con la parte alta a 8,5 y 10,5, marco de 14) y el pan de abajo (talón de 12, marco de 16) en `build_patty`, `LETTUCE_LAYERS`, `build_bun_bottom` e `INGREDIENTS`, y aclarar la rampa de color de `patty_material` (`#DCA675` → `#85502F`, muy oscuro solo en marcas y grietas); verificar renderizando `--only patty --only lettuce --only bunBottom`, que el render encaja en su marco, revisando sus `tmp/blender/*.game.png`, y midiendo en los PNG una luminancia media de la carne entre 80 y 100
- [x] 4.3 Llevar los nuevos tamaños a `INGREDIENT_HEIGHTS` (lechuga 14, carne 17, pan de abajo 16) y los grosores medidos en `metrics.json` a `INGREDIENT_THICKNESS` (y a la delta de "Grosor de los ingredientes" si no son 12, 8 y 11); actualizar `rules.test.ts`, `IngredientField.test.ts` (con el plato de su cuadrícula una fila más abajo, para que quepa la hamburguesa) y las demás pruebas que fijen esos valores; versionar los PNG de los cuatro ingredientes; verificar con `npm run test` (nivel clásico incluido), las pruebas del arte (`graphics.test.ts`) y la hoja de arte en `/tools/art-sheet.html` con una hamburguesa apilada compuesta con los PNG
- [x] 4.4 Actualizar `docs/STYLE_GUIDE.md` (tabla de ingredientes: cúpula que se afina en los extremos, tamaños de la lechuga, la carne y el pan de abajo, color de la carne y grosores) y, si cambian, los grosores citados en `docs/MANUAL.md`; verificar con `npm run format:check` y las comprobaciones de entrega más `npm run smoke`

## 5. Integración

- [ ] 5.1 Ejecutar las comprobaciones de entrega completas (`npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`), `npm run smoke` y `openspec validate is42-ingredient-shape --strict`; verificar que todo termina sin errores
- [ ] 5.2 Jugar en `npm run dev` comparando con la grabación: rampa al cruzar en los dos sentidos, caída plana, arco al rebotar y al tocar un piso, pan de arriba con forma de hamburguesa también inclinado, lechuga, carne y pan de abajo más altos, con la carne bien visible sobre el fondo y distinta del pan de abajo en el plato (lo verifica el autor)

## Workflow follow-up

- El autor hace el push; PR hacia `develop/v1.0.0` con `Closes #42`.
- Archivar el cambio tras la confirmación del autor, sincronizar las specs y revisar los Non-Goals del diseño para crear las issues de seguimiento que falten.
