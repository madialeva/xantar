# Design

## Context

Estado tras #4 (ver `proposal.md` para la motivación):

- `Simulation` tiene `status: 'playing' | 'levelClear' | 'gameOver'`. Perder una
  vida recoloca a chef y enemigos en el mismo tick (`#loseLife`); el fin de
  nivel espera a que la vista llame a `nextLevel()`; `newGame()` reinicia.
  `SimInput` tiene izquierda, derecha, arriba, abajo y pimienta.
- Escenas: `BootScene` (rasteriza el arte de todos los temas) → `TapScene`
  (espera un clic o toque, pide pantalla completa, música con `new Audio`) →
  `GameScene`, que hace casi todo: simulación, entrada, laberinto, vistas,
  efectos, HUD (`HudPanels`), pantallas de fin (`OverlayView`) y salida por
  `window.location.href = 'index.html'`.
- `ChefView` mantiene la animación de golpe con un temporizador de vista de
  700 ms porque la simulación no tiene fase de muerte (decisión de #4).
- Textos fijos en español repartidos por `TapScene`, `BootScene`,
  `GameScene` y `HudPanels`. No hay persistencia.
- Restricciones de `AGENTS.md`: `src/sim/` puro y determinista, objetos con
  estado encapsulado, State/Strategy en lugar de `switch` por tipo,
  inyección por constructor desde la raíz de composición, sin dependencias
  nuevas, pruebas con cada comportamiento de dominio.

## Goals / Non-Goals

**Goals:**

- Dos máquinas de estados bien separadas: las **fases de partida** (reglas,
  deterministas, en la simulación) y el **flujo de la aplicación** (escenas y
  pausa, en la vista).
- `GameScene` vuelve a ser solo el tablero; HUD, mensajes y menús salen a
  escenas y componentes propios.
- Textos, ajustes y elección de tema como lógica pura con pruebas.

**Non-Goals:**

- Idiomas distintos de español e inglés, y traducción de los niveles o de
  `README`/documentación.
- Tabla de récords con iniciales; solo una mejor puntuación.
- Audio con el gestor de sonido de Phaser y su carga por el cargador
  (bloqueado por XHR bajo `file://`), efectos de sonido y volumen: #6. La
  música de título sigue con `new Audio`.
- Mando, controles táctiles en partida y reasignación de teclas (#6). Los
  menús sí aceptan clic y toque.
- Transiciones animadas entre escenas (fundidos), pantalla de créditos y
  opción de salir de la aplicación de escritorio.
- Guardar una partida a medias para continuarla.

## Decisions

### D1. Fases de partida en la simulación, como State

Las fases afectan a las reglas (cuándo se mueve cada cosa, cuándo se
reconstruye el tablero) y a las repeticiones de #8, así que viven en
`src/sim/` y cuentan ticks:

```
          ┌────────── tras 90 ticks ──────────┐
          ▼                                   │
 new ──► ready ──► playing ──contacto──► dying ──vidas > 0──┘
                    │                    │
                    │ todo apilado       └──vidas = 0──► gameOver ──newGame()──► ready
                    ▼
               levelClear ──180 ticks o confirm──► ready (tablero nuevo)
```

- Interfaz `GamePhase` (patrón State) con `readonly name: GamePhaseName` y
  `step(input, game): GamePhase` que devuelve la fase siguiente (o ella misma).
  Implementaciones: `ReadyPhase`, `PlayingPhase`, `DyingPhase`,
  `LevelClearPhase` y `GameOverPhase`, en `src/sim/phases/`. Las de duración
  fija guardan sus ticks restantes.
- `game` es una interfaz estrecha (`PhaseHost`) que `Simulation` implementa con
  lo que las fases necesitan: avanzar el mundo un tick (lo que hoy hace
  `step`), saber si hubo contacto o nivel completado, recolocar personajes,
  reconstruir el tablero y consultar las vidas. Así las fases no conocen las
  entidades.
- `Simulation.step` delega en la fase actual y, si cambia, emite
  `phaseChanged { from, to }`. Se mantienen `chefHit`, `levelCleared`,
  `gameOver` y `boardStarted`, que la vista ya usa.
- `status` se sustituye por `phase` (`GamePhaseName`). Desaparece
  `nextLevel()`; `newGame()` se mantiene y deja la partida en `ready`.
- Duraciones en `rules.ts`: `READY_TICKS = fromMs(1500)`,
  `DYING_TICKS = fromMs(2000)`, `LEVEL_CLEAR_TICKS = fromMs(3000)`.
- `SimInput` gana `confirm` (pulsación puntual, como la pimienta). Solo la usa
  `LevelClearPhase`.
- La prueba de determinismo deja de llamar a `nextLevel()` y comprueba también
  que las fases cambian en los mismos ticks.
- **Alternativa descartada:** temporizadores en la vista para preparado,
  muerte y continuación. No serían deterministas, se desincronizarían de las
  repeticiones y repetirían el error que #2 eliminó.

### D2. Pausa y flujo en la vista, no en la simulación

La pausa no cambia ninguna regla: la simulación simplemente no recibe ticks.
Por eso es un estado de la aplicación:

- Al pausar, `GameScene` llama a `this.scene.pause()`: Phaser deja de llamar a
  su `update` y congela sus tweens y efectos. Al reanudar, `stepper.reset()`
  descarta el tiempo acumulado, de modo que no se recuperan de golpe los ticks
  de la pausa.
- El menú de pausa y sus teclas los gestiona `HudScene`, que sigue activa (una
  escena pausada no procesa entrada).
- Perder el foco (`Phaser.Core.Events.BLUR` y `document.visibilitychange`)
  pausa la partida si está en curso.

### D3. Escenas

```
BootScene ──► TitleScene ──► MenuScene ◄────────────────────┐
                               │  Jugar                      │ salir / fin de partida
                               ▼                             │
                            GameScene ══launch══► HudScene ──┘
```

- `BootScene`: como ahora (rasteriza todos los temas); el texto de carga sale
  de la tabla de textos.
- `TitleScene` (sustituye a `TapScene`): título, "pulsa para empezar"; el
  primer clic, toque o tecla pide pantalla completa (si falla, sigue), arranca
  la música de título y pasa a `MenuScene`. Es también el gesto que exige el
  navegador para el audio, lo que resuelve el caso anotado en #6 de que la
  música de título no sonaba en el móvil.
- `MenuScene`: dos páginas en la misma escena, principal (Jugar, Opciones y
  récord) y opciones (Idioma, Tema y Volver). Jugar detiene la música y
  arranca `GameScene`.
- `GameScene`: simulación, entrada, tablero, vistas y efectos. Al crearse
  lanza `HudScene` en paralelo (`scene.launch`) y al salir la detiene.
- `HudScene`: paneles laterales (`HudPanels`), mensajes de fase y fin de
  partida (`OverlayView` ampliado) y menú de pausa. Usa la misma cámara del
  tablero (`followBoardCamera`) para compartir coordenadas.
- Volver al menú: `this.scene.stop('HudScene')` y `this.scene.start('MenuScene')`;
  no hay recarga de página.

### D4. `GameSession`: el mediador entre partida y HUD (Observer)

`HudScene` no lee la simulación: escucha a un `GameSession` (vista, inyectado
desde `main.ts` en ambas escenas) que publica lo que el HUD necesita:

- Estado: `stats` (snapshot), `phase`, `paused`, `bestScore` (el guardado o el
  actual si es mayor).
- Avisos (Observer, con suscripción tipada): cambios de estado, nuevo récord.
- Órdenes que el HUD pide y `GameScene` ejecuta: `requestPause()`,
  `requestResume()`, `requestQuit()`.

Así ninguna escena conoce a la otra y ambas se prueban o sustituyen por
separado. Se descarta usar el emisor global de Phaser (`game.events`) con
cadenas sueltas: no es tipado y ocultaría las dependencias.

### D5. Componente de menú reutilizable

`MenuList` (vista): lista vertical de opciones con etiqueta (clave de texto) y
acción, selección con flechas/WASD, Enter/Espacio para elegir, Esc para
volver, y clic o toque sobre cada opción. Las opciones de valor (idioma, tema)
muestran su valor y lo cambian con izquierda/derecha o al elegirlas. Lo usan
el menú principal, las opciones y la pausa.

### D6. Tabla de textos tipada sin librerías

`src/i18n/` (puro, con pruebas):

- `catalogs/es.ts` define el catálogo de referencia: cada clave es un texto o
  una función `(params, format) => string`. `catalogs/en.ts` se declara como
  `export const en: Catalog = { ... }` con `type Catalog = typeof es`; el
  compilador detecta claves ausentes, sobrantes o con parámetros distintos.
- `format` ofrece `plural(n, { one, other })` (con `Intl.PluralRules`) y
  `number(n)` (con `Intl.NumberFormat`) para el idioma activo.
- `Translator` (clase): `t(key, ...params)` con los parámetros tipados por
  clave.
- `Localization` (clase, Observer): idioma activo, `setLanguage` y
  suscripción a cambios; las escenas visibles se refrescan al cambiar y
  `main.ts` actualiza `document.documentElement.lang`.
- `detectLanguage(navigatorLanguages)`: `es` si la primera preferencia empieza
  por `es`, si no `en`.
- **Alternativa descartada:** i18next u otra librería (dependencia nueva para
  dos idiomas y unas decenas de textos).

### D7. Ajustes del jugador

`src/settings/` (puro salvo el adaptador de almacenamiento):

- `PlayerSettings` (valor): `{ language, theme: 'auto' | string, bestScore }`.
- `parseSettings(raw, defaults)`: lee el registro campo a campo; versión
  desconocida o JSON roto → valores por defecto; campo no válido → su valor
  por defecto, conservando el resto.
- `SettingsStore` (interfaz): `load(): unknown`, `save(value)`. Implementaciones
  `LocalStorageSettingsStore` (clave `xantar.settings`, con `try/catch` para
  almacenamiento bloqueado) y `MemorySettingsStore` para pruebas.
- `Settings` (clase): valores actuales, `setLanguage`, `setTheme`,
  `submitScore(score): boolean` (guarda y devuelve si es récord); guarda en
  cada cambio.
- Registro: `{ "version": 1, "language": "es", "theme": "auto", "bestScore": 0 }`.
- Electron usa el mismo `localStorage` (persistente por aplicación bajo
  `file://`), sin código específico.

### D8. Elección de tema con la opción del jugador

`chooseTheme({ urlTheme, optionTheme, levelTheme }, themes)`: prioridad URL →
opción (si no es `auto`) → nivel → `classic`. Un tema guardado que ya no existe
genera un aviso con origen "the settings" y se trata como `auto`. El tema se
elige al crear `GameScene`; cambiarlo en Opciones se aplica en la siguiente
partida.

### D9. Entrada en partida

- Movimiento: flechas o WASD. Pimienta: Espacio. Confirmar: Enter o Espacio
  (solo tiene efecto en `levelClear`). Pausa: Esc o P.
- `ChefView` deja el temporizador de 700 ms: el golpe dura lo que dura la fase
  `dying`.
- Fin de partida: `HudScene` muestra la pantalla; Enter, Espacio, clic o toque
  piden `requestQuit()`, que envía la puntuación a `Settings` y vuelve al menú.

### D10. Pruebas de humo

Los escenarios de `tools/smoke/scenarios.ts` pasan por el título (clic) y el
menú (Enter en Jugar) antes de jugar. Se añaden `menu` (capturas del menú y de
las opciones en los dos idiomas) y `pause` (pausar con Esc y capturar).

## Risks / Trade-offs

- [`scene.pause()` congela tweens de la escena pero no los temporizadores
  propios ni `requestAnimationFrame`] → `GameScene` no usa otros relojes; el
  acumulador se reinicia al reanudar (escenario de pausa de 10 s en pruebas de
  humo).
- [Teclas que llegan a la escena equivocada (Esc en `GameScene` pausada)] → la
  reanudación la gestiona solo `HudScene`; `GameScene` solo atiende Esc/P
  mientras está activa.
- [Espacio sirve para pimienta y para confirmar] → confirmar solo actúa en
  `levelClear`, donde la pimienta no tiene efecto; en el fin de partida
  confirma el HUD.
- [Cambio de idioma con escenas abiertas] → los componentes de texto se
  suscriben a `Localization` y se redibujan; las escenas que no están activas
  leen el idioma al crearse.
- [Más ticks sin movimiento (preparado y muerte) cambian el ritmo de juego] →
  duraciones en una sola constante cada una, ajustables tras la revisión del
  autor.
- [La continuación automática deja menos tiempo para ver el tablero
  completado] → se puede adelantar o dejar correr; 3 s ajustables.

## Migration Plan

Los ajustes no existían: el primer arranque crea el registro con valores por
defecto. No hay niveles ni datos que migrar. Marcha atrás: revertir el merge
del PR (el registro `xantar.settings` sobrante en `localStorage` no afecta a la
versión anterior).
