# Tasks

## 1. Rama y preparación

- [x] 1.1 Crear la rama `change/is4-vector-visuals` desde la issue #4 (panel Development) a partir de `develop/v1.0.0` actualizada, hacer checkout local y verificar con `git branch --show-current` y `git log --oneline -1` que parte del último commit de `develop/v1.0.0` (los push los hace el autor)
- [x] 1.2 Añadir `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) y comprobar con un SVG temporal importado mediante `import.meta.glob(..., { query: '?raw', eager: true })` que `npm run typecheck`, `npm run test` y `npm run build` lo aceptan y que el texto aparece en el bundle de `dist/`; borrar el SVG temporal después
- [x] 1.3 Prototipo desechable de D6 en `GameScene`: lienzo a 2× con `setGameSize`, cámara con `setZoom(2)` centrada en el tablero y un SVG rasterizado a 64 px dibujado con `setScale(0.5)` y un texto con `resolution: 2`; verificar en `npm run dev` y en `npm run build:desktop:dir` (bajo `file://`) que se ven nítidos a 1920×1080 y que la imagen ocupa una casilla; revertir el prototipo y anotar en `design.md` cualquier desviación de la API de Phaser 4

## 2. Tema en el documento de nivel

- [ ] 2.1 Añadir `theme?: string` a `LevelDocument`, validarlo en `parseLevelDocument` (formato `^[a-z][a-z0-9-]*$`, error con el campo y el formato esperado) y escribirlo en `serializeLevel` tras `"segments"` solo si existe; verificar con pruebas de nivel con tema, sin tema (texto exportado idéntico al actual), tema mal formado (`Mid Night`, número) e ida y vuelta
- [ ] 2.2 Declarar `"theme": "classic"` en `src/levels/classic.level.json` y ampliar la prueba de determinismo con el nivel clásico con y sin `theme`; verificar con `npm run test` en verde y con `grep` que nada en `src/sim/` fuera de `levelJson.ts` y `LevelDocument.ts` lee `theme`
- [ ] 2.3 Documentar el campo `theme` en el formato de nivel de `docs/MANUAL.md` (sección 8.6); verificar con `npm run format:check` y que el ejemplo coincide con el nivel clásico

## 3. Temas y catálogo de gráficos (puro)

- [ ] 3.1 Implementar `Palette` y los tokens de la guía (`src/view/theme/palette.ts`) y `applyPalette(svg, palette)`; verificar con pruebas de inserción del `<style>` tras la etiqueta `<svg>`, SVG con prólogo XML, tokens de relleno y de trazo y escape de valores
- [ ] 3.2 Implementar el catálogo `GraphicId` con tamaños lógicos (`graphics.ts`) y las funciones de composición de segmentos (`left`/`mid`/`right` para 2, 3 y 4 segmentos, también para platos y tramos de plataforma); verificar con pruebas de las tres anchuras y de remates en tramos de una casilla
- [ ] 3.3 Implementar `Theme`, `ThemeRegistry` y `resolve` con herencia de `classic`, y `chooseTheme({ urlTheme, levelTheme }, registry)` con la prioridad URL → nivel → `classic` y avisos con id y origen; verificar con pruebas de tema solo-paleta, sustitución de un gráfico, token ausente, registro con id repetido rechazado y las combinaciones de la prioridad con ids conocidos y desconocidos
- [ ] 3.4 Escribir `docs/STYLE_GUIDE.md` (en español por ahora): tokens y su uso, trazo, radios, sombras horneadas, tipografía del HUD, rejilla y convención de autoría y exportación desde Inkscape (D3, D11); verificar con `npm run format:check` y relectura del autor

## 4. Arte SVG del tema por defecto

- [ ] 4.1 Prueba de arte (`src/view/art/art.test.ts`) sobre todos los SVG de todos los temas: `viewBox` coherente con el catálogo, sin colores literales, clases `f-`/`s-` con tokens existentes, `classic` completo y temas que solo sustituyen ids del catálogo; verificar que falla con un SVG de prueba con un color literal y con un id desconocido, y que pasa al quitarlo
- [ ] 4.2 Dibujar en `src/view/art/classic/` las piezas (`platform.*`, `ladder`, `crossing`, `plate.*`, `board.backdrop`) y los segmentos de los cuatro ingredientes (`left`/`mid`/`right`); verificar con la prueba de arte en verde y una lámina de revisión (página o captura con todos los gráficos) para el autor
- [ ] 4.3 Dibujar las partes del chef y de los tres enemigos, `fx.*` y `hud.*`; verificar con la prueba de arte en verde y la lámina de revisión actualizada

## 5. Pipeline de rasterizado y disposición

- [ ] 5.1 Implementar `computeLayout` (D7); verificar con pruebas de 16:9 (853 de ancho), 19,5:9, 4:3 (832, con bandas), 21:9, 32:9 (1152, con bandas) y ventanas diminutas
- [ ] 5.2 Añadir `RenderTier` y `RENDER_TIER = 2` a `src/config.ts`, implementar `SvgRasterizer` (claves `<tema>/<graphicId>`, textura de marcador ante fallo) y `ArtFactory` (tema del tablero y escala `1 / tier`); verificar con `npm run typecheck` y, en `npm run dev`, que un SVG mal formado forzado a mano arranca con el marcador y el mensaje de consola con tema e id
- [ ] 5.3 Crear `BootScene` con dependencias por constructor (registro de temas y nivel de escala) que rasteriza el catálogo de todos los temas y arranca `TapScene`; cambiar `src/main.ts` a instancias de escena, lectura de `?theme=` inyectada en `GameScene`, `chooseTheme` al empezar cada tablero y `setGameSize` desde `computeLayout` en el arranque y en `resize` (agrupado con `requestAnimationFrame`); adaptar `TapScene` a la cámara con zoom; verificar en `npm run dev` que se llega a la partida, que `?theme=desconocido` avisa y usa el tema del nivel y que un nivel con `theme` desconocido avisa con su origen y se juega con `classic`
- [ ] 5.4 Documentar en `docs/MANUAL.md` el pipeline (fuentes en `src/view/art`, catálogo, paleta, rasterizado, nivel de escala, cámara y layout), sustituir la descripción de `Scale.FIT` 640×480 y añadir en `AGENTS.md` la excepción de los SVG en `src/view/art` y la excepción temporal de `docs/STYLE_GUIDE.md` en español; verificar con `npm run format:check` y que los nombres citados existen en el código

