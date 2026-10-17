# Design

## Context

Estado en `develop/v1.0.0` (motivación en `proposal.md`):

- Todo el arte son SVG en `src/view/art/<tema>/`, coloreados con la paleta del
  tema (`applyPalette`) y rasterizados al arrancar por `SvgRasterizer` a
  `RENDER_TIER = 2`, con claves de textura `<tema>/<gráfico>`. `ArtFactory`
  crea imágenes por tema. `ThemeRegistry`, `chooseTheme` y las paletas de
  `src/view/themes/` resuelven el tema; `GameScene` lo elige al empezar cada
  nivel (URL, opción del jugador, campo `theme` del nivel) y activa el *bloom*
  de `midnight`. El menú de opciones, los ajustes, los catálogos i18n, la hoja
  de arte (`tools/art-sheet.html`) y el escenario `review` del test de humo
  conocen los temas.
- El catálogo `GRAPHICS` (`src/view/theme/graphics.ts`) fija el tamaño lógico
  de cada gráfico; la prueba de arte exige un SVG por gráfico en `classic`.
- Los personajes son rigs de partes animadas con tweens (`CharacterRig`,
  `RigMotion`, estados State); el apilado en el plato usa un paso fijo de 11.

El prototipo validado en la rama `explore/blender-bun` (sin commits) ya
contiene casi todo lo nuevo: scripts `tools/blender/{common,ingredients,
characters}.py`, los PNG en `src/view/art/classic/`, la carga de PNG en el
rasterizador, `INGREDIENT_STACK_HEIGHTS` y `stackLifts`, los fotogramas de
rig (`frames`, `RigMotion.cycle`), los estados por tipo de enemigo, la coleta y
`RENDER_TIER = 4`. Para que el prototipo compilase se reescalaron o crearon
SVG de relleno para los gráficos nuevos; esos rellenos sobran.

## Goals / Non-Goals

**Goals:**
- Convertir el prototipo en código definitivo sin perder lo validado: el
  aspecto de los ingredientes, de los personajes y de los bailes no cambia.
- Un solo aspecto: ninguna referencia a temas en código, datos, textos, pruebas
  ni documentación (salvo el historial de OpenSpec).
- Cada gráfico con una única fuente, comprobado por pruebas.

**Non-Goals:**
- Renderizar con Blender el resto del escenario (plataformas, escaleras,
  platos, fondo, efectos, HUD): siguen siendo SVG con la paleta única.
- Elegir la escala de dibujo según la pantalla o comprobar la resolución
  mínima.
- Integrar Blender en el build o en la CI.
- Animación esquelética o sprites de cuerpo entero; los rigs siguen siendo por
  partes.

## Decisions

### 1. Arte renderizado como PNG versionado, generado por scripts de Blender

Los scripts viven en `tools/blender/` y se ejecutan a mano con Blender 5.2 LTS
en modo de fondo (`blender -b --factory-startup --python …`), con Cycles en GPU
si la hay. Escriben los PNG a 4× en la carpeta del arte y vistas previas en
`tmp/` (ignorada por git). El juego solo ve los PNG.

- *Alternativa*: generar el arte en el build o en la CI. Descartada: Blender
  pesa cientos de MB, el render tarda minutos y los resultados varían con el
  ruido de muestreo; versionar los PNG (unos 15–30 KB cada uno) es más simple y
  reproducible para el jugador.
- *Alternativa*: pintar a mano o usar generación por IA. Descartada por
  coherencia y reproducibilidad: el script fija luz, cámara y materiales para
  todo el reparto.
- Los scripts son Python porque es el lenguaje de Blender; se tratan como
  herramientas de autor (como los SVG), no como parte del código del juego, y
  no pasan por Oxlint ni Prettier. Se documentan en `docs/MANUAL.md`.

### 2. Claves de detalle del render (ya validadas en el prototipo)

- Una unidad de Blender es una unidad lógica; cámara ortográfica.
- Ingredientes: cámara inclinada 5° hacia abajo, solo luces de sol (no cambian
  a lo largo de x) y texturas periódicas por casilla (ruido 4D sobre x plegada
  en círculo), semillas y desplazamientos que se repiten cada 32 unidades. Se
  renderizan los cuatro tramos de una vez a 8× y se reducen a 4× en luz lineal
  con alfa premultiplicado; las juntas `left|mid`, `mid|mid` y `mid|right` se
  funden unos píxeles con la columna que de verdad sigue en el render, de modo
  que encajan exactamente.
- Personajes: cámara frontal sin inclinación; cada parte se modela en
  coordenadas del rig (x igual, z = −y) y se renderiza sola con el encuadre de
  su rectángulo de rig, de modo que el punto de giro coincide.
- El grosor visible de cada ingrediente para el apilado sale de las medidas del
  render (`tmp/blender/metrics.json`) y se fija como constante en la vista.

### 3. Un solo aspecto: paleta única y catálogo en `src/view/art/`

