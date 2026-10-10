# Design

## Context

Estado tras #5 (motivación en `proposal.md`):

- **Entrada**: `GameScene` crea teclas de Phaser (`createCursorKeys`, WASD,
  Espacio, Enter) y compone `SimInput` en `#readInput`; la pimienta y confirmar
  se acumulan como pendientes hasta el siguiente tick. `HudScene` escucha
  `keydown` (Esc/P, Enter/Espacio en fin de partida) y `MenuList` escucha
  teclas por su cuenta. `TitleScene` usa `pointerup`/`keydown` porque la
  pantalla completa y el audio exigen un gesto dentro del manejador del evento.
  `SimInput` (izquierda, derecha, arriba, abajo, pimienta, confirmar) ya es
  abstracto y no cambia.
- **Audio**: `TitleMusic` usa `new Audio('music/tap-back.mp3')` (2 MB) para
  esquivar el cargador de Phaser, que usa XHR y falla bajo `file://`. No hay
  efectos. `electron/main.ts` desactiva la política de autoplay.
- **Ajustes**: `PlayerSettings` versión 1 (`language`, `theme`, `bestScore`),
  leído campo a campo por `parseSettings`; `Settings` guarda en cada cambio.
- **Electron**: `loadFile(dist/index.html)`, `contextIsolation: true`,
  `nodeIntegration: false`, sin `sandbox`, sin CSP, sin control de navegación,
  sin instancia única ni iconos. El preload expone `isDesktop`, `platform` y
  `quit`. La prueba de humo (`tools/smoke/main.ts`) crea su propia
  `BrowserWindow` con opciones duplicadas.
- **CI**: no existe. `AGENTS.md` pide comprobar a mano la versión de la rama.
- Restricciones de `AGENTS.md`: sin dependencias nuevas, objetos con estado
  encapsulado, interfaces inyectadas desde la raíz de composición
  (`src/main.ts`), State/Strategy en lugar de `switch` por tipo, lógica pura con
  pruebas y textos desde los catálogos.

## Goals / Non-Goals

**Goals:**

- Una sola fuente de verdad de la entrada por fotograma, independiente de las
  escenas, que la partida, el HUD y los menús consultan por acción.
- Toda la lógica nueva que no necesita navegador (asignaciones, estado de
  acciones, cruceta, síntesis, relación evento → efecto, mezcla, ajustes,
  versión de rama, rutas del protocolo) es pura y con pruebas.
- La aplicación de escritorio carga el juego igual que la web (mismo cargador,
  mismo origen estable), lo que permite quitar los atajos de `file://`.
- La prueba de humo ejerce la misma ventana endurecida que la aplicación real.

**Non-Goals:**

- Reasignar botones del mando o soportar mandos sin mapeo estándar.
- Layout vertical jugable; en vertical solo hay aviso.
- Música durante la partida, música por nivel o efectos posicionales.
- Ficheros de efectos de sonido o un editor de efectos.
- Firma de código, notarización, publicación en GitHub Releases y
  actualización automática.
- Publicación web (#14) y protección de ramas en GitHub (la configura el autor
  con los checks que crea este change).
- Vibración del mando y de móviles.

## Decisions

### D1. Entrada: acciones, fuentes y un estado por fotograma

```
 KeyboardSource ─┐
 GamepadSource  ─┼─► ActionInput.update() (PRE_STEP de Phaser, una vez por fotograma)
 TouchPad       ─┘        │ held / justPressed / repeated por acción
                          ├─► GameScene  → toSimInput() → Simulation.step
                          ├─► HudScene   (pausa, fin de partida)
                          └─► MenuList   (moverse, confirmar, volver)
```

- `src/input/` (puro, con pruebas):
  - `actions.ts`: `type Action = 'up' | 'down' | 'left' | 'right' | 'pepper' |
    'confirm' | 'back' | 'pause' | 'mute'` (`as const`) y
    `REMAPPABLE_ACTIONS` (las siete reasignables).
  - `InputSource` (interfaz, Strategy): `held(): ReadonlySet<Action>` y
    `release(): void` (soltar todo).
  - `ActionState` (clase): a partir del conjunto activo de cada fotograma y del
    tiempo calcula `isDown`, `justPressed` (flanco de subida) y `repeated`
    (flanco + repetición tras 400 ms cada 120 ms, para menús). Sin dependencias
    de Phaser; el reloj llega como argumento de `update(nowMs)`.
  - `toSimInput(state, pending)`: compone `SimInput`. La pimienta y confirmar
    se siguen acumulando como pendientes hasta el siguiente tick (igual que
    ahora), porque un fotograma puede no ejecutar ningún tick.
