# Tasks

## 1. Issue, rama y punto de partida

- [x] 1.1 Crear la issue en GitHub (título y descripción en inglés, enlazando `openspec/changes/`), asignarla al hito `v1.0.0`, crear desde ella la rama `change/is<n>-rendered-art` a partir de `develop/v1.0.0` actualizada y renombrar la carpeta del cambio a `is<n>-rendered-art`; verificar con `gh issue view <n>` (hito y enlace), `git branch --show-current` y `openspec list`
- [x] 1.2 Traer a la rama el trabajo sin commits del prototipo (`explore/blender-bun`): scripts de `tools/blender/`, PNG, cambios de código y pruebas; verificar con `git status` que no falta nada del prototipo y que `npm run test` pasa

## 2. Retirar los temas

- [x] 2.1 Eliminar `src/view/themes/` y de `src/view/theme/` el registro, `Theme` y `chooseTheme` (lo que queda de la carpeta se mueve en 3.1), el tema `midnight`, `src/view/fx/bloom.ts` y el parámetro de URL `theme` de `main.ts`; las escenas, `HudPanels`, `OverlayView` y `ControlsPage` usan la paleta única; verificar con `npm run typecheck` y `npm run lint`
- [x] 2.2 Quitar la opción Tema del menú de opciones y sus textos en `es.ts` y `en.ts`; verificar con las pruebas de los catálogos i18n y en `npm run dev` (las opciones no muestran Tema y el resto funciona)
- [x] 2.3 Quitar `theme` de los ajustes del jugador sin cambiar `SETTINGS_VERSION` (un registro antiguo con `theme` se lee y el campo se ignora); verificar con pruebas de lectura de un registro antiguo con tema y de que guardar no escribe `theme`
- [x] 2.4 Quitar `theme` del documento de nivel, de su lectura (se ignora si viene), de su escritura y del nivel clásico, y borrar `THEME_ID_PATTERN`; verificar con pruebas de lectura de un documento con `theme` (se acepta y no se conserva), de ida y vuelta del nivel clásico y la prueba de determinismo
- [x] 2.5 Quitar el selector de tema de la hoja de arte (`tools/art-sheet.html`, `src/devtools/`), los temas de los escenarios del test de humo (`review` por proporciones, `options` sin paso de tema) y de `electron/appPath.test.ts`; verificar con `npm run test` y `npm run smoke` en verde
- [x] 2.6 Comprobar que no queda nada del concepto: `grep -rni "theme\|midnight\|bloom" src electron tools scripts index.html` sin resultados (salvo usos ajenos al concepto, revisados uno a uno: las pruebas de que los ficheros antiguos con `theme` se siguen leyendo y las importaciones de la carpeta `src/view/theme/`, que desaparece en 3.1)

## 3. Catálogo y fuentes del arte sin temas

- [x] 3.1 Mover a `src/view/art/` el catálogo (`graphics.ts`), la paleta (`palette.ts`, con los colores de `classic` como única `PALETTE`), `applyPalette` y `svgProblems`, y las fuentes de `src/view/art/classic/` a `src/view/art/sources/`; `sources.ts` da, por gráfico, su SVG o la URL de su PNG; verificar con `npm run typecheck` y las pruebas de la paleta y del catálogo
- [x] 3.2 Convertir `SvgRasterizer` en `ArtRasterizer` sin tema (PNG decodificado y reducido con suavizado alto, SVG con la paleta, clave de textura igual al id del gráfico) y quitar `themeId` de `ArtFactory`; `BootScene` rasteriza una vez; verificar con `npm run typecheck` y con `npm run dev` (arte completo, sin marcadores ni errores en la consola)
- [x] 3.3 Borrar los SVG de relleno de los gráficos que tienen PNG (ingredientes, partes del chef y de los enemigos, fotogramas de baile) y reescribir la prueba de arte: cada id del catálogo con exactamente una fuente, ningún fichero sin id, SVG según la guía y PNG de tamaño lógico × 4 (cabecera IHDR); verificar con `npm run test` y comprobando que la prueba falla si se duplica la fuente de un gráfico o se cambia el tamaño de un PNG
- [x] 3.4 Ajustar los scripts de `tools/blender/` a la nueva carpeta de fuentes y regenerar ingredientes y personajes; verificar con `git status` (solo cambian los PNG esperados) y con la prueba de arte

## 4. Personajes, bailes y apilado

- [x] 4.1 Revisar y dejar como definitivo lo del prototipo en los rigs: `RigPart.frames`, `CharacterRig.showFrame`, `RigMotion.cycle`, estados por tipo de enemigo con sus bailes, piernas de los enemigos (`<enemigo>.leg`) y coleta del chef; añadir pruebas de que `cycle` no hace nada sin fotogramas y de que todos los enemigos tienen piernas; verificar con `npm run test` y con `npm run dev` (bailes, coleta y brazos unidos al hombro)
- [x] 4.2 Dejar como definitivo el apilado por grosor (`INGREDIENT_STACK_HEIGHTS`, `stackLifts`, profundidad por `stackSlot` en `GameScene`) y `RENDER_TIER = 4`; verificar con las pruebas de `stackLifts` y completando una hamburguesa en `npm run dev` (capas apoyadas sin huecos)

## 5. Documentación

- [ ] 5.1 Reescribir `docs/STYLE_GUIDE.md` (en español): aspecto renderizado de ingredientes y personajes (vista, luz, materiales, tamaños y encuadre a 4×, tramo central sin costuras, fotogramas de baile) y reglas de los SVG que quedan con la paleta única; verificar releyendo que todo nombre citado existe
- [ ] 5.2 Actualizar `docs/MANUAL.md` (estructura de `src/view/art/`, rasterizador, sin temas, escala 4, flujo de trabajo con Blender 5.2: instalación, órdenes, `--only`, vistas previas en `tmp/blender/`, `metrics.json` y grosores de apilado), `docs/GAMEDEV_FUNDAMENTALS.md` (sprites prerenderizados en 3D, texturas periódicas y mosaico sin costuras, animación por fotogramas combinada con tweens; quitar temas y bloom), `README.md` (sin temas ni `?theme=`, arte nuevo) y `AGENTS.md` (ubicación del arte y herramienta de autor Blender); verificar con `npm run format:check` y `grep -rni "tema\|theme" README.md AGENTS.md docs` sin restos del concepto

## 6. Comprobación final

- [ ] 6.1 Ejecutar `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` y `npm run smoke`, y revisar `/tools/art-sheet.html`; verificar que todo pasa y que las capturas muestran el arte nuevo en 16:9, 4:3 y 19,5:9
- [ ] 6.2 Revisión visual del autor jugando (ingredientes, hamburguesa completa, personajes y bailes) y prueba en un móvil real con escala 4 (rendimiento y nitidez); la marca el autor
