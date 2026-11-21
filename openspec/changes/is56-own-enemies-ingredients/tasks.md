# Tasks

## 1. Issue, rama y carpeta del cambio

- [x] 1.1 Actualizar la issue #56 (en inglés).
  - Título: "Own enemies (chorizo, corn) and new ingredients (cheese, tomato)".
  - Descripción: el chorizo y la mazorca sustituyen a la salchicha y al huevo, que salen del juego; el queso y el tomate en las pantallas 2 a 4 sin cambiar el número de ingredientes; fuera de alcance, las hamburguesas más altas y más de cuatro hamburguesas por pantalla; enlace a `openspec/changes/is56-own-enemies-ingredients/`.
  - Hito `v1.0.0`.
  - Crear desde ella la rama `change/is56-own-enemies-ingredients` a partir de `develop/v1.0.0` actualizada (`gh issue develop 56 --base develop/v1.0.0 --name change/is56-own-enemies-ingredients --checkout`), llevando la carpeta del cambio.
  - Verificar con `git branch --show-current`, `gh issue view 56` y `openspec list`.

## 2. Queso y tomate

- [x] 2.1 Pasar de `tmp/is56-drafts/ingredients.py` a `tools/blender/ingredients.py`:
  - `build_cheese` (loncha de 2 con lágrimas periódicas por casilla y esquinas caídas, sin el suelo de sombra) y `build_tomato` (cuatro rodajas torneadas con `slab_profile`, inclinadas 8°), con sus materiales.
  - Entradas en `INGREDIENTS` con alturas de imagen 11 y 9.
  - Renderizar con `blender -b --factory-startup --python tools/blender/ingredients.py -- --only cheese --only tomato`.
  - Verificar: `tmp/blender/cheese.game.png` y `tomato.game.png` sin costuras entre tramos, `metrics.json` con los dos tipos y ningún aviso de encuadre.
- [x] 2.2 Añadir `cheese` y `tomato` a `IngredientKind`, las piezas `Q` y `O` al registro y `INGREDIENT_THICKNESS` (queso `rowsOf(2)`, tomate `rowsOf(6)`).
  - Verificar con pruebas de piezas (`Q` y `O` cargan un queso y un tomate de cuatro segmentos), de reglas (grosores en unidades) y de plato (pan de abajo, carne y tomate dejan el siguiente a 29 unidades; un ingrediente que cae golpea a un queso a 2 unidades del piso) y con `npm run test`.
- [x] 2.3 Vista:
  - Gráficos `cheese.*` y `tomato.*` en el catálogo, con `INGREDIENT_HEIGHTS` 11 y 9.
  - `INGREDIENT_HANGS` con el queso (unas 5 unidades), que `IngredientView` suma al colocar los segmentos.
  - Los dos tipos en la fila de ingredientes de `ArtSheetScene`.
  - Verificar con las pruebas de arte y de catálogo, una prueba de que solo el queso cuelga, y en la lámina de arte (`npm run dev`, `/tools/art-sheet.html`): la loncha a la altura de la base de los demás, las lágrimas por delante del borde del piso y un queso pisado que se sigue viendo. Ajustar el valor si hace falta.
- [x] 2.4 Documentar:
  - `docs/STYLE_GUIDE.md`: aspecto, tamaños y colores del queso y el tomate; el queso cuelga de su base.
  - `docs/MANUAL.md`: §8.6 símbolos `Q` y `O`; §8.7 `--only cheese` y el queso sin suelo de sombra; `INGREDIENT_HANGS`.
  - Verificar con `npm run format:check` y las comprobaciones de entrega.

## 3. Chorizo y mazorca en lugar de la salchicha y el huevo

- [ ] 3.1 Pasar de `tmp/is56-drafts/enemies.py` a `tools/blender/characters.py`:
  - `add_mouth` e `in_mouth`; el chorizo fresco (`build_chorizo` con `bend`, `build_chorizo_knot`, `chorizo_eyes`, cordel rojo); la mazorca (`build_cob` con la boca entre los granos, `build_husk_front`, `build_husk_back`, `build_silk`, `cob_eyes`).
  - `ENEMIES` con partes extra; `render_enemy` renderiza los fotogramas solo para el cuerpo.
  - Quitar la salchicha y el huevo (constructores, materiales y entradas).
  - Renderizar con `--only chorizo --only corn` y borrar los PNG `hotdog.*` y `egg.*`.
  - Verificar en `tmp/blender/characters/`: las cinco dobleces del chorizo con la boca doblada, la mazorca con la boca entre los granos, cada parte dentro de su recuadro y PNG a 4 veces su tamaño.