- `src/view/input/` (adaptadores):
  - `ActionInput` (clase): combina las fuentes en un `ActionState`; `main.ts`
    lo crea, llama a `update` en `Phaser.Core.Events.PRE_STEP` y lo inyecta en
    las escenas. Ofrece `capture(callback)` para la página de Controles: la
    siguiente tecla va al callback y no produce acciones.
  - `KeyboardSource`: escucha `keydown`/`keyup` en `window` (no el teclado de
    Phaser), guarda los `KeyboardEvent.code` pulsados y los traduce con las
    asignaciones vigentes; `preventDefault` solo para teclas asignadas (evita
    desplazar la página). Suelta todo en `blur` y `visibilitychange`.
  - `GamepadSource`: sondea `navigator.getGamepads()` (inyectado como función)
    en cada `held()`, solo mandos con `mapping === 'standard'`; zona muerta del
    stick 0,5; avisa (Observer) de desconexión. Mapeo fijo: cruceta/stick →
    direcciones, A (0) → pimienta y confirmar, X (2) → pimienta, B (1) →
    volver, Start (9) → pausa.
  - `TouchPad`: estado de acciones escrito por los controles táctiles (D4).
- **Por qué fuera de las escenas:** el teclado de Phaser es por escena y una
  escena en pausa no procesa entrada, lo que deja teclas "pegadas" al
  reanudar. Una fuente global con un único `update` por fotograma lo evita y
  hace que `HudScene` y `GameScene` vean el mismo estado.
- **Gesto del título:** `requestFullscreen` y el desbloqueo de audio deben
  ocurrir dentro del manejador del evento DOM, no en el bucle. `TitleScene`
  conserva `pointerup`/`keydown` para eso y además acepta `justPressed` del
  mando (sin pantalla completa si el navegador lo rechaza).
- **Alternativas descartadas:** plugin de teclado y de mando de Phaser por
  escena (estado partido y teclas pegadas); un `EventEmitter` de acciones
  (complica los estados mantenidos y la repetición).

### D2. Asignaciones de teclado y página de Controles

- `KeyBindings` (valor inmutable, `src/input/bindings.ts`):
  `Readonly<Record<RemappableAction, readonly KeyCode[]>>` con 1 o 2 códigos
  por acción. Funciones puras: `DEFAULT_BINDINGS`, `assign(bindings, action,
  slot, code)` (intercambia si el código ya pertenece a otra acción),
  `validateBindings(raw)` (conjunto completo o `null`), `actionsFor(code)`.
- Valores por defecto: arriba `ArrowUp`+`KeyW`, abajo `ArrowDown`+`KeyS`,
  izquierda `ArrowLeft`+`KeyA`, derecha `ArrowRight`+`KeyD`, pimienta `Space`,
  pausa `KeyP`, silencio `KeyM`.
- Fijas, fuera del registro: `Escape` → volver y pausa; `Enter`/`NumpadEnter`
  → confirmar; las teclas de pimienta → también confirmar. Reservadas (no
  asignables): `Escape`, `Enter`, `NumpadEnter`, `F11`. Los menús usan las
  mismas teclas de dirección que la partida; como `assign` intercambia y
  ninguna acción se queda sin tecla, nunca se pierde el acceso a los menús.
  (Se descartó dejar las flechas fijas para los menús: chocaba con asignar una
  flecha a otra acción, que entonces también movería la selección.)
- Se usan `KeyboardEvent.code` (tecla física), no `key`: las asignaciones
  sobreviven a un cambio de distribución. La etiqueta visible sale de
  `keyLabel(code, layoutMap, t)`: `navigator.keyboard.getLayoutMap()` donde
  existe (Chrome, Edge, Electron), si no, una tabla propia; las teclas con
  nombre (Espacio, flechas) salen del catálogo.
- `ControlsPage` (vista, en `MenuScene`): filas acción + dos huecos;
  arriba/abajo cambia de fila, izquierda/derecha de hueco, confirmar entra en
  captura ("PULSA UNA TECLA"), Esc cancela, Retroceso/Supr vacía el hueco
  secundario. Al final, Restaurar y Volver. Es un componente propio, no
  `MenuList`, porque cada fila tiene dos celdas seleccionables.

