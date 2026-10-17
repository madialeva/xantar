# Proposal

Seguimiento: issue #37 (hito `v1.0.0`). Parte del prototipo validado en la
rama local `explore/blender-bun`.

## Why

El arte vectorial plano cumplió su papel, pero el autor quiere un aspecto mucho
más realista y atractivo. Un prototipo con Blender (render 3D procedural
convertido en imágenes) ha demostrado el salto: ingredientes con aspecto de
comida de verdad, personajes 3D con piernas y enemigos que bailan al andar, y
el autor lo ha dado por bueno. A la vez, el sistema de temas intercambiables
(`classic`/`midnight`) obliga a mantener dos aspectos de todo y no encaja con
imágenes renderizadas, que no se recolorean con una paleta; el autor prefiere
un único aspecto estándar y dedicar el esfuerzo a otras cosas. Hacerlo ahora
evita seguir construyendo sobre el arte y los temas que se van a retirar.

## What Changes

- **Arte renderizado con Blender** para los cuatro ingredientes, el chef y los
  tres enemigos: scripts Python versionados en `tools/blender/` que modelan
  cada gráfico de forma procedural, lo iluminan igual (solo luces
  direccionales) y lo renderizan con Cycles a 4× su tamaño lógico como PNG con
  transparencia. Blender es una herramienta de autor, no una dependencia del
  juego ni de npm: los PNG generados se versionan y el juego no necesita
  Blender para compilarse ni ejecutarse.
- **Ingredientes**: pan de arriba con sésamo, carne a la brasa con marcas de
  parrilla, lechuga en dos hojas con volumen y pan de abajo con miga. El tramo
  central se repite sin costuras (texturas, semillas y desplazamientos
  periódicos por casilla). Se ven desde 5° por encima.
- **Apilado en el plato según el grosor** de cada ingrediente: cada uno se
  apoya sobre el visible de los que tiene debajo en ese plato (sustituye al paso
  fijo), y en el plato cada pieza se dibuja sobre la anterior.
- **Personajes 3D por partes**: una chef rubia con coleta (pieza propia que se
  balancea), brazos unidos al cuerpo por el hombro; salchicha, huevo frito y
  pepinillo de la altura del chef, con piernas propias y cejas de enfadado.
- **Bailes al andar**: una parte del rig puede alternar entre fotogramas
  renderizados; la salchicha se dobla de cóncava a convexa, el pepinillo se
  contonea en S y la clara del huevo ondula mientras rebota. Los ojos siguen el
  baile.
- **Escala de dibujo 4** fija: se da por hecho una pantalla Full HD o mayor; no
  se comprueba la resolución y en pantallas menores el juego se ve reducido.
- **BREAKING — se elimina el concepto de tema**: desaparecen el tema
  `midnight` y su resplandor (*bloom*), el registro y la selección de temas, la
  opción "Tema" del menú, el parámetro de URL `?theme=` y el selector de la hoja
  de arte. Queda un único aspecto estándar con una única paleta para el arte
  que sigue siendo SVG (piezas del laberinto, platos, efectos e iconos del HUD).
- **BREAKING — formato de nivel**: el campo `theme` deja de formar parte del
  documento de nivel; si un fichero antiguo lo trae se ignora y no se vuelve a
  escribir. La versión del formato no cambia.
- **Ajustes del jugador**: se deja de guardar el tema; un registro antiguo que
  lo tenga se sigue leyendo y el campo se ignora.
- **Se borra el arte sustituido**: los SVG de ingredientes y personajes, los
  pies de los enemigos y el tema `midnight`. Cada gráfico tiene una única
  fuente: PNG renderizado o SVG.
- Guía de estilo, manual del desarrollador, fundamentos y README actualizados.

## Capabilities

### New Capabilities
- `rendered-assets`: arte renderizado con Blender (pipeline reproducible,
  encuadre, iluminación, tamaño 4×, tramo central sin costuras, fotogramas de
  baile) y su uso en el juego.

### Modified Capabilities
- `vector-assets`: los SVG quedan para el laberinto, los platos, los efectos y
  el HUD, con una sola paleta; el rasterizado pasa a escala 4, sin temas, y
  admite también fuentes PNG.
- `visual-themes`: se retira por completo (todos sus requisitos).
- `character-rigs`: personajes con gráficos renderizados, enemigos con piernas
  y altura de chef, coleta, y fotogramas para los bailes (deja de prohibirse la
  animación por fotogramas en ese caso).
- `view-adapter`: efectos, ingredientes y laberinto con el aspecto estándar en
  lugar del tema activo; apilado en el plato según el grosor.
- `screen-layout`: escala de dibujo 4 y Full HD como objetivo.
- `level-data`: se retira el campo `theme`.
- `player-settings`: se deja de guardar el tema.
- `game-flow`: las opciones dejan de ofrecer el tema.

## Impact

- **Código**: `src/view/theme/` y `src/view/themes/` desaparecen; el catálogo
  de gráficos, la paleta y su aplicación pasan a `src/view/art/`; el
  rasterizador carga PNG o SVG sin tema; `ArtFactory`, `BootScene`,
  `TitleScene`, `GameScene`, `HudScene`, `MenuScene`, `main.ts`, ajustes,
  catálogos i18n, lectura y escritura de niveles, hoja de arte y escenarios del
  test de humo; se borra `src/view/fx/bloom.ts`. Los rigs ganan fotogramas y
  animaciones por tipo de enemigo; el apilado pasa a `src/objects/stacking.ts`.
- **Arte**: PNG nuevos en `src/view/art/`, scripts en `tools/blender/`
  (Python, Blender 5.2 LTS como herramienta de autor documentada en el manual).
- **Rendimiento**: con escala 4 el lienzo interno ronda 3400×1920; hay que
  comprobarlo en un móvil real.
- **Sin dependencias nuevas** de ejecución ni de npm.
