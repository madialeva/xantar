# Proposal

Seguimiento: issue #4 (hito `v1.0.0`). Depende de #2 (núcleo de simulación) y
#3 (modelo de nivel), ambos archivados. Cambios relacionados: #5 escenas e
i18n, #6 audio, #7 editor (consumirá los temas y las piezas dibujadas).

## Why

La vista del POC dibuja todo con primitivas de Phaser (rectángulos y círculos
con colores fijos en `src/config.ts`) sobre un lienzo de 640×480 escalado por
CSS: se ve borroso en pantallas de alta densidad, deja bandas negras en
cualquier pantalla que no sea 4:3 y el HUD tapa la fila superior del tablero.
La dirección acordada es un estilo vectorial moderno y limpio (no pixel art)
que escale a cualquier resolución y que encaje con el modelo de nivel por
piezas de #3, cuyo registro dejó a propósito el aspecto para "los temas de
#4". Hacerlo ahora, antes del flujo de escenas (#5) y del editor (#7), evita
que esos cambios se construyan sobre el dibujo provisional.

## What Changes

- **Guía de estilo** breve (`docs/STYLE_GUIDE.md`, de momento en español; se
  pasará a inglés más adelante): paleta por
  tokens, grosor de trazo, radios de esquina, sombras, tipografía y reglas de
  composición de piezas y personajes sobre la rejilla de 32 px.
- **Fuentes SVG** para piezas del laberinto (plataforma, escalera, cruce,
  plato), los cuatro ingredientes (extremos y tramo central de cada segmento),
  el chef, los tres enemigos, la nube de pimienta e iconos del HUD. Los SVG se
  incluyen en el bundle como texto (importación `?raw` de Vite, sin
  dependencias nuevas) para que funcionen bajo `file://` en Electron, donde el
  cargador SVG de Phaser (XHR) falla.
- **Rasterizado al cargar** a la escala real de dibujo: un rasterizador
  convierte cada SVG en textura de Phaser a un **nivel de escala** (1×, 2×,
  4×). En esta versión el nivel es fijo a **2×**; queda preparada la costura
  para elegirlo a partir del tamaño real de la ventana. El lienzo se dibuja a
  esa resolución y la cámara aplica el zoom, de modo que las coordenadas
  lógicas (rejilla de 32 px, `src/config.ts`) no cambian.
- **Personajes por partes** (cuerpo, cabeza, gorro, brazos, piernas…)
  montados en un contenedor y animados con **tweens** (rebote al andar,
  balanceo al trepar, *squash & stretch* al aterrizar o al ser golpeado,
  tambaleo al estar aturdido), descritos como datos (rig) y con estados de
  animación como objetos State. Sin runtimes esqueléticos.
- **Temas intercambiables**: un tema define la paleta (tokens → colores) y,
  opcionalmente, sustituye el SVG de cualquier pieza, ingrediente o personaje.
  Lo que un tema no define se toma del tema por defecto. Se entregan dos temas
  (`classic` y `midnight`) para demostrar que el mismo nivel se puede
  revestir. Todos los temas registrados se rasterizan al arrancar, de modo que
  cada nivel se dibuja con el suyo sin esperas.
- **Tema en el JSON de nivel**: campo opcional `theme` en el formato de nivel
  v1 (compatible hacia atrás: sin él se usa el tema por defecto). La
  simulación no lo interpreta; la vista lo usa para elegir el tema. El
  parámetro de URL `?theme=` lo sustituye para probar un nivel con otro
  aspecto. Un id de tema desconocido no impide jugar: se avisa y se usa el tema
  por defecto.
- **Tablero central con paneles laterales**: el tablero de 20×15 queda
  centrado y el HUD (puntos, nivel, vidas, pimientas, botón de salir) pasa a
  paneles a izquierda y derecha. El ancho lógico se adapta a la proporción de
  la ventana (16:9 y móviles en horizontal sin bandas negras); en pantallas
  más estrechas que el mínimo se mantiene el ajuste con bandas.
- **Efectos de eventos** dibujados con el nuevo estilo: los que ya existen
  (destello, nube de pimienta, pantallas de fin de nivel y de partida) y
  adorno ligero para eventos hoy ignorados (pisar un segmento, aterrizar un
  ingrediente, aplastar un enemigo, completar una hamburguesa).
- **Evaluación de post-procesado** (filtros de Phaser 4: `Glow`, `Shadow`,
  bloom) con una decisión documentada en `design.md` antes de adoptarlos;
  sombras y brillos horneados en los SVG. Resultado: un tema puede activar el
  resplandor (*bloom*), que usa `midnight`; el resto se descarta por ahora.
- **Retirada del dibujo provisional**: desaparecen `INGREDIENT_COLORS`,
  `INGREDIENT_HEIGHTS` y `COLORS` de `src/config.ts` y los assets de ejemplo
  sin uso (`public/assets/red.png`, `space.png`).
- **Documentación**: `README.md` (aspecto, temas), `docs/MANUAL.md`
  (pipeline visual, cómo añadir un SVG, un tema o una parte de personaje) y
  `AGENTS.md` (excepción de los SVG en `src/` frente a `public/`).
- Sin cambios en reglas de juego ni en niveles.

## Capabilities

### New Capabilities

- `vector-assets`: fuentes SVG de las piezas y personajes, guía de estilo,
  rasterizado al cargar a un nivel de escala y compatibilidad con `file://`.
- `visual-themes`: temas como paleta más sustituciones de SVG, herencia del
  tema por defecto, selección del tema y revestimiento de un mismo nivel.
- `character-rigs`: personajes compuestos por partes y animados con tweens
  según su estado, sin efecto sobre la simulación.
- `screen-layout`: tablero central con paneles laterales para el HUD,
  adaptación a la proporción de la ventana y resolución del lienzo.

### Modified Capabilities

- `level-data`: el documento de nivel admite el campo opcional `theme`, que
  se conserva al importar y exportar.
- `view-adapter`: el laberinto, los ingredientes y los personajes se dibujan
  con las texturas del tema en lugar de primitivas; el HUD se muestra en los
  paneles laterales y no sobre el tablero; nuevos efectos de adorno para
  eventos hasta ahora ignorados.

## Impact

- **Código**: nuevo `src/view/` (rasterizador, temas, rigs, layout, fuentes
  SVG); se reescriben `ChefView`, `EnemyView` e `IngredientView`; `GameScene`
  pasa el dibujo del laberinto y el HUD a clases propias; nueva escena de
  arranque mínima que rasteriza los temas antes de `TapScene`;
  `LevelDocument`, `parseLevelDocument` y `serializeLevel` aceptan `theme`; `src/main.ts`
  cambia el modo de escala y el tamaño del lienzo; `src/config.ts` pierde las
  constantes de color y alturas. Herramientas de verificación visual en
  TypeScript: prueba de humo de Electron (`tools/smoke/`, `npm run smoke`) y
  lámina de arte de desarrollo (`tools/art-sheet.html`, `src/devtools/`).
- **Dependencias**: ninguna nueva en tiempo de ejecución. Una declaración de
  tipos para los módulos `*.svg?raw`.
- **Jugabilidad**: ninguna diferencia; las reglas y los niveles no se tocan.
  Requiere revisión visual del autor en navegador, Electron y un móvil en
  horizontal.
- **Fuera de alcance**: runtimes esqueléticos tipo Spine/DragonBones (añadirían
  una dependencia), audio (#6), menús y flujo de escenas (#5), selección del
  tema desde un menú (#5) o desde el editor (#7), elección automática del nivel
  de escala (seguimiento) y cambios de reglas o de niveles.