### D3. Menús por acciones

`MenuList` deja de escuchar el teclado y recibe `ActionInput`; en cada
`update` de su escena consulta `repeated('up'|'down'|'left'|'right')`,
`justPressed('confirm')` y `justPressed('back')`. Mantiene clic y toque. Los
sonidos de interfaz (D7) se inyectan como `UiSounds` (interfaz) para no atar
`MenuList` al audio.

### D4. Controles táctiles y aviso de vertical

- `InputModality` (Observer): pasa a táctil con el primer `pointerdown` de tipo
  `touch` en `window` y no vuelve atrás durante la sesión.
- `TouchControls` (vista, en `HudScene`): cruceta en la parte inferior del
  panel izquierdo y botón de pimienta en la del derecho, dibujados con el arte
  del tema (nuevos gráficos `hud.dpad` y `hud.pepperButton` en
  `src/view/art/classic/`, según `docs/STYLE_GUIDE.md`). Tamaño
  `min(ancho del panel − 2 × margen, 160)`; se recolocan con
  `HudPanels.layout`. Escriben en el `TouchPad` compartido (creado en
  `main.ts`), que `GameScene` lee a través de `ActionInput`.
- La dirección de la cruceta es una función pura
  `dpadDirection(dx, dy, deadZone)` → una de cuatro direcciones o ninguna
  (gana el eje dominante); cada puntero recuerda su control, así deslizar
  cambia de dirección y levantar el dedo suelta solo lo suyo.
- Phaser se configura con `input.activePointers: 3` para multitáctil.
- El botón de pimienta también produce confirmar (fin de nivel y fin de
  partida).
- **Aviso de vertical:** elemento DOM fijo creado por `main.ts`
  (`RotateNotice`) cuyo texto sale del catálogo y se actualiza al cambiar de
  idioma; se muestra con la media query `(orientation: portrait) and (pointer:
  coarse)`. `GameScene` escucha esa media query y pausa al entrar en vertical.
  Se descarta un layout vertical (non-goal) y dibujarlo en Phaser (con el
  lienzo en FIT el texto quedaría diminuto).

### D5. Plataforma: web y escritorio (Strategy)

`src/view/platform/` pasa de `desktopQuit` a una interfaz `Platform` con
`quit: (() => void) | null` y `enterFullscreen(isMobile): Promise<void>`.
`WebPlatform` usa la API de pantalla completa actual (con bloqueo de Esc);
`DesktopPlatform` usa el puente de Electron (`setFullScreen`, D10).
`createPlatform(window)` elige y `main.ts` la inyecta en `TitleScene` y
`MenuScene`.

### D6. Audio: mezclador sobre el gestor de sonido de Phaser

- La música se carga con `this.load.audio('music.title', 'music/tap-back.mp3')`
  en `BootScene`; ya funciona también en escritorio gracias a `app://` (D9).
- `GameAudio` (clase, vista; sustituye a `TitleMusic`): envuelve
  `game.sound` (se le da en `BootScene` con `attach`). Interfaz pública:
  `playMusic(key)`, `stopMusic()`, `cue(name)`, `setVolume(bus, level)`,
  `setMuted(muted)`, `toggleMute()`. Phaser solo tiene volumen maestro, así que
  los **buses** son lógicos: cada sonido se crea con
  `volumen = ganancia(bus) × volumen de la receta` y, al cambiar un bus, se
  actualizan los sonidos vivos de ese bus. El silencio usa `sound.mute`.
- `busGain(level)` pura: `(level / 10)²` (curva perceptiva), 0 → silencio.
- Pausa por foco: `pauseOnBlur` de Phaser (activo por defecto) cubre `blur` y
  pestaña oculta; se comprueba en la prueba manual.
- Desbloqueo: el contexto Web Audio arranca suspendido y Phaser lo reanuda con
  el primer gesto; `TitleScene.#start` llama a `playMusic` dentro de ese gesto.
  Se elimina el `autoplay-policy` de Electron: mismo comportamiento en web y
  escritorio.
- Sin Web Audio (gestor HTML5 o `NoAudio`), `GameAudio` no registra efectos y
  `cue` no hace nada.
- **Alternativa descartada:** seguir con `HTMLAudioElement` y añadir los
  efectos con Web Audio a mano; duplicaría mezcla, pausa y desbloqueo que
  Phaser ya resuelve.

