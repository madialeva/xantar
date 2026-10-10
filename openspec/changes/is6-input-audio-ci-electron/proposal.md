# Proposal

Seguimiento: issue #6 (hito `v1.0.0`). Depende de #2 (núcleo de simulación) y
#5 (flujo de escenas, opciones y ajustes), ambos archivados. Recoge los
comentarios de la issue: la música de título en el móvil (ya resuelta en #5 con
el primer gesto), los controles táctiles y el móvil en vertical (seguimiento de
#4) y lo que #5 dejó preparado (entrada de volumen en Opciones, menús con clic y
toque). Relacionados: #14 (publicación web, necesita la CI de este change) y #8
(repeticiones, que se apoyan en la entrada abstracta).

## Why

El juego ya tiene núcleo determinista, flujo de pantallas y ajustes, pero le
falta la base de un desarrollo profesional: la entrada se lee tecla a tecla
dentro de cada escena (sin mando, sin controles táctiles en partida y sin poder
cambiar las teclas), la música suena con un `new Audio(...)` suelto (sin
efectos de sonido, volumen ni silencio), no hay integración continua (nada
comprueba un PR y los instaladores solo se pueden generar para el sistema
propio) y la ventana de Electron no tiene `sandbox`, CSP ni restricciones de
navegación. Este change cierra la arquitectura de la aplicación antes de seguir
añadiendo jugabilidad en la v1.0.0.

## What Changes

- **Entrada por acciones**: las escenas dejan de leer teclas y preguntan por
  acciones (arriba, abajo, izquierda, derecha, pimienta, confirmar, volver,
  pausa, silencio). Tres fuentes combinables: **teclado**, **mando**
  (mapeo estándar: cruceta o stick, A pimienta y confirmar, B volver, Start
  pausa) y **controles táctiles** (cruceta virtual en el panel izquierdo y botón
  de pimienta en el derecho, visibles al usar la pantalla táctil). Los menús se
  manejan también con el mando.
- **Reasignación de teclas**: nueva página **Controles** en Opciones para
  cambiar hasta dos teclas por acción, con intercambio si la tecla ya estaba
  usada, teclas reservadas (Esc, Enter, F11) y "Restaurar". Se guarda en los
  ajustes. El mando usa un mapeo fijo.
- **Móvil siempre en horizontal**: con el móvil en vertical el juego se gira
  solo un cuarto de vuelta y se juega en horizontal, también con la rotación de
  pantalla bloqueada; no se pide girar el dispositivo (cambio tras la revisión
  del autor, que sustituye al aviso de "gira el dispositivo").
- **Audio con el gestor de sonido de Phaser**: canales de **música** y
  **efectos** con volumen propio, silencio global (tecla M y Opciones) y pausa
  al perder el foco. La música de título pasa por el cargador de Phaser.
- **Efectos de sonido sintetizados**: un sintetizador propio (estilo arcade)
  genera los efectos al arrancar a partir de recetas en código, sin ficheros ni
  licencias. Suenan a partir de los eventos de simulación (pimienta, pisar,
  caer, aterrizar, aplastar, aturdir, hamburguesa, golpe, preparado, nivel
  completado, fin de partida) y de los menús.
- **Opciones ampliadas**: Música, Efectos, Sonido (activado o silenciado) y
  Controles, guardados junto al idioma, el tema y el récord.
- **Integración continua (GitHub Actions)**: lint, formato, tipos, pruebas,
  build y prueba de humo en cada PR (no en los push); comprobación de que la
  versión de `package.json` coincide con la rama `develop/**`/`release/**`
  destino del PR;
  instaladores de Linux, Windows y macOS en una matriz de tres sistemas.
- **Endurecimiento de Electron**: el juego se sirve por un protocolo propio
  (`app://`) en lugar de `file://`; `sandbox: true`, CSP, navegación y ventanas
  nuevas bloqueadas, permisos denegados, instancia única, pantalla completa
  nativa con F11, fusibles de Electron, iconos propios y sin la excepción de
  autoplay. Decisión de distribución: instaladores **sin firmar** en la
  v1.0.0, documentado.
