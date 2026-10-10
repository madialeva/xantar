# Proposal

Seguimiento: issue #5 (hito `v1.0.0`). Depende de #2 (núcleo de simulación) y
#4 (pipeline visual), ambos archivados. Recoge los comentarios de la issue: el
fin de nivel continúa solo (revisión de #3) y el selector de tema y el récord
en el HUD (seguimiento de #4). Relacionados: #6 (audio, entrada táctil y
mando), #7 (editor).

## Why

El juego aún funciona como un prototipo: una pantalla de "click para jugar"
que entra directamente en la partida, salir recarga la página entera
(`window.location.href`), perder una vida recoloca a todos en el mismo tick sin
transición, el fin de nivel espera a que se pulse Enter, no hay pausa ni menú,
los textos están fijos en español y nada se guarda entre sesiones. Un juego
completo necesita un flujo de pantallas claro, fases de partida con tiempo
propio (preparado, muerte, nivel completado), pausa, idioma configurable y
persistencia de opciones y récord. Hacerlo ahora, antes de audio (#6) y editor
(#7), les da la estructura en la que encajar.

## What Changes

- **Fases de partida en la simulación** (deterministas, en ticks):
  `ready` (cuenta atrás "¡PREPARADO!" al empezar cada tablero y tras perder
  una vida), `playing`, `dying` (todo se detiene mientras el chef cae
  golpeado), `levelClear` (pausa con el mensaje de nivel completado y
  **continuación automática**, que se puede adelantar con la acción de
  confirmar) y `gameOver`. Sustituyen al estado mínimo actual y se modelan
  como objetos State. La entrada gana la acción `confirm`.
- **Flujo de escenas**: arranque (rasteriza el arte), **título** (el primer
  toque o clic pone pantalla completa y arranca la música), **menú principal**
  (Jugar, Opciones y el récord), **opciones** (idioma y tema), **partida** y
  **HUD como escena paralela** (paneles, mensajes de fase, fin de partida y
  menú de pausa). Volver al menú usa el cambio de escena de Phaser, nunca una
  recarga de página.
- **Pausa**: Esc o P, el botón del panel derecho o perder el foco de la
  ventana pausan la partida; el menú de pausa ofrece Continuar y Salir al
  menú. En pausa no avanza la simulación ni las animaciones.
- **Fin de partida**: muestra la puntuación y, si lo es, "nuevo récord";
  confirmar vuelve al menú principal.
- **Idioma configurable (español e inglés)**: tabla de textos tipada con
  parámetros y plurales, sin librerías; todos los textos de la interfaz salen
  de ella. Idioma inicial según el navegador, guardado entre sesiones y
  seleccionable en Opciones.
- **Opciones y récord persistentes** en `localStorage` (navegador y Electron):
  idioma, tema y mejor puntuación, con tolerancia a datos corruptos o
  antiguos.
- **Tema elegido por el jugador**: opción "Automático" (el del nivel) o un
  tema concreto que se aplica a todos los niveles; `?theme=` en la URL sigue
  mandando sobre todo.
- **HUD**: el panel izquierdo muestra también el récord; el botón del panel
  derecho pasa a ser de pausa.
- **BREAKING (jugabilidad, deliberado)**: perder una vida tiene una fase de
  muerte y otra de preparado antes de seguir; el fin de nivel ya no espera a
  Enter; Enter en el fin de partida lleva al menú en vez de reiniciar.
- **Documentación**: `README.md` (menú, pausa, idiomas), `docs/MANUAL.md`
  (flujo de escenas, fases, recetas para añadir un texto y un idioma) y
  `docs/GAMEDEV_FUNDAMENTALS.md` (máquina de estados y flujo ya
  implementados).

## Capabilities

### New Capabilities

- `game-flow`: escenas del juego (arranque, título, menú, opciones, partida y
  HUD paralelo), transiciones entre ellas, pausa y vuelta al menú sin recargar.
- `localization`: textos de la interfaz en español e inglés desde una tabla
  tipada con parámetros y plurales, detección y cambio de idioma.
- `player-settings`: persistencia de idioma, tema y mejor puntuación, con
  valores por defecto ante datos ausentes, antiguos o corruptos.

### Modified Capabilities

- `simulation-core`: el estado de partida pasa a fases con duración en ticks
  (`ready`, `playing`, `dying`, `levelClear`, `gameOver`) y la entrada incluye
  `confirm`.
- `gameplay-rules`: perder una vida pasa por las fases de muerte y preparado;
  el fin de nivel continúa solo tras una pausa.
- `view-adapter`: las pantallas de fase y de fin de partida se muestran en el
  HUD; el fin de partida vuelve al menú; la paridad con el POC recoge los
  cambios deliberados de flujo.
- `visual-themes`: la selección del tema incluye la opción del jugador entre la
  URL y el nivel.
- `screen-layout`: el HUD muestra el récord y el botón del panel derecho pausa
  en lugar de salir.

## Impact

- **Código**: `src/sim/` (fases como State, `SimInput.confirm`, nuevas
  constantes en ticks, eventos de fase; cambian `Simulation` y sus pruebas);
  nuevos `src/i18n/` y `src/settings/` (puros, con pruebas); nuevas escenas
  `TitleScene` (sustituye a `TapScene`), `MenuScene` y `HudScene`; `GameScene`
  pierde HUD y pantallas; `src/main.ts` crea ajustes, traductor y sesión;
  `chooseTheme` recibe la opción del jugador; escenarios de `npm run smoke`
  adaptados al menú.
- **Dependencias**: ninguna nueva (tabla de textos propia con
  `Intl.PluralRules`, nativo del navegador).
- **Jugabilidad**: cambios deliberados de flujo descritos arriba; reglas,
  velocidades y puntuaciones no cambian. Requiere revisión manual del autor.
- **Fuera de alcance**: idiomas distintos de español e inglés, tabla de
  récords con iniciales, audio y su carga por el cargador de Phaser (#6),
  mando, táctil y reasignación de controles (#6), funciones en línea.