### D7. Efectos sintetizados

- `src/view/audio/synth/` (puro, con pruebas):
  - `SfxRecipe` (datos inmutables): lista de tonos; cada tono tiene forma de
    onda (`square` con ciclo, `triangle`, `saw`, `sine`, `noise`), frecuencia
    inicial y final (barrido exponencial), envolvente ataque/sostén/caída,
    vibrato opcional, inicio relativo y volumen. Un tono basta para un golpe;
    varios encadenados forman los jingles (preparado, nivel completado, fin de
    partida).
  - `renderRecipe(recipe, sampleRate): Float32Array` pura y determinista (el
    ruido usa un generador congruencial con semilla fija por receta, no
    `Math.random`). Recorta a [-1, 1] y comprueba la duración máxima de 3 s.
  - `SOUND_CUES`: catálogo `Record<SoundCue, SfxRecipe>` con `pepper`, `step`,
    `fall`, `land`, `squash`, `stun`, `burger`, `hit`, `ready`, `levelClear`,
    `gameOver`, `menuMove`, `menuSelect`, `menuBack`.
- `BootScene` renderiza cada receta a la frecuencia del contexto, crea un
  `AudioBuffer` y lo registra en `game.cache.audio` con la clave de la señal; a
  partir de ahí son sonidos normales de Phaser. Coste estimado: < 50 ms en
  total; se mide en la prueba de humo.
- **Alternativas descartadas:** ficheros (decisión del autor: sin assets ni
  licencias); sintetizar en tiempo real con osciladores por evento (más nodos
  por sonido, sin pruebas puras y más difícil de limitar).

### D8. Eventos de simulación → efectos

- `eventCue(event): SoundCue | null` (pura, tabla por `event.type`; los tipos
  sin sonido devuelven `null`): `pepperThrown` → `pepper`, `segmentStomped` →
  `step`, `ingredientsTriggered` → `fall`, `ingredientLanded` → `land`,
  `enemySquashed` → `squash`, `enemyStunned` → `stun`, `burgerDone` → `burger`,
  `chefHit` → `hit`, `levelCleared` → `levelClear`, `gameOver` → `gameOver`,
  `phaseChanged` a `ready` → `ready`.
- `CueThrottle` (puro, reloj inyectado): intervalo mínimo por señal (p. ej.
  `step` y `land` 60 ms); la segunda petición dentro del intervalo se descarta.
- `EventSounds` (vista) recibe los eventos de cada fotograma en
  `GameScene.#handleEvents`, junto a `EventEffects`, y llama a `GameAudio.cue`.
- Los sonidos de menú los emite `MenuList` vía `UiSounds` (D3).

### D9. Electron: protocolo `app://`

- `protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: {
  standard: true, secure: true, supportFetchAPI: true, stream: true } }])`
  antes de `ready`; `protocol.handle('app', ...)` sirve `dist/` con
  `net.fetch(pathToFileURL(...))`. La URL es `app://xantar/index.html`.
- `resolveAppPath(url, root): string | null` (pura, en `electron/appProtocol.ts`,
  con pruebas): decodifica la ruta, la normaliza y devuelve `null` si sale de
  `root`; `null` → respuesta 404.
- Con un origen estándar y estable: el cargador de Phaser (XHR) funciona, la CSP
  puede usar `'self'` y `localStorage` tiene un origen propio. Se mantiene
  `loader.imageLoadType: 'HTMLImageElement'` (inofensivo y documentado en
  `AGENTS.md`), pero su justificación pasa a ser histórica.
- En desarrollo (`VITE_DEV_SERVER_URL`) se sigue cargando el servidor de Vite.
- **Alternativa descartada:** seguir en `file://` e incrustar el audio como
  `data:` URI (+2,7 MB en el bundle, CSP con `'self'` sin sentido bajo
  `file://` y el problema de XHR seguiría para cualquier fichero futuro).

### D10. Electron: endurecimiento

`electron/main.ts` se reparte en módulos: `appProtocol.ts` (D9),
`window.ts` (`createGameWindow(options)` con las `webPreferences` y los
manejadores de seguridad) y `main.ts` (ciclo de vida). La prueba de humo
importa `createGameWindow` y `registerAppProtocol` en lugar de duplicarlos.