Se eliminan `src/view/theme/` y `src/view/themes/`. Pasan a `src/view/art/`:
el catálogo (`graphics.ts`, con `INGREDIENT_HEIGHTS` e
`INGREDIENT_STACK_HEIGHTS`), la paleta (`palette.ts`, con los tokens y los
colores de `classic` como única paleta `PALETTE`), `applyPalette` y
`svgProblems`. Las fuentes pasan a `src/view/art/sources/<gráfico>.svg|png`.
`sources.ts` expone una función que da, por gráfico, su fuente SVG (texto) o la
URL de su PNG.

- *Alternativa*: mantener el registro con un único tema. Descartada: deja
  indirecciones (resolver, heredar, elegir) sin uso y el autor quiere quitar el
  concepto.
- `HudPanels`, `OverlayView`, `ControlsPage` y las escenas reciben la paleta
  importándola directamente (es un valor constante), sin inyección.

### 4. Rasterizador sin tema

`SvgRasterizer` pasa a `ArtRasterizer` (misma responsabilidad: convertir cada
gráfico del catálogo en una textura a la escala de dibujo) y deja de recibir un
tema: para un PNG lo decodifica y lo dibuja reducido con suavizado alto; para
un SVG aplica la paleta y lo rasteriza como hasta ahora. La clave de textura es
el id del gráfico. `ArtFactory` deja de recibir `themeId`. `BootScene`
rasteriza una sola vez.

### 5. Comprobación del arte

La prueba de arte pasa a exigir que cada id del catálogo tenga exactamente una
fuente (SVG o PNG), que no haya ficheros sin id en el catálogo, que cada SVG
cumpla la guía de estilo y que cada PNG mida su tamaño lógico × 4 (se lee la
cabecera IHDR del PNG en la prueba, sin dependencias nuevas).

### 6. Fotogramas en los rigs y bailes por tipo de enemigo

Se mantiene lo del prototipo: `RigPart.frames` (gráficos del mismo tamaño),
`CharacterRig.showFrame` y `RigMotion.cycle`, que recorre los fotogramas de ida
y vuelta con la misma curva que el balanceo de las piernas. `enemyStates` es un
registro por tipo de enemigo; cada tipo extiende el andar común con su baile, y
los ojos se desplazan con la doblez en sincronía. Los ids de fotograma siguen el
patrón `<enemigo>.<baile>Back2|Back1|Front1|Front2`, con `<enemigo>.body` como
centro. Los pies (`<enemigo>.feet`) se sustituyen por `<enemigo>.leg`.

### 7. Apilado según el grosor

Se mantiene `stackLifts` (función pura en `src/objects/stacking.ts`, con
pruebas): la elevación de cada ingrediente sobre su plato es la suma de
`INGREDIENT_STACK_HEIGHTS` de los que tiene debajo en el mismo plato (misma
`col` y `fallToRow`, `stackSlot` menor). `GameScene` la calcula una vez por
fotograma y fija la profundidad de dibujo por `stackSlot`.

### 8. Nivel y ajustes: ignorar los campos antiguos

`theme` se retira de `LevelDocument`, de la lectura (un campo `theme` presente
se ignora, como cualquier clave desconocida) y de la escritura; se quita del
nivel clásico y desaparece `THEME_ID_PATTERN`. En los ajustes se quita `theme`
sin cambiar `SETTINGS_VERSION`: un registro antiguo con `theme` se lee igual y
el campo se pierde al guardar.

- *Alternativa*: rechazar el campo en los niveles. Descartada: no aporta nada y
  rompería ficheros existentes.

## Risks / Trade-offs

- [Escala 4 en móviles: el lienzo interno ronda 3400×1920 y las texturas
  ocupan cuatro veces más memoria que a escala 2] → La comprobación en un móvil
  real queda como tarea del autor; si va mal, la costura para elegir la escala
  según la pantalla sigue existiendo (Non-Goal de este cambio, issue de
  seguimiento).
- [Choque de estilos entre el escenario vectorial y los personajes e
  ingredientes renderizados] → Aceptado por el autor en esta fase; el escenario
  es candidato a un cambio posterior.
- [Los PNG regenerados cambian por el ruido aunque el modelo no cambie, lo que
  ensucia los diffs] → Regenerar solo lo que se toca (`--only`) y versionar el
  resultado revisado.
- [Python fuera de las comprobaciones del proyecto] → Los scripts son de autor
  y su resultado se valida con la prueba de arte (tamaños) y la revisión
  visual.
- [Depender de una versión concreta de Blender] → Documentar la versión usada
  (5.2 LTS); los scripts solo usan la API de Python y nodos básicos.

## Migration Plan

Se implementa sobre la rama del cambio partiendo del prototipo: primero se
asienta el arte y su comprobación, luego se retiran los temas, después se
borran los restos y por último se actualiza la documentación. Los ajustes y
niveles antiguos se siguen leyendo, así que no hay migración de datos. Volver
atrás es revertir el merge.
