# Design

## Context

Estado tras #3 (ver `proposal.md` para la motivación):

- `src/main.ts` crea el juego con `Phaser.Scale.FIT` sobre 640×480 lógicos y
  `scene: [TapScene, GameScene]`; el lienzo se escala por CSS.
- `GameScene` hace de raíz de composición de la partida y además dibuja el
  laberinto con `Graphics` y rectángulos, crea el HUD (textos en la fila 0 y el
  botón ✕) y las pantallas de fin. `ChefView`, `EnemyView` e
  `IngredientView` son `Container` de primitivas con colores de
  `src/config.ts` (`COLORS`, `INGREDIENT_COLORS`, `INGREDIENT_HEIGHTS`).
- Los snapshots de la simulación ya dan a la vista lo que necesita para
  animar: `ChefSnapshot` (`facing`, `isMoving`, `isClimbing`),
  `EnemySnapshot` (`active`, `stunned`, `stunTicksLeft`, `facing`,
  `isClimbing`), `IngredientSnapshot` (`phase`, `stomped`, `left`, `width`) y
  eventos (`segmentStomped`, `ingredientLanded`, `enemySquashed`,
  `burgerDone`…) que hoy la vista ignora.
- El registro de piezas (#3) identifica cada pieza por `id` y no contiene nada
  gráfico; el `Level` expone `graph.platforms`, `graph.ladders` y `plates`.
- El cargador SVG de Phaser 4 (`SVGFile`) descarga el fichero por XHR, que
  falla bajo `file://` en Electron; `loader.imageLoadType: 'HTMLImageElement'`
  solo afecta a las imágenes rasterizadas.
- Phaser 4.2 incluye `Phaser.Scale.EXPAND`, filtros `Glow`, `Shadow` y `Blur`,
  y `TextStyle.resolution`.
- Restricciones de `AGENTS.md`: sin dependencias de ejecución nuevas, la vista
  depende del dominio y nunca al revés, constructor injection en una raíz de
  composición, Strategy/State en lugar de `switch` por tipo, pruebas para todo
  lo que no necesite lienzo.

## Goals / Non-Goals

**Goals:**

- Un pipeline único SVG → textura que funcione igual en web y en Electron y
  cuya escala se pueda cambiar en un solo punto.
- Temas resueltos como datos puros (paleta + sustituciones) y comprobables sin
  lienzo.
- Coordenadas lógicas intactas: ni la simulación ni la conversión
  casilla→unidad (`TILE`, `platformY`) cambian.
- `GameScene` vuelve a ser una raíz de composición fina: laberinto, HUD,
  pantallas y efectos pasan a clases propias.

**Non-Goals:**

- Elección automática del nivel de escala (1×/2×/4×) según la ventana y la
  densidad de píxeles: se deja la costura y un único valor fijo (2). Issue de
  seguimiento.
- Re-rasterizar durante la partida y rasterizar temas de forma perezosa: con
  dos temas pequeños se rasterizan todos al arrancar (D5).
- Elegir el tema desde un menú (#5) o asignarlo desde el editor de niveles
  (#7); aquí solo se define el campo `theme` y su prioridad frente a la URL.
- Tipografía propia empaquetada: el HUD usa una pila de fuentes del sistema
  definida en la guía de estilo.
- Disposición en vertical (retrato) y controles táctiles en pantalla (#6).
- Empaquetado de texturas en atlas y horneado del laberinto en una sola
  textura: el número de texturas (~60) y de imágenes del laberinto (~300) no
  lo justifica todavía.
- Puntuaciones flotantes, partículas y fondos con parallax.
- Récord de puntuación en el HUD (la simulación no lo lleva).

## Decisions

### D1. Fuentes SVG dentro del bundle como texto

Las fuentes viven en `src/view/art/<tema>/<graphicId>.svg` y se cargan con
`import.meta.glob('./art/**/*.svg', { query: '?raw', import: 'default',
eager: true })`. El nombre del fichero (sin extensión) es el `GraphicId`.

- **Por qué:** funciona bajo `file://` sin XHR, Vite lo resuelve en la build
  sin plugins y el texto queda disponible para inyectar la paleta del tema
  (D3). Los SVG siguen siendo ficheros editables con Inkscape o a mano.
- **Alternativas:** `public/` + `this.load.svg` (falla en Electron por XHR);
  `public/` + `HTMLImageElement` directo (funciona, pero sin acceso al texto no
  hay paleta por tema); cadenas en `.ts` (no editables con herramientas
  gráficas).
- **Coste:** se añade `src/vite-env.d.ts` con
  `/// <reference types="vite/client" />` para tipar `import.meta.glob`. Es una
  excepción explícita a "los assets en `public/`" que se documenta en
  `AGENTS.md` y en el manual: los SVG son código fuente del arte, no ficheros
  servidos.

### D2. Catálogo de gráficos (`GraphicId`)

Un módulo puro `src/view/theme/graphics.ts` define, como `as const`, todos los
gráficos que la vista puede pedir, cada uno con su tamaño lógico:

- Piezas, con el `id` del registro como prefijo: `platform.left`,
  `platform.mid`, `platform.right`, `ladder`, `crossing`, `plate.left`,
  `plate.mid`, `plate.right` (32×32 salvo indicación en la guía).
- Ingredientes: `<kind>.left|mid|right` (32 de ancho, alto según el tipo; las
  alturas de `INGREDIENT_HEIGHTS` pasan a este catálogo).
- Partes de personajes: `chef.body`, `chef.head`, `chef.hat`, `chef.armLeft`,
  `chef.armRight`, `chef.legLeft`, `chef.legRight`, `chef.eyes`;
  `<enemy>.body`, `<enemy>.eyes`, `<enemy>.feet`.
- Efectos y HUD: `fx.pepper`, `fx.squash`, `fx.sparkle`, `hud.life`,
  `hud.pepper`, `hud.exit`, `board.backdrop`.

El tamaño lógico se toma del `viewBox` del SVG del tema por defecto; la prueba
de catálogo comprueba que coincide con el declarado. Un ingrediente de 2
segmentos usa `left` + `right`; de 3, `left` + `mid` + `right`; de 4, `left` +
`mid` + `mid` + `right`.

### D3. Paleta por clases CSS inyectadas

Los SVG no llevan colores literales: cada forma usa clases `f-<token>` (relleno)
y `s-<token>` (trazo), y el SVG incluye un `<style>` propio solo con trazo,
radios y opacidades. Antes de rasterizar, la función pura
`applyPalette(svg, palette)` inserta tras la etiqueta `<svg …>` un `<style>`
con `.f-bun{fill:#e0a96d}` y `.s-outline{stroke:#2b2f36}` para cada token.

- **Por qué:** una sola fuente sirve para cualquier paleta; la sustitución es
  texto puro y se prueba en Node.
- **Alternativas:** `var(--token)` en atributos de presentación (soporte
  irregular en SVG usado como imagen); plantillas `{{token}}` (el SVG deja de
  verse en un editor); tintado de Phaser (`setTint`, multiplica y no permite
  varios colores por gráfico).
- **Convención comprobada:** la prueba de arte rechaza atributos `fill`,
  `stroke`, `stop-color` o `style` con colores literales (salvo `none` y
  `currentColor`) y clases `f-`/`s-` con tokens que no existen.

### D4. Temas como datos y registro

```ts
interface Theme {
  readonly id: string;
  readonly name: string;
  readonly palette: Partial<Palette>;
  readonly art: Partial<Record<GraphicId, string>>;
}
```

`ThemeRegistry` (análogo a `PieceRegistry`) registra temas y
`resolve(id)` devuelve un `ResolvedTheme` completo: paleta y arte del tema
por defecto sobrescritos por los del tema pedido. `classic` es completo por
construcción y la prueba lo verifica. El arte de cada tema se obtiene del glob
de D1 agrupando por carpeta. La paleta de cada tema vive en
`src/view/themes/<id>.ts`.

El tema alternativo es `midnight`: fondo azul noche, piezas con acento de
neón y una plataforma propia (sustituye `platform.*`), útil también para
probar el brillo de D9.

La selección es una función pura `chooseTheme({ urlTheme, levelTheme },
registry)` que devuelve el id elegido y los avisos (id desconocido y su
origen) con la prioridad URL → nivel → `classic`; se prueba en Node.
`src/main.ts` lee `?theme=` con `URLSearchParams` una vez y lo inyecta en
`GameScene`, que llama a `chooseTheme` al empezar cada tablero con el `theme`
del documento de nivel y escribe los avisos con `console.warn`. Cambiar de
tema entre tableros solo cambia el prefijo de las texturas que piden las
vistas (D5), que se reconstruyen en `boardStarted` como ya ocurre con los
ingredientes.

### D5. Rasterizado en una escena de arranque

Nueva `BootScene` (primera de la lista) que recibe por constructor el
`ThemeRegistry` y el nivel de escala, rasteriza el catálogo completo de
**cada tema registrado** con claves de textura `<tema>/<graphicId>` y arranca
`TapScene`. Con dos temas son ~120 texturas pequeñas (unos pocos MB de
memoria de vídeo a 2×); si el número de temas crece, se pasará a rasterizar
solo el tema del nivel siguiente sin cambiar specs. `SvgRasterizer`:

1. `applyPalette` → `Blob` `image/svg+xml` → `URL.createObjectURL`.
2. `HTMLImageElement` con `width`/`height` = tamaño lógico × nivel y
   `await image.decode()`.
3. Dibujo en un `<canvas>` de ese tamaño y `textures.addCanvas(id, canvas)`.
4. Si algo falla: `console.error` con tema e id y textura de marcador
   (cuadros magenta) generada en un canvas.

Los gráficos se rasterizan en paralelo (`Promise.all`); con ~60 gráficos
pequeños el coste es de milisegundos. `BootScene` muestra un texto mínimo de
carga; no es un menú (#5).

Inyección: Phaser acepta instancias de escena en `config.scene`, así que
`main.ts` construye `new BootScene({ themes, tier })`,
`new GameScene({ themes, urlTheme, tier, … })`. Es la raíz de composición; nada de globales ni del registro de datos de
Phaser para dependencias.

### D6. Nivel de escala, cámara y coordenadas lógicas

- `RenderTier = 1 | 2 | 4` y la constante `RENDER_TIER: RenderTier = 2` en
  `src/config.ts`.
- El tamaño del juego en Phaser es el área lógica × nivel. La cámara principal
  usa `setZoom(tier)` y se centra en el centro del tablero, de modo que el
  mundo sigue en unidades lógicas: el tablero ocupa `(0,0)–(640,480)` y los
  paneles quedan en `x < 0` y `x ≥ 640`. Nada del dibujo del tablero cambia de
  coordenadas.
- `ArtFactory` (vista, creada para el tema del tablero en curso) crea imágenes
  desde un `GraphicId` resolviendo la clave `<tema>/<graphicId>` y con
  `setScale(1 / tier)`, de forma que una textura de 64 px ocupa 32 unidades y
  con el zoom 2 se pinta 1:1 en el lienzo. Es el único punto que conoce el
  nivel; cambiar a 4 es cambiar la constante.
- Los textos se crean con `resolution: tier`.
- **Prototipo (tarea 1.3):** con el juego a 1706×960, `setZoom(2)` y
  `centerOn(320, 240)`, el tablero queda centrado, un texto en `x < 0` se ve
  en el panel izquierdo y una textura SVG de 64 px con `setScale(0.5)` ocupa
  justo una casilla, en Electron bajo `file://`. La API de Phaser 4 se
  comporta como se esperaba; solo se ha probado con el renderizador Canvas
  (el entorno de pruebas sin GPU bloquea WebGL), así que WebGL queda para la
  revisión del autor.
- **Alternativa descartada:** mantener el lienzo a 640×480 y subir
  `game.config.zoom` (escala el lienzo ya rasterizado; no gana nitidez).

### D7. Disposición: `computeLayout` puro + FIT con tamaño variable

Función pura `computeLayout(viewportWidth, viewportHeight): Layout` en
`src/view/layout/` que devuelve el ancho lógico
`clamp(480 × aspecto, 832, 1152)`, el rectángulo del tablero y los de los
paneles (en unidades lógicas, relativos al tablero). `main.ts` usa
`Phaser.Scale.FIT` + `CENTER_BOTH` y, al arrancar y en cada `resize` de la
ventana, llama a `game.scale.setGameSize(width × tier, 480 × tier)`. Las
escenas escuchan el evento `resize` del `ScaleManager` para recentrar la
cámara y recolocar los paneles.

- **Por qué no `Scale.EXPAND`:** no tiene ancho máximo (en 32:9 los paneles
  serían enormes) y repartiría el ancho extra según su propia regla; con
  `computeLayout` los límites son explícitos y se prueban.
- Pruebas: 16:9, 19,5:9, 4:3, 21:9, 32:9 y ventanas diminutas.

### D8. Personajes: rig como datos, animación como State

- `RigDefinition` (dato inmutable): lista de partes con `graphic`, posición,
  punto de giro (`originX/Y`) y orden de dibujo. `chefRig` y un rig por
  enemigo en `src/view/rigs/`.
- `CharacterRig` (`Phaser.GameObjects.Container`): crea una imagen por parte
  con `ArtFactory`, guarda la postura base y expone `resetPose()` y el acceso
  a las partes por nombre. El volteo (`facing`) se aplica al contenedor; las
  animaciones solo tocan partes, así no interfieren.
- `AnimationState` (interfaz State) con `enter(rig, tweens)`; implementaciones
  `Idle`, `Walk`, `ClimbIdle`, `Climb`, `Hit`, `Stunned`. `RigAnimator`
  cambia de estado: mata los tweens de las partes (`killTweensOf`),
  `resetPose()` y `enter` del nuevo.
- La elección del estado es una función pura del snapshot:
  `chefAnimation(snapshot, hitActive)` y `enemyAnimation(snapshot)`, probadas
  en Node. `ChefView`/`EnemyView` solo llaman a `animator.show(key)` en cada
  `sync`; si la clave no cambia, no hacen nada.
- `Hit` empieza con el evento `chefHit` y termina con `boardStarted` (la vista
  lo marca; la simulación no cambia). El tambaleo de aturdido pasa a un tween;
  la duración la sigue marcando `stunned` del snapshot.
- Desplazamiento visual acotado: los tweens mueven partes como mucho ±4
  unidades y escalan entre 0,8 y 1,2; la posición del contenedor la decide
  solo la interpolación de siempre.
- **Alternativa descartada:** Spine/DragonBones (dependencia de ejecución) y
  hojas de sprites (contradice el estilo vectorial escalable).

### D9. Post-procesado: evaluar antes de adoptar

Tarea de evaluación con los filtros de Phaser 4 (`Glow` en ingredientes y
chef del tema `midnight`, `Shadow` en personajes) y un bloom aproximado
(`Blur` + `Blend`). Criterios: 60 fps estables a 1920×1080 en Chrome y en
Electron en el equipo del autor y en un móvil Android medio, y una mejora
visual que el autor apruebe. Por defecto, y mientras no se cumplan,
sombras y brillos van **horneados en los SVG** (formas con opacidad), sin
filtros. El resultado se anota en este documento en una sección
"Resultado de la evaluación de post-procesado".

### D10. Descomposición de la vista

```
src/view/
  art/classic/*.svg, art/midnight/*.svg
  theme/   graphics.ts, palette.ts, applyPalette.ts, Theme.ts, ThemeRegistry.ts,
           chooseTheme.ts
  themes/  classic.ts, midnight.ts
  raster/  SvgRasterizer.ts, ArtFactory.ts
  layout/  computeLayout.ts
  rigs/    RigDefinition.ts, chefRig.ts, enemyRigs.ts, CharacterRig.ts,
           RigAnimator.ts, states/*.ts, chooseAnimation.ts
  board/   MazeView.ts
  hud/     HudPanels.ts, OverlayView.ts
  fx/      EventEffects.ts
src/scenes/  BootScene.ts (nueva), TapScene.ts, GameScene.ts
src/objects/ ChefView.ts, EnemyView.ts, IngredientView.ts (reescritas)
```

`theme/`, `themes/`, `layout/` y `chooseAnimation.ts` no importan Phaser ni
el DOM y llevan pruebas. `MazeView` dibuja a partir de `level.graph` y
`level.plates`: por cada tramo de plataforma, `left`/`mid`/`right` según la
posición de la casilla; las escaleras, una imagen `ladder` por fila; los
cruces, `crossing` encima. `EventEffects` recibe los eventos y crea los
adornos (`fx.*`) con tweens que se destruyen solos y que `GameScene` limpia en
`boardStarted`.

### D11. Guía de estilo

`docs/STYLE_GUIDE.md`, de momento en español por decisión del autor (se pasará
a inglés más adelante; `AGENTS.md` lo anota como excepción temporal junto a
`docs/MANUAL.md`): tokens de paleta y su uso
(`bun`, `bunShade`, `patty`, `lettuce`, `plate`, `platform`, `ladder`,
`outline`, `shadow`, `highlight`, `chef`, `skin`, `hotdog`, `pickle`, `egg`,
`yolk`, `hudText`, `hudAccent`, `danger`, `background`…), trazo de contorno
2 unidades con uniones redondeadas, radios 4/8, sombra horneada (forma
desplazada 2 unidades abajo con el token `shadow` y opacidad 0,35), pila de
fuentes del HUD, y la convención de autoría (D3) con instrucciones para
exportar desde Inkscape como "SVG plano" y sustituir colores por clases.

### D12. Campo `theme` en el documento de nivel

- `LevelDocument` gana `theme?: string`. `parseLevelDocument` lo acepta si es
  una cadena con el formato `^[a-z][a-z0-9-]*$` y lo rechaza con
  `LevelError` en otro caso; si falta, queda sin definir.
- `serializeLevel` lo escribe tras `"segments"` solo cuando existe, de modo
  que los niveles sin tema exportan el mismo texto que hoy.
- La versión del formato sigue en 1: el campo es opcional y un lector anterior
  lo ignoraba (no rechaza campos desconocidos).
- El núcleo no comprueba que el tema exista (no conoce los temas, que son de
  la vista) y ninguna entidad de `src/sim/` lo lee; la prueba de determinismo
  se amplía con el nivel clásico con y sin `theme`.
- `src/levels/classic.level.json` declara `"theme": "classic"`.
- **Alternativa descartada:** validar el id contra el registro al cargar
  (acoplaría el dominio a la vista y rompería la carga de niveles creados con
  temas que no estén instalados).

## Risks / Trade-offs

- [Calidad del arte hecho a mano en SVG] → formas simples y geométricas acordes
  al estilo "limpio"; el autor revisa visualmente y puede retocar cualquier
  SVG sin tocar código.
- [Nivel 2× fijo se ve algo blando en 4K y algo pesado en móviles modestos] →
  costura `RenderTier` en un solo punto; elección automática como
  seguimiento.
- [`setGameSize` en cada `resize` podría producir parpadeo o recrear
  texturas] → solo cambia el tamaño del lienzo; las texturas no dependen de él.
  Se agrupan los `resize` con `requestAnimationFrame`.
- [Muchas imágenes pequeñas en el laberinto] → el renderizador WebGL de Phaser
  4 las agrupa por textura; si el perfilado lo pide, hornear el laberinto en
  una `RenderTexture` (sin cambiar specs).
- [Las herramientas de dibujo meten colores literales] → la prueba de arte lo
  detecta con el fichero y el atributo; la guía explica la exportación.
- [Tweens que quedan vivos tras reiniciar] → `RigAnimator` y `EventEffects`
  matan sus tweens en `boardStarted` y al destruir la escena; escenario
  cubierto en `character-rigs`.
- [La excepción `src/view/art` frente a `public/` confunde] → se documenta en
  `AGENTS.md` y en el manual.

## Migration Plan

No hay datos que migrar ni cambios de reglas. Se sustituye el dibujo por
primitivas de una vez dentro de la rama; las constantes de color de
`src/config.ts` y los PNG de ejemplo sin uso se eliminan al final. Marcha atrás:
revertir el commit de la rama.

## Open Questions

- Paleta exacta de `midnight` (azul noche con acentos neón) y qué piezas
  sustituye además de la plataforma: se decide con el autor al revisar los primeros
  SVG; no cambia specs ni tareas.
- Orden y espaciado finos de los elementos dentro de cada panel: se ajustan en
  la revisión visual.