- `webPreferences`: `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, `webSecurity: true`, `spellcheck: false`. El
  preload (CJS de esbuild) solo usa `contextBridge` e `ipcRenderer`, que están
  disponibles en un preload con sandbox.
- Navegación: `will-navigate` y `will-redirect` cancelan todo lo que no sea el
  origen de la aplicación (o el servidor de Vite en desarrollo);
  `setWindowOpenHandler` → `deny`; `will-attach-webview` → cancelar.
- Permisos: `setPermissionRequestHandler` y `setPermissionCheckHandler`
  deniegan todo (la pantalla completa es nativa y el mando no pide permiso).
- Instancia única: `app.requestSingleInstanceLock()`; si falla, `app.quit()`;
  `second-instance` restaura y enfoca la ventana.
- Pantalla completa nativa: el preload añade `setFullScreen(on)` (IPC
  `window:set-fullscreen`, validando que el argumento es booleano y que el
  emisor es la ventana del juego); F11 se atiende en `before-input-event` del
  proceso principal. Esc deja de ser necesario para salir y llega al juego sin
  bloqueo de teclado.
- Fusibles (`build.electronFuses` de electron-builder, sin dependencia nueva):
  `runAsNode: false`, `enableNodeOptionsEnvironmentVariable: false`,
  `enableNodeCliInspectArguments: false`, `onlyLoadAppFromAsar: true`,
  `enableEmbeddedAsarIntegrityValidation: true`, `enableCookieEncryption:
  true`.
- Se eliminan `autoplay-policy` y el uso de `file://`.

### D11. CSP