## 6. Tablero, ingredientes y HUD

- [ ] 6.1 Implementar `MazeView` (tramos de plataforma con remates, escaleras por fila, cruces, platos y fondo del tablero) y quitar `#drawMaze` de `GameScene`; verificar con `npm run dev` que el nivel clásico ocupa las mismas casillas que antes (captura comparada con la de `develop/v1.0.0`)
- [ ] 6.2 Reescribir `IngredientView` con los gráficos de segmento, pisado más bajo, caída interpolada como hasta ahora y *squash & stretch* al recibir `ingredientLanded`; verificar con `npm run typecheck` y, en `npm run dev`, con ingredientes de 4 segmentos y un nivel de prueba de 3 y de 2 segmentos
- [ ] 6.3 Implementar `HudPanels` (puntos y nivel a la izquierda; vidas y pimientas con iconos y botón de salir a la derecha; recolocación en `resize`) y `OverlayView` (fin de nivel y fin de partida sobre el tablero); verificar en `npm run dev` a 16:9, 4:3 y 21:9 (ventana redimensionada) que nada tapa el tablero, que seis cifras caben en un panel de 96 y que salir y Enter funcionan
- [ ] 6.4 Retirar `COLORS`, `INGREDIENT_COLORS`, `INGREDIENT_HEIGHTS` y `LANE_STACK_HEIGHT` de `src/config.ts` (si su valor pasa al catálogo) y los PNG sin uso de `public/assets/`; verificar con `grep` que no quedan referencias y con `npm run lint && npm run typecheck && npm run build`

## 7. Personajes y efectos

- [ ] 7.1 Implementar `chefAnimation` y `enemyAnimation` (puras); verificar con pruebas de quieto, andando, escalera parado, trepando, golpeado, aturdido e inactivo
- [ ] 7.2 Implementar `RigDefinition`, `CharacterRig`, `RigAnimator` y los estados de animación (D8), con `chefRig` y los rigs de enemigos; verificar con `npm run typecheck` y una prueba de que cada rig solo referencia gráficos del catálogo
- [ ] 7.3 Reescribir `ChefView` y `EnemyView` sobre `CharacterRig` y `RigAnimator` (volteo en el contenedor, `Hit` entre `chefHit` y `boardStarted`, tambaleo de aturdido con tween); verificar en `npm run dev` cada estado de la lista de 7.1 y que reiniciar durante `Hit` deja al chef en postura base
- [ ] 7.4 Implementar `EventEffects` (nube de pimienta, pisado de segmento, aplastamiento de enemigo, hamburguesa completa) con limpieza en `boardStarted`; dejar `GameScene` como raíz de composición fina; verificar en `npm run dev` cada efecto y con la prueba de determinismo existente (`npm run test`) en verde sin cambios en `src/sim/`
- [ ] 7.5 Documentar en `docs/MANUAL.md` las recetas "Añadir un gráfico SVG", "Crear un tema" y "Añadir o animar una parte de un personaje"; verificar siguiendo cada receta sobre la rama (y deshaciendo después) y con `npm run format:check`

## 8. Tema alternativo y post-procesado

- [ ] 8.1 Crear el tema `midnight` (paleta propia y al menos `platform.*` sustituido) y registrarlo; verificar con la prueba de arte y de temas en verde, en `npm run dev` con `?theme=midnight` que el nivel clásico se juega igual con el otro aspecto, y con una copia temporal del nivel clásico con `"theme": "midnight"` que el nivel elige su tema sin URL
- [ ] 8.2 Evaluar los filtros de Phaser 4 (`Glow`, `Shadow`, bloom aproximado) según D9 midiendo fotogramas a 1920×1080 en Chrome, Electron y un móvil Android; anotar en `design.md` la sección "Resultado de la evaluación de post-procesado" con los datos y la decisión del autor, y aplicar o retirar el código de prueba según esa decisión
- [ ] 8.3 Actualizar `README.md` (aspecto vectorial, paneles, temas, el campo `theme` de los niveles y cómo forzar uno con `?theme=` en la versión web); verificar con `npm run format:check` y relectura

## 9. Verificación final

- [ ] 9.1 Ejecutar `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` y verificar que todo termina con código 0
- [ ] 9.2 Prueba de humo en Electron sobre `dist/` con `npm run build:desktop:dir`: capturas con ambos temas a 16:9, 4:3 y 19,5:9 y consola sin errores; dejar las capturas para el autor
- [ ] 9.3 Revisión visual del autor en navegador, Electron y un móvil en horizontal: nitidez, límites de anchura (paneles sin bandas en 16:9 y 19,5:9, bandas en 4:3 y 32:9), animaciones de chef y enemigos, efectos, cambio de tamaño de ventana durante la partida y misma jugabilidad que en `develop/v1.0.0`