- **BREAKING (escritorio)**: al cambiar de `file://` a `app://` cambia el
  origen del almacenamiento local, así que las instalaciones de escritorio de
  desarrollo pierden ajustes y récord una vez. No hay versión publicada
  afectada.
- **Documentación**: `README.md` (mando, táctil, controles, sonido, descargas),
  `docs/MANUAL.md` (entrada, audio, capa Electron, CI y recetas),
  `docs/GAMEDEV_FUNDAMENTALS.md` (mapeo de acciones, buses de audio, síntesis
  de sonido, CI) y `AGENTS.md` (comprobación automática de versión, protocolo
  `app://`).

## Capabilities

### New Capabilities

- `input-controls`: acciones independientes del dispositivo, teclado con
  reasignación, mando, controles táctiles, horizontal forzado en móvil y
  liberación de acciones al perder el foco.
- `audio`: canales de música y efectos, efectos sintetizados, sonidos a partir
  de eventos y de los menús, volumen, silencio y pausa al perder el foco.
- `continuous-integration`: comprobaciones automáticas de cada PR, coherencia
  entre versión y rama, prueba de humo e instaladores para tres sistemas.
- `desktop-shell`: aplicación de escritorio endurecida (protocolo propio,
  aislamiento, CSP, navegación, permisos, instancia única, pantalla completa
  nativa, iconos) y política de firma.

### Modified Capabilities

- `game-flow`: el título arranca también con el mando; los menús se manejan
  con el mando y Opciones gana Música, Efectos, Sonido y Controles; la pausa se
  pide con la acción de pausa (teclado reasignable, Start del mando) o al
  desconectar el mando; el fin de partida se
  confirma también con el mando o el botón táctil.
- `player-settings`: el registro guarda además los volúmenes, el silencio y
  las teclas asignadas, con valores por defecto si faltan o no son válidos.
- `screen-layout`: los paneles laterales alojan los controles táctiles cuando
  se usan.

## Impact

- **Código**: nuevo `src/input/` (puro: acciones, asignaciones, estado de
  acciones, cruceta) y sus adaptadores en `src/view/input/` (teclado, mando,
  táctil); nuevo `src/view/audio/` (mezclador sobre el gestor de Phaser,
  sintetizador puro con pruebas, catálogo de efectos y relación evento → efecto)
  que sustituye a `TitleMusic`; `MenuList`, `TitleScene`, `MenuScene`,
  `GameScene` y `HudScene` leen acciones; nueva página de Controles;
  `PlayerSettings`/`Settings` amplían el registro; `HudPanels` aloja los
  controles táctiles; nuevas claves en los catálogos `es`/`en`;
  `src/view/platform/` pasa a una interfaz `Platform` (web y escritorio);
  `index.html` sin estilos en línea.
- **Electron**: `electron/main.ts` se divide (protocolo, ventana, seguridad) y
  la prueba de humo reutiliza la misma ventana endurecida; `preload.ts` gana
  pantalla completa; `package.json` (`build`) gana iconos, fusibles y firma
  desactivada; nuevo `build/icon.svg` y `build/icon.png`.
- **CI**: nuevos `.github/workflows/ci.yml` y `desktop.yml`, comprobación de
  versión en `tools/ci/`.
- **Dependencias**: ninguna nueva (Phaser Sound, Web Audio, Gamepad API,
  `protocol`/`net` de Electron, fusibles de electron-builder; acciones de
  GitHub oficiales).
- **Jugabilidad**: reglas, velocidades y puntuaciones no cambian; la
  simulación (`SimInput`) no cambia. Requiere revisión manual del autor (sonido,
  mando, táctil en un móvil real e instaladores).
- **Fuera de alcance**: publicación web (#14), firma y notarización de los
  instaladores, publicación automática de versiones en GitHub Releases,
  actualización automática, reasignación de botones del mando, layout vertical
  completo, música durante la partida, comida de bonus (#13) y otras funciones
  de juego nuevas.