- Un plugin de Vite en `vite.config.ts` (`transformIndexHtml`, solo en build)
  inserta `<meta http-equiv="Content-Security-Policy">` con:
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'
  data: blob:; media-src 'self' data: blob:; connect-src 'self' data: blob:;
  font-src 'self' data:; worker-src 'self' blob:; object-src 'none';
  base-uri 'self'; form-action 'none'`.
- Una sola política para web (GitHub Pages no permite cabeceras, #14) y
  escritorio. En desarrollo no se aplica (Vite necesita scripts en línea y
  WebSocket).
- Los estilos en línea de `index.html` pasan a `src/styles.css` importado desde
  `main.ts`, para no necesitar `'unsafe-inline'`. `blob:` en `img-src` es para
  `SvgRasterizer` (`URL.createObjectURL`).
- La prueba de humo ya falla con cualquier error de consola; las violaciones
  de CSP se registran como error, así que la prueba las detecta.

### D12. Iconos y firma

- `build/icon.svg` (fuente, diseñada con la guía de estilo: cabeza del chef
  sobre fondo de la paleta clásica) y `build/icon.png` 1024×1024 generado por
  `scripts/build-icon.mjs`, que la rasteriza con una ventana oculta de Electron
  (`capturePage`), sin dependencias nuevas. El PNG se versiona;
  electron-builder genera `.ico` e `.icns` a partir de él.
- Firma: instaladores sin firmar en la v1.0.0. En CI,
  `CSC_IDENTITY_AUTO_DISCOVERY=false` y `mac.identity: null` evitan intentos de
  firma. El README explica SmartScreen (Windows: "Más información → Ejecutar
  de todos modos"), Gatekeeper (macOS: clic derecho → Abrir, o
  `xattr -dr com.apple.quarantine`) y el permiso de ejecución del AppImage.

### D13. Integración continua

- `.github/workflows/ci.yml`: en `pull_request` hacia `develop/**` y
  `release/**`, y en `push` a esas ramas y a etiquetas `v*`.
  - `check` (ubuntu): `actions/checkout`, `actions/setup-node` con
    `node-version-file: .nvmrc` y caché de npm, `npm ci` con
    `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, y `lint`, `format:check`, `typecheck`,
    `test`, `build`.
  - `version` (ubuntu): `npm run check:version`.
  - `smoke` (ubuntu, tras `check`): instala `xvfb`, `npm ci`,
    `npm run smoke -- quick` (y el escenario de audio, D14); sube `.smoke/`
    como artefacto siempre.
- `.github/workflows/desktop.yml`: en `push` a `release/**`, etiquetas `v*` y
  `workflow_dispatch`; matriz `ubuntu-latest`, `windows-latest`,
  `macos-latest`; `electron-builder --publish never`; sube `release/*.{AppImage,exe,dmg}`
  como artefactos (retención 14 días).
- Comprobación de versión: `expectedVersion({ ref, baseRef }): string | null`
  pura en `tools/ci/branchVersion.ts` con pruebas (`develop/vX.Y.Z`,
  `release/vX.Y.Z`, `vX.Y.Z` → `X.Y.Z`; otras → `null`; en PR manda la rama
  destino). `tools/ci/checkVersion.ts` lee `GITHUB_REF_NAME`, `GITHUB_BASE_REF`
  y `package.json`; se ejecuta con el `node` del proyecto (Node 24 elimina los
  tipos de forma nativa). Script `npm run check:version`.
- Solo acciones oficiales de GitHub (`actions/*`), fijadas a versión mayor.
- `AGENTS.md` cambia "Until the CI workflow exists, check it by hand" por la
  comprobación automática.

### D14. Ajustes y pruebas de humo

- Registro de ajustes: campos nuevos `musicVolume` (0–10, por defecto 7),
  `sfxVolume` (0–10, por defecto 8), `muted` (`false`) y `keyBindings`. Siguen
  en la **versión 1**: son aditivos y `parseSettings` ya da valor por defecto a
  lo que falta, así que un registro de #5 se lee sin migración. `keyBindings`
  se valida como conjunto (`validateBindings`).
- `Settings` gana `setVolume(bus, level)`, `setMuted`, `setKeyBindings`; un
  Observer de ajustes avisa a `GameAudio` y a `KeyboardSource`.
- Opciones: Idioma, Tema, Música, Efectos, Sonido, Controles, Volver. Con siete
  filas, el estilo de la página se compacta (inicio más alto, menos
  separación) para caber en 480.
- Prueba de humo: usa la ventana de D10 y el protocolo `app://`; nuevos pasos
  `touch:x,y` y `touchHold`/`touchRelease` (por `webContents.debugger`,
  `Input.dispatchTouchEvent`); escenarios nuevos `controls` (reasignar la
  pimienta y jugar), `touch` (cruceta y pimienta en 19,5:9), `audio` (opciones
  de sonido; comprueba que no hay errores, el oído es manual) y `security`
  (intentos de `window.open` y navegación externa sin efecto). El mando no se
  puede simular en Electron: `GamepadSource` se prueba con un `getGamepads`
  falso.

## Risks / Trade-offs

- [Cambiar de `file://` a `app://` cambia el origen de `localStorage`] → no hay
  versión publicada; en desarrollo se pierden ajustes y récord una vez
  (documentado en el Migration Plan).
- [El sonido sintetizado puede sonar pobre o molesto] → recetas en un solo
  catálogo, ajustables sin tocar la arquitectura; revisión de oído del autor
  antes de cerrar.
- [Un botón del mando no cuenta como gesto para el navegador] → en el título
  con mando no hay pantalla completa y la música puede no sonar hasta un clic
  o tecla; en escritorio la pantalla completa es nativa y no depende del gesto.
- [CSP rompe algo que solo ocurre en producción] → la prueba de humo corre
  sobre el build con la CSP aplicada, en local y en CI.
- [Sandbox o fusibles impiden arrancar el empaquetado] → `npm run
  build:desktop:dir` y prueba del ejecutable empaquetado antes de cerrar; los
  fusibles solo afectan al empaquetado, no a `dev:desktop` ni a la prueba de
  humo.
- [La matriz de macOS consume minutos caros de Actions] → solo en
  `release/**`, etiquetas y ejecución manual.
- [Teclas fijas (Esc, Enter, pimienta = confirmar) limitan la libertad de
  reasignación] → es intencionado para no perder nunca el acceso a los menús.
- [Sondeo de `getGamepads()` en cada fotograma] → coste despreciable; solo se
  leen los mandos estándar conectados.
- [El aviso de vertical depende de `pointer: coarse`] → tabletas con teclado
  pueden no verlo; aceptable, la partida sigue siendo jugable.

## Migration Plan

- Ajustes: sin migración (campos aditivos en la versión 1). Instalaciones de
  escritorio de desarrollo pierden ajustes y récord una vez por el cambio de
  origen.
- CI: tras el merge, el autor marca `check`, `version` y `smoke` como
  comprobaciones obligatorias en la protección de `develop/**`.
- Marcha atrás: revertir el merge del PR. Los campos nuevos del registro de
  ajustes los ignora la versión anterior.

## Open Questions

- Recetas exactas de cada efecto (frecuencias, duraciones): se afinan de oído
  durante la implementación sin afectar a specs ni tareas.
- Diseño final del icono: se propone en la implementación y se valida
  visualmente.