- [ ] 3.2 Simulación y pantallas:
  - `EnemyKind` pasa a `'chorizo' | 'onion' | 'corn'`; `createEnemy` con `ChaseBrain`; piezas `z` y `m` en lugar de `h` y `e`.
  - En los cuatro documentos de `src/levels/`, `h` → `z` y `e` → `m` sin tocar las entradas.
  - Actualizar las pruebas que usan `h`, `e`, `hotdog` o `egg` (rejillas de prueba, simulación, enemigos y una prueba por pantalla con los enemigos de cada una).
  - Verificar con las pruebas de piezas (`z` y `m` cargan; `h` y `e` fallan con símbolo, capa, fila y columna), las de cada pantalla y `npm run test`.
- [ ] 3.3 Vista:
  - Catálogo sin `hotdog.*` ni `egg.*`, con `chorizo.*` (cuerpo, cuatro dobleces, punta, ojos, pierna) y `corn.*` (cuerpo, hojas de delante y de detrás, pelo, ojos, pierna).
  - Rigs del chorizo (escala 0,85) y la mazorca (escala 0,9) según el diseño.
  - Estados: el chorizo hace el `cycle` del cuerpo, los ojos ±3 y la punta ±14° con retraso; la mazorca hace el hula con `swing` y retrasos en hojas y pelo. Fuera los estados de la salchicha y el huevo.
  - Verificar con `rigs.test.ts` (cinco fotogramas del chorizo, seis de la cebolla, ninguno de la mazorca; partes de cada uno), `rigHeights.test.ts`, las pruebas de arte, `npm run smoke` y la lámina de arte: los dos bailan como en `tmp/is56-drafts/*.walk.gif`, sin huecos entre la mazorca y sus hojas o su pelo ni en el atado del chorizo, y trepan y quedan aturdidos con los estados comunes.
- [ ] 3.4 Documentar:
  - `README.md`: "Enemies", con el chorizo y la mazorca y los enemigos de cada pantalla, sin salchicha ni huevo.
  - `docs/STYLE_GUIDE.md`: §2.x aspecto, colores, boca y baile de cada uno.
  - `docs/MANUAL.md`: §8.5 tipos de enemigo; §8.6 símbolos `z` y `m`; §8.7 `--only chorizo|corn`; §9.9 el hula con `swing` y retrasos y la doblez con `cycle`.
  - `docs/GAMEDEV_FUNDAMENTALS.md`: diseñar el arte a partir de fotos de referencia y validarlo con bocetos montados como el juego antes de abrir el cambio; cuándo un baile pide fotogramas y cuándo basta con mover partes.
  - Verificar con `grep -ri "hotdog\|hot dog\|salchicha\|huevo\|egg"` sin restos fuera de los cambios archivados, `npm run format:check` y las comprobaciones de entrega.

## 4. Ingredientes nuevos en las pantallas

- [ ] 4.1 Cambiar en los documentos las lechugas que indica el diseño (decisión 8):
  - Pirámide: queso en las dos centrales.
  - Mostrador: tomate en las dos centrales y queso en la de la derecha.
  - Torres: queso entre las dos carnes de todas y tomate arriba en la segunda y la cuarta.
  - Verificar con las pruebas de cada pantalla (composición de cada hamburguesa de arriba abajo según la spec, sin incidencias de validación, se completa soltando sus ingredientes) y `npm run test`.
- [ ] 4.2 Documentar los ingredientes de cada pantalla en `README.md` ("Goal" o "Screens") y `docs/MANUAL.md` (§8.6); verificar con `npm run format:check` y las comprobaciones de entrega.

## 5. Integración

- [ ] 5.1 Ejecutar las comprobaciones de entrega completas (`npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`), `npm run smoke` (también `touch` y `portrait`) y `openspec validate is56-own-enemies-ingredients --strict`; verificar que todo termina sin errores y revisar las capturas de cada pantalla con `?screen=N`.
- [ ] 5.2 Jugar en `npm run dev` y en `npm run dev:desktop` las cuatro pantallas:
  - el chorizo y la mazorca bailando, trepando, aturdidos y montados;
  - el queso y el tomate en los pisos, pisados, cayendo y en el plato;
  - las lágrimas del queso sobre la carne y sobre el borde del piso.
  - Lo verifica el autor.

## Workflow follow-up

- El autor hace el push; PR hacia `develop/v1.0.0` con `Closes #56`.
- Archivar el cambio tras la confirmación del autor, sincronizar las specs y revisar los Non-Goals del diseño:
  - Crear una issue para más de cuatro hamburguesas por pantalla.
  - Las hamburguesas más altas quedan descartadas por decisión del autor.
  - El comportamiento por tipo (#17), las recetas por plato (#16) y las pantallas 5 y 6 (#55) ya tienen issue.
