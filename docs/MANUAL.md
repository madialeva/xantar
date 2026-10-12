# Manual de desarrollador — Xantar

Guía completa para desarrollar, compilar y empaquetar el juego **Xantar**: un juego Phaser escrito en TypeScript que se ejecuta en navegador y como aplicación de escritorio (Electron).

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico y versiones](#2-stack-tecnológico-y-versiones)
3. [Requisitos previos](#3-requisitos-previos)
4. [Instalación y primer arranque](#4-instalación-y-primer-arranque)
5. [Estructura del repositorio](#5-estructura-del-repositorio)
6. [Comandos disponibles](#6-comandos-disponibles)
7. [Flujo de trabajo](#7-flujo-de-trabajo)
8. [Arquitectura](#8-arquitectura)
9. [Recetas para tareas comunes](#9-recetas-para-tareas-comunes)
10. [Build y empaquetado](#10-build-y-empaquetado)
11. [Convenciones de TypeScript](#11-convenciones-de-typescript)
12. [Solución de problemas](#12-solución-de-problemas)
13. [Notas sobre Phaser 3 vs Phaser 4](#13-notas-sobre-phaser-3-vs-phaser-4)
14. [Entorno de desarrollo en VS Code](#14-entorno-de-desarrollo-en-vs-code)
15. [Próximos pasos](#15-próximos-pasos)

---

## 1. Visión general

Xantar es un único proyecto que produce **dos artefactos** a partir del mismo código:

- **Web**: una app estática (`dist/`) que se sirve en cualquier navegador.
- **Escritorio**: un envoltorio **Electron** que carga ese mismo `dist/` dentro de una ventana nativa y que se empaqueta con **electron-builder** en instaladores `.AppImage`, `.exe`/`.dmg`, etc.

El código del juego no cambia entre ambos destinos; solo cambia el envoltorio. La lógica de escritorio vive exclusivamente en la carpeta `electron/`.

Estado actual del juego: un juego de una sola pantalla con un nivel clásico, inspirado en **BurgerTime** (1982). El recorrido es arranque → título → menú (con opciones de idioma y tema) → partida; `GameScene` ejecuta el núcleo de simulación (`src/sim/`: chef, ingredientes de segmentos que se pisan y caen, enemigos, pimienta, puntuación, vidas y fases de partida) y lo dibuja, y `HudScene` muestra a su lado los paneles, los mensajes y la pausa (ver 8.8). La hoja de ruta está en el README y en las issues de GitHub.

Si los conceptos de desarrollo de juegos (bucle de juego, paso fijo, HUD, rig, filtros, tipos de assets…) son nuevos para ti, empieza por [`GAMEDEV_FUNDAMENTALS.md`](GAMEDEV_FUNDAMENTALS.md): los explica para principiantes y los relaciona con este proyecto.

---

## 2. Stack tecnológico y versiones

| Tecnología | Versión | Función |
|-----------|---------|---------|
| **Node.js** | >=22.12 (desarrollo con 24 LTS, ver `.nvmrc`) | Entorno de desarrollo y build |
| **TypeScript** | ^7.0.2 | Lenguaje tipado; compilador nativo (`tsc`) para comprobar tipos |
| **Phaser** | ^4.2.1 | Motor de juego |
| **Vite** | ^8.3 | Servidor de desarrollo, bundler y build web |
| **Vitest** | ^5.0 | Pruebas unitarias del núcleo de simulación |
| **Oxlint** + **oxlint-tsgolint** | ^1.86 / ^7.0 | Linter con reglas con información de tipos (sobre el compilador de TS 7) |
| **Prettier** | ^3.9 | Formato del código |
| **Electron** | ^44.5 | Contenedor de escritorio (Chromium + Node) |
| **electron-builder** | ^26.15.3 | Generación de instaladores |
| **esbuild** | ^0.28.2 | Compila el proceso principal de Electron |
| **concurrently** | ^10.0.5 | Lanza Vite + Electron a la vez en desarrollo |
| **wait-on** | ^9.5 | Espera a que el servidor de Vite esté listo antes de abrir Electron |
| **cross-env** | ^10.1.0 | Variables de entorno multiplataforma |
| **@types/node** | ^26.6 | Tipos de Node para el proceso Electron |

---

## 3. Requisitos previos

- **Node.js** 22.12 o superior (incluye `npm`). Se desarrolla con Node 24 LTS: el fichero `.nvmrc` lo fija para `nvm use`.
- Un **navegador moderno** (Chrome, Firefox, Edge o Safari recientes).
- Opcional: en Linux, `xvfb` si vas a ejecutar Electron en un entorno sin pantalla (por ejemplo CI).

Comprueba tu entorno:

```bash
node -v
npm -v
```

---

## 4. Instalación y primer arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar en modo web (navegador)
npm run dev
# abre http://localhost:5173

# 3. Arrancar en modo escritorio (Vite + ventana Electron)
npm run dev:desktop
```

> **Importante:** no abras `index.html` haciendo doble clic. La entrada apunta a `/src/main.ts` y necesita el servidor de Vite. Para probar un build de producción usa `npm run build` y luego `npm run preview`.

---

## 5. Estructura del repositorio

```
xantar/
├── .github/workflows/           # Integración continua (ver 10.4)
│   ├── ci.yml                   # Comprobaciones de cada PR (versión y prueba de humo incluidas)
│   └── desktop.yml              # Instaladores de Linux, Windows y macOS
├── electron/                    # Proceso principal de Electron (no va al renderer)
│   ├── main.ts                  # Ciclo de vida: instancia única, IPC, ventana (dev server o app://)
│   ├── window.ts                # Ventana endurecida (sandbox, navegación, permisos, F11)
│   ├── appProtocol.ts           # Protocolo app:// que sirve dist/
│   ├── appPath.ts               # Rutas y sitios de app:// (puro, con pruebas)
│   ├── channels.ts              # Nombres de los canales IPC
│   └── preload.ts               # Puente mínimo renderer ↔ main (contextBridge)
├── build/                       # Recursos de empaquetado: icon.svg (fuente) e icon.png (generado)
├── public/                      # Assets estáticos: se copian TAL CUAL a dist/
│   └── music/
│       └── tap-back.mp3
├── scripts/
│   ├── build-electron.mjs       # Compila electron/*.ts -> dist-electron/ (CJS)
│   ├── build-icon.mjs           # Rasteriza build/icon.svg a build/icon.png (npm run icon)
│   ├── publish-site.mjs         # Publica el build web en la web personal (npm run publish:site)
│   └── smoke.mjs                # Lanzador de la prueba de humo (compila tools/smoke y abre Electron)
├── tools/                       # Herramientas de desarrollo (no van en la build publicada)
│   ├── smoke/                   # Prueba de humo en Electron: pasos, escenarios y proceso principal
│   ├── ci/                      # Comprobación de versión frente a la rama (CI)
│   └── art-sheet.html           # Lámina de arte (se abre con npm run dev)
├── src/                         # Código del juego (renderer)
│   ├── main.ts                  # Punto de entrada: config de Phaser + new Phaser.Game()
│   ├── config.ts                # Solo de la vista: tamaño de tile, rejilla y nivel de escala de dibujo
│   ├── sim/                     # Núcleo de simulación (TypeScript puro, sin Phaser ni DOM)
│   │   ├── Simulation.ts        # Agregado raíz: orquesta el tick, órdenes y estado de solo lectura
│   │   ├── GameStats.ts         # Puntos, vidas, pimientas, nivel y combo
│   │   ├── rules.ts             # Constantes de reglas en tiles y ticks
│   │   ├── rng.ts, events.ts, stepper.ts, geometry.ts, SimInput.ts
│   │   ├── level/               # Documento JSON, registro de piezas, ensamblado, Level y validación
│   │   ├── nav/                 # Grafo de navegación, NavPlace y camino más corto
│   │   ├── entities/            # Chef, Enemy (+ EnemyBrain), Ingredient, IngredientField, Plate, pepper
│   │   ├── phases/              # Fases de partida (State): ready, playing, dying, levelClear, gameOver
│   │   └── testing/             # Niveles (cuadrículas) y dobles de prueba compartidos por los tests
│   ├── levels/
│   │   └── classic.level.json   # Nivel clásico en el formato de nivel v1
│   ├── devtools/                # Código de la lámina de arte (ArtSheetScene)
│   ├── i18n/                    # Textos por idioma: catálogos es/en, Translator, Localization
│   ├── settings/                # Ajustes del jugador (idioma, tema, récord, sonido, teclas) y su almacenamiento
│   ├── input/                   # Acciones, asignaciones de teclas, estado por fotograma y cruceta (puro)
│   ├── objects/                 # Vistas Phaser (sin lógica): ChefView, EnemyView, IngredientView
│   ├── view/                    # Pipeline visual (ver 8.7)
│   │   ├── art/<tema>/*.svg     # Fuentes SVG de cada tema (se incluyen en el bundle como texto)
│   │   ├── theme/               # Paleta, catálogo de gráficos, temas y su selección (puro)
│   │   ├── themes/              # Paletas de los temas y registro (createThemeRegistry)
│   │   ├── raster/              # SvgRasterizer (SVG -> textura) y ArtFactory (imágenes a escala)
│   │   ├── layout/              # computeLayout (tablero + paneles) y cámara del tablero
│   │   ├── board/               # MazeView: fondo, escaleras, plataformas, cruces y platos
│   │   ├── hud/                 # HudPanels (paneles laterales), OverlayView (fin de nivel/partida) y TouchControls
│   │   ├── fx/                  # EventEffects: adornos breves para eventos de la simulación
│   │   ├── rigs/                # Personajes por partes: rigs, animador y estados de animación
│   │   ├── session/             # GameSession: mediador entre la partida y el HUD
│   │   ├── ui/                  # MenuList, ControlsPage (menús por acciones y puntero) y pantalla completa
│   │   ├── input/               # ActionInput y fuentes: teclado, mando, táctil; InputModality
│   │   ├── platform/            # Platform (web o escritorio) y ForcedLandscape (horizontal en móvil)
│   │   └── audio/               # GameAudio (buses, silencio), EventSounds, mezcla y synth/ (efectos sintetizados)
│   └── scenes/
│       ├── BootScene.ts         # Rasteriza el arte de todos los temas y pasa al título
│       ├── TitleScene.ts        # Título: primer gesto -> pantalla completa, música y menú
│       ├── MenuScene.ts         # Menú principal (Jugar, Opciones, récord) y opciones
│       ├── GameScene.ts         # Tablero: ejecuta la simulación a paso fijo y la dibuja
│       └── HudScene.ts          # En paralelo a la partida: paneles, mensajes de fase, pausa
├── docs/
│   ├── GAMEDEV_FUNDAMENTALS.md  # Fundamentos del desarrollo de juegos (para principiantes)
│   ├── MANUAL.md                # Este manual de desarrollador
│   └── STYLE_GUIDE.md           # Guía de estilo visual (paleta, trazo, convención de los SVG)
├── .vscode/
│   ├── extensions.json          # Extensiones recomendadas del workspace
│   └── settings.json            # Formato y lint al guardar
├── index.html                   # Plantilla HTML de Vite (carga /src/main.ts)
├── package.json                 # Dependencias, scripts y config de electron-builder
├── tsconfig.json                # Config TS del renderer (DOM)
├── tsconfig.electron.json       # Config TS del proceso Electron (Node)
├── vite.config.ts               # Config de Vite (base relativa, puerto, etc.)
├── .oxlintrc.json               # Configuración de Oxlint (reglas y fronteras de src/sim)
├── .nvmrc                       # Versión de Node de desarrollo
├── .prettierrc.json             # Reglas de estilo de Prettier
├── .prettierignore              # Exclusiones de Prettier
├── .editorconfig                # Convenciones básicas de editor
└── .gitignore                   # Ignora node_modules/, dist/, dist-electron/, release/, .smoke/
```

**Directorios generados (no editar, están en `.gitignore`):**

| Directorio | Lo genera | Contenido |
|------------|-----------|-----------|
| `dist/` | `npm run build` | Web compilada (HTML + JS + assets) |
| `dist-electron/` | `npm run build:electron` | `main.js` y `preload.js` (CommonJS) |
| `release/` | `electron-builder` | Instaladores y app empaquetada |
| `node_modules/` | `npm install` | Dependencias |

---

## 6. Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor web de desarrollo con recarga en caliente |
| `npm run dev:desktop` | Compila Electron y lanza Vite + ventana Electron con recarga |
| `npm run build` | Comprueba tipos (renderer) y genera la web en `dist/` |
| `npm run preview` | Sirve `dist/` para probar el build de producción web |
| `npm run publish:site` | Compila la web y la publica en la web personal (`src/js/xantar/` y `deploy.sh` del repositorio `madialeva.github.io`; ver 9.4) |
| `npm run build:electron` | Compila `electron/*.ts` -> `dist-electron/` |
| `npm run build:desktop` | Typecheck + build web + Electron + instaladores en `release/` |
| `npm run build:desktop:dir` | Igual, pero sin instalador (app desempaquetada, más rápido) |
| `npm run typecheck` | Comprueba tipos del renderer **y** del proceso Electron |
| `npm run lint` | Analiza el código con Oxlint (reglas con tipos) |
| `npm run lint:fix` | Oxlint corrigiendo lo que pueda automáticamente |
| `npm run test` | Ejecuta las pruebas unitarias (Vitest) |
| `npm run test:watch` | Vitest en modo observador |
| `npm run format` | Formatea todo el código con Prettier |
| `npm run format:check` | Comprueba el formato sin modificar ficheros (ideal para CI) |
| `npm run smoke` | Compila la web y Electron y ejecuta la prueba de humo (capturas y consola en `.smoke/`) |
| `npm run icon` | Regenera `build/icon.png` a partir de `build/icon.svg` |
| `npm run check:version` | Comprueba que la versión de `package.json` coincide con la rama o etiqueta de la CI (`GITHUB_REF_NAME`, `GITHUB_BASE_REF`) |

---

## 7. Flujo de trabajo

### 7.1 Desarrollo web

1. Editar ficheros en `src/`.
2. `npm run dev` → Vite recarga el navegador automáticamente.
3. Al terminar, `npm run build` y comprobar con `npm run preview`.

### 7.2 Desarrollo de escritorio

1. Editar ficheros en `src/` (renderer): Electron los recarga igual que el navegador.
2. Editar ficheros en `electron/` (main/preload): **reiniciar** `npm run dev:desktop` (no hay recarga automática del proceso principal con este setup).
3. Para probar el empaquetado real: `npm run build:desktop:dir` (rápido) o `npm run build:desktop` (instaladores).

> En `dev:desktop` los mensajes de Vite y Electron se mezclan en la misma consola, prefijados con `[0]` (Vite) y `[1]` (Electron). Al cerrar la ventana de Electron, `concurrently` detiene también Vite.

---

## 8. Arquitectura

### 8.1 Entrada web

- `index.html` solo define el `body` y carga el módulo:

  ```html
  <script type="module" src="/src/main.ts"></script>
  ```

- `src/main.ts` es la **raíz de composición**: crea el registro de temas, lee `?theme=` de la URL, carga los ajustes del jugador, crea la localización, la plataforma (web o escritorio), la entrada (`ActionInput` con teclado, mando y táctil), el audio (`GameAudio`), la sesión de partida y `ForcedLandscape` (que gira el juego en un móvil en vertical), calcula el tamaño del área de juego con `computeLayout` y construye las escenas pasándoles sus dependencias por constructor (Phaser acepta instancias de escena en `config.scene`). Lo esencial:

  ```ts
  const settings = new Settings(
    new LocalStorageSettingsStore(browserStorage()),
    defaultSettings(detectLanguage(navigator.languages))
  );
  const audio = new GameAudio(settings.values, () => performance.now());
  settings.subscribe((values) => audio.apply(values));
  const keyboard = new KeyboardSource(window, document, settings.keyBindings);
  const input = new ActionInput([keyboard, gamepad, touchPad]);
  // ...
  scene: [
    new BootScene({ themes, tier, localization, audio }),
    new TitleScene({ tier, localization, audio, themes, platform, input }),
    new MenuScene({ tier, localization, settings, themes, audio, platform, input, keyboard, keyLayout }),
    new GameScene({ themes, urlTheme, tier, session, settings, input, sounds: audio, interruptions }),
    new HudScene({ tier, localization, session, themes, input, touchPad, modality, sounds: audio.ui })
  ];
  // Una vez por fotograma, antes de las escenas: entrada y tecla de silencio.
  game.events.on(Phaser.Core.Events.PRE_STEP, (time: number) => {
    input.update(time);
    if (input.justPressed('mute')) settings.setMuted(!settings.muted);
  });
  ```

  Al cambiar el tamaño de la ventana (agrupado con `requestAnimationFrame`) vuelve a calcular el layout y llama a `game.scale.setGameSize`.

El juego trabaja en **unidades lógicas**: el tablero mide 640×480 (20×15 casillas de 32, `src/config.ts`) y nunca cambia de coordenadas. El área de juego mide 480 de alto y entre 832 y 1152 de ancho según la proporción de la ventana; lo que sobra a los lados del tablero son los paneles del HUD. El lienzo se crea a ese tamaño multiplicado por el **nivel de escala** (`RENDER_TIER`, 2) y la cámara de cada escena aplica ese zoom (ver 8.7), así que se ve nítido en pantallas grandes sin tocar coordenadas.

### 8.2 Escenas de Phaser

Cada escena es una clase que extiende `Phaser.Scene` y se exporta por defecto:

```ts
import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor(deps: TitleSceneDependencies) {
    super({ key: 'TitleScene' });
  }

  create(): void { /* ... */ }
}
```

Ciclo de vida habitual:

| Método | Cuándo se ejecuta | Uso |
|--------|-------------------|-----|
| `preload()` | Antes de `create` | Cargar assets |
| `create()` | Una vez al arrancar la escena | Crear objetos, input, tweens |
| `update(time, delta)` | Cada frame mientras la escena está activa | Lógica de juego |

Para cambiar de escena: `this.scene.start('GameScene')`; para lanzar otra en paralelo: `this.scene.launch('HudScene', datos)`.

**Flujo actual** (detalle en 8.8):

```
index.html -> src/main.ts -> BootScene (carga la música, sintetiza los efectos, rasteriza los temas) -> TitleScene
TitleScene --(clic, toque, tecla o botón del mando)--> pantalla completa + música -> MenuScene
MenuScene --Jugar--> GameScene ══launch══> HudScene
GameScene --(salir desde la pausa o fin de partida)--> MenuScene   (sin recargar la página)
```

La música de título y menú y los efectos suenan con el gestor de sonido de Phaser a través de `GameAudio` (ver 8.10); la música arranca con el primer gesto del jugador en el título, que es lo que exige el navegador.

### 8.3 Assets y la carpeta `public/`

Todo lo que esté en `public/` se copia sin procesar a la raíz de `dist/`. Por eso los assets se referencian con rutas **relativas a la raíz**:

```
public/assets/foto.png     ->  dist/assets/foto.png     ->  'assets/foto.png'
public/music/tap-back.mp3  ->  dist/music/tap-back.mp3  ->  'music/tap-back.mp3'
```

Ventajas de `public/`:

- No hace falta importarlos en el código.
- Mantienen la misma ruta en desarrollo, en web de producción y en Electron.

La aplicación de escritorio sirve `dist/` por el protocolo propio `app://xantar/` (ver 8.4), así que el cargador de Phaser funciona igual que en la web, también por `XHR` (audio, JSON). `src/main.ts` mantiene `loader.imageLoadType: 'HTMLImageElement'`: es inofensivo y fue imprescindible mientras Electron cargaba el juego desde `file://`, donde `XHR` está bloqueado.

**Excepción: el arte SVG no vive en `public/`.** Las fuentes SVG de los temas están en `src/view/art/<tema>/` y se importan como texto (`import.meta.glob` con `?raw`), de modo que viajan dentro del bundle y el juego puede inyectarles la paleta del tema antes de rasterizarlas (ver 8.7).

### 8.4 Capa Electron

El proceso principal está repartido en módulos pequeños:

| Fichero | Qué hace |
|---------|----------|
| `electron/main.ts` | Ciclo de vida: instancia única, IPC, crea la ventana y la carga |
| `electron/appPath.ts` | Puro (con pruebas): `APP_URL`, `resolveAppPath` (URL `app://` → fichero de `dist/`, o `null` si sale de él) y `siteOf` |
| `electron/appProtocol.ts` | Registra `app://` como esquema estándar y seguro y lo sirve desde `dist/` con `net.fetch` (404 fuera de `dist/`) |
| `electron/window.ts` | `createGameWindow`: la ventana endurecida, y `senderWindow` para validar el emisor de un IPC |
| `electron/channels.ts` | Nombres de los canales IPC (`app:quit`, `window:set-fullscreen`) |
| `electron/preload.ts` | Puente mínimo `window.xantar` hacia la página |

**Protocolo `app://`.** En producción el juego se carga en `app://xantar/index.html`, no con `file://`. Así tiene un origen estable y estándar: el cargador de Phaser (XHR) funciona, la CSP puede usar `'self'` y `localStorage` tiene un origen propio. En desarrollo (`VITE_DEV_SERVER_URL`) se carga el servidor de Vite.

**Ventana endurecida** (`createGameWindow`, que usan la aplicación y la prueba de humo):

- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`: la página no tiene `require` ni `process`.
- `will-navigate` y `will-redirect` cancelan cualquier navegación fuera del sitio del juego (`app://xantar` o el servidor de Vite); `setWindowOpenHandler` deniega ventanas nuevas y `will-attach-webview` se cancela.
- Todas las solicitudes y consultas de permisos de la página se deniegan.
- F11 (en `before-input-event`) alterna la pantalla completa **nativa** de la ventana. Esc queda libre para el juego.

**Proceso principal:** pide el bloqueo de instancia única (`requestSingleInstanceLock`; una segunda apertura enfoca la ventana existente y termina) y atiende dos mensajes IPC, solo si vienen de una página del sitio del juego: `app:quit` (`app.quit()`) y `window:set-fullscreen` (con un booleano). No hay excepción de autoplay: el audio arranca con el primer gesto, igual que en la web.

**`electron/preload.ts`** expone una API mínima mediante `contextBridge` (en un preload con sandbox solo están `contextBridge`, `ipcRenderer` y un `process` reducido):

```ts
contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform,
  quit: (): void => ipcRenderer.send(CHANNELS.quit),
  setFullScreen: (on: boolean): void => ipcRenderer.send(CHANNELS.setFullScreen, on === true)
});
```

**La plataforma en el juego.** El juego no lee `window.xantar` directamente: `createPlatform(window)` (`src/view/platform/Platform.ts`, patrón Strategy) devuelve una `Platform` con `quit` (o `null` si no hay adónde salir) y `enterFullscreen`. `WebPlatform` usa la API de pantalla completa del navegador (con bloqueo de Esc) y, como `quit`, vuelve a la página de origen: la función pura `returnUrl(document.referrer, location.href)` solo la acepta si es de la misma origin y no es el propio juego, y salir hace `history.back()` (o `location.assign` si la pestaña no tiene historial). Sin página de origen (dirección escrita, servidor de desarrollo, enlace de otro sitio) `quit` es `null`. `DesktopPlatform` usa la pantalla completa nativa y cierra la aplicación por el puente. `main.ts` la inyecta en `TitleScene` y `MenuScene`, que solo muestra **Salir** cuando `quit` existe. Cualquier otra comunicación con el sistema operativo (guardar partida, abrir diálogos, etc.) debe pasar también por un canal IPC validado.

**Política de seguridad de contenidos (CSP).** El build web (y por tanto el de escritorio) lleva una etiqueta `<meta http-equiv="Content-Security-Policy">` que inserta un plugin de `vite.config.ts` solo al compilar: scripts, estilos y datos del propio origen, `data:` y `blob:` donde el juego los genera (rasterizado de SVG, audio) y nada de objetos incrustados ni `eval`. Por eso `index.html` no tiene estilos en línea (`src/styles.css`). En `npm run dev` no se aplica, porque Vite necesita scripts en línea; Electron muestra entonces el aviso *Insecure Content-Security-Policy*, que no aparece en el empaquetado. La prueba de humo falla ante cualquier violación (la detecta por el protocolo de DevTools).

**Compilación**: `scripts/build-electron.mjs` usa esbuild para convertir `electron/*.ts` a CommonJS en `dist-electron/` y genera un `dist-electron/package.json` con `{"type":"commonjs"}`. Esto es necesario porque el `package.json` raíz es ESM (`"type": "module"`) y Electron carga `main.js` como CommonJS.

### 8.5 El juego actual (tipo BurgerTime)

**Arquitectura: núcleo y vista.** Las reglas viven en `src/sim/`, que es TypeScript puro y no depende de Phaser, del DOM ni de Node (Oxlint lo impide en `.oxlintrc.json`). La capa de Phaser (`src/scenes`, `src/objects`) solo presenta: lee el estado de la simulación, recoge la entrada y reacciona a sus eventos. Las dependencias van siempre de la vista al núcleo.

- **Paso fijo.** `GameScene` alimenta un `FixedStepper` con el tiempo de cada fotograma y ejecuta en `Simulation` el número de *ticks* resultante (60 por segundo, con un máximo por fotograma). El resultado no depende del framerate. La vista interpola entre el estado de los dos últimos ticks (`prevX`/`prevY` y `alpha`).
- **Unidades lógicas.** El núcleo trabaja en tiles (1 unidad = 1 tile) y ticks. La vista convierte a píxeles con `TILE` (`src/config.ts`). Una entidad sobre la fila `r` está en `y = r`; la línea de plataforma en `y = r + 0,5`; el centro de la columna `c` en `x = c + 0,5`.
- **Nivel como datos.** `Simulation` recibe un `Level` cargado con `loadLevel(documento)`; el documento es un JSON versionado (ver 8.6). `src/levels/classic.level.json` es el nivel actual (4 plataformas a todo el ancho, escaleras en las columnas 0, 9, 10 y 19, 4 ingredientes por plato y 4 platos). `loadLevel` ensambla el nivel con el registro de piezas, deriva el grafo de navegación y, por defecto, rechaza los niveles con errores de jugabilidad (`validateLevel`).
- **Eventos.** `Simulation.step(input)` devuelve los `SimEvent` del tick (`ingredientLanded`, `enemySquashed`, `burgerDone`, `chefHit`, `levelCleared`, `gameOver`, `phaseChanged`…). La vista los traduce a efectos (destello, nube de pimienta, mensajes de fase) y, más adelante, a sonido.
- **Aleatoriedad.** Se inyecta un `Rng` (`SeededRng`, con semilla). Con la misma semilla y la misma secuencia de entradas, la partida es idéntica.

**Modelo de objetos del núcleo** (`src/sim/`):

- `Simulation`: agregado raíz. Lo que hace cada tick depende de la **fase de partida** (`phase`: `ready`, `playing`, `dying`, `levelClear`, `gameOver`; ver 8.8). En `playing` ejecuta chef → ingredientes → enemigos → pimienta → contacto. Órdenes: `startBoard` y `newGame`.
- **Grafo de navegación** (`src/sim/nav/`): se deriva del nivel y tiene tramos de plataforma (`PlatformEdge`) y de escalera (`LadderEdge`) unidos en los cruces. La posición de chef y enemigos es un `NavPlace` (arista + desplazamiento); `graph.shortestPath` calcula el camino más corto y `graph.reachableFrom` la alcanzabilidad.
- `Chef`: camina por su tramo de plataforma y se engancha a una escalera a ≤ 0,6 casillas del cruce. Sobre la escalera solo se mueve mientras pulsas arriba o abajo y puede parar e invertir en cualquier punto; a 0,4 casillas o menos de una plataforma, pulsar izquierda o derecha le hace pasar a ella. En plataforma, la entrada lateral tiene prioridad sobre engancharse a una escalera.
- `Enemy` + `EnemyBrain` (Strategy): tres tipos (`hotdog`, `pickle`, `egg`) que hoy comparten `ChaseBrain`, que usa el camino más corto del grafo hacia el chef (en el mismo tramo de plataforma lo persigue en horizontal). Tiene aturdimiento, aplastamiento y reaparición en los marcadores de enemigo del nivel.
- `Ingredient` (State: `idle`, `waiting`, `falling`, `stacked`) con sus segmentos pisables, `IngredientField` (pisado, cadena de caídas, aterrizajes) y `Plate` (apilado y finalización de la hamburguesa).

**Mecánica principal:**

1. Cada ingrediente tiene tantos segmentos como indique el nivel (`segments`: 2, 3 o 4). El chef **pisa** un segmento al entrar en su casilla caminando por la plataforma (no desde una escalera); los segmentos pisados se quedan pisados. Con todos pisados, el ingrediente se activa.
2. El ingrediente cae hasta el primer soporte por debajo (plataforma o plato bajo cualquiera de sus casillas). Los ingredientes inmóviles de esa fila que solapan alguna de sus casillas son **golpeados** y caen también, recursivamente: el más bajo primero y con 7 ticks entre cada uno. Solo cae lo que se golpea.
3. Un ingrediente que empieza a caer aplasta a los enemigos de sus casillas entre la fila de origen y la de destino; reaparecen a los 150 ticks (2,5 s) en uno de los marcadores de enemigo del nivel.
4. Cuando han **aterrizado** en un plato todos los ingredientes que acaban en él (el destino se calcula al cargar el nivel), la hamburguesa se completa (+400 puntos y +1 pimienta). Al completar todos los platos se sube de nivel.
5. Cada ingrediente activado da 50 puntos; aplastar enemigos da 100 x combo.

**Controles**:

| Acción | Tecla |
|--------|-------|
| Moverse / subir-bajar escaleras (en la escalera solo te mueves mientras pulsas arriba o abajo) | Flechas o `WASD` |
| Lanzar pimienta | `Espacio` |
| Adelantar el fin de nivel | `Enter` o `Espacio` |
| Pausar y reanudar | `Esc`, `P` o el botón de pausa del panel |
| Volver al menú tras *GAME OVER* | `Enter`, `Espacio`, clic o toque |

**Vidas y fin de partida**: 3 vidas. Tocar un enemigo no aturdido resta una vida: el chef cae (fase `dying`, 2 s), todos vuelven a su sitio y hay un nuevo *¡PREPARADO!* (1,5 s); los ingredientes no se tocan. Al llegar a 0 aparece *GAME OVER* con la puntuación y, si lo es, *¡NUEVO RÉCORD!*; confirmar vuelve al menú.

**Pendiente / ideas**: alimentos de bonus (helado, café, patatas), más enemigos, efectos de sonido y controles táctiles en partida.

### 8.6 Formato de nivel y registro de piezas

Un nivel es un documento JSON versionado (`src/sim/level/`). Se lee con `parseLevelJson` o `parseLevelDocument`, se escribe con `serializeLevel` (una cadena por fila, apta para `git diff`) y se carga con `loadLevel`:

```json
{
  "format": "xantar-level",
  "version": 1,
  "name": "Classic",
  "cols": 20,
  "rows": 15,
  "segments": 4,
  "theme": "classic",
  "layers": {
    "structure":   ["....", "+==+", "H..H", "+==+", ".__."],
    "ingredients": ["....", ".TT.", "....", ".BB.", "...."],
    "actors":      ["....", "....", "....", ".C..", "...."]
  }
}
```

(Ejemplo abreviado: cada capa tiene `rows` cadenas de `cols` caracteres.) `segments` es opcional (2, 3 o 4; 4 por defecto): fija el número de segmentos de cada ingrediente y el ancho en casillas de ingredientes y platos, para pantallas de minihamburguesas.

`theme` también es opcional: es el id del tema visual con que se dibuja el nivel (minúsculas, cifras y guiones, empezando por letra; por ejemplo `classic` o `midnight`). La simulación no lo usa y la carga no comprueba que el tema exista: si la vista no lo conoce, avisa por consola y usa el tema por defecto. `serializeLevel` lo escribe tras `segments` solo si está presente.

| Capa | Símbolo | Pieza |
|------|---------|-------|
| `structure` | `.` `=` `H` `+` `_` | vacío, plataforma, escalera, cruce (plataforma con escalera), plato |
| `ingredients` | `T` `L` `P` `B` | pan superior, lechuga, carne, pan inferior |
| `actors` | `C` `h` `p` `e` | inicio del chef, aparición de perrito, pepinillo y huevo |

Reglas: una racha de casillas iguales de una pieza ancha (ingredientes y platos) se divide en unidades del tamaño `segments`; un segmento de ingrediente necesita casilla de plataforma debajo; los marcadores de enemigo son también los puntos de reaparición. Los errores estructurales lanzan `LevelError` con capa, fila y columna. Además, `validateLevel` informa de incidencias de jugabilidad (`ingredient-unreachable`, `ingredient-no-plate`, `ladder-dangling`, `no-ingredients` como errores; `plate-empty`, `platform-unreachable`, `spawn-unreachable` como avisos) y `loadLevel` rechaza por defecto los niveles con errores (`requirePlayable: false` los acepta, para el futuro editor).

Cada símbolo lo define una `PieceDefinition` (id, símbolo, capa, ancho y qué aporta al nivel) del `PieceRegistry`. Las piezas no contienen nada gráfico.

### 8.7 Pipeline visual: SVG, temas, nivel de escala y layout

Todo lo que se ve sale de **fuentes SVG** que siguen la guía de estilo (`docs/STYLE_GUIDE.md`):

1. **Catálogo** (`src/view/theme/graphics.ts`): lista cerrada de `GraphicId` (`platform.left`, `bunTop.mid`, `chef.hat`, `fx.pepper`, `hud.life`…) con su tamaño lógico. Las piezas usan el id del registro de piezas como prefijo.
2. **Fuentes** (`src/view/art/<tema>/<graphicId>.svg`): sin colores literales; cada forma usa clases `f-<token>`, `s-<token>` o `c-<token>` de la paleta. `src/view/art/art.test.ts` comprueba todas las fuentes de todos los temas con `svgProblems`.
3. **Temas** (`src/view/theme/Theme.ts`, `ThemeRegistry.ts`, `src/view/themes/`): un tema es una paleta parcial más fuentes SVG para algunos gráficos. `ThemeRegistry.resolve(id)` completa lo que falta con el tema por defecto, `classic`, que debe estar completo.
4. **Selección** (`chooseTheme`): al empezar un tablero se usa el tema de `?theme=` en la URL, si no el campo `theme` del nivel y si no `classic`. Los ids desconocidos se saltan con un aviso en consola que dice de dónde venían.
5. **Rasterizado** (`BootScene` + `SvgRasterizer`): al arrancar, cada gráfico de cada tema registrado se convierte en textura con clave `<tema>/<graphicId>`: `applyPalette` inserta un `<style>` con los colores del tema, `withSize` fija el tamaño al lógico × `RENDER_TIER`, se decodifica como imagen y se dibuja en un canvas que pasa a ser la textura. Si falla, la textura es un damero magenta y la consola dice qué gráfico de qué tema.
6. **Dibujo** (`ArtFactory`): crea imágenes de un tema con escala `1 / RENDER_TIER`, de modo que una textura de 64 px ocupa una casilla de 32 unidades.
7. **Cámara y layout** (`followBoardCamera`, `computeLayout`): cada escena aplica a su cámara principal zoom `RENDER_TIER` y la centra en el centro del tablero; el tablero ocupa (0,0)–(640,480) en el mundo, el panel izquierdo queda en `x < 0` y el derecho en `x ≥ 640`. Al redimensionar, la cámara se recoloca y la escena recibe el nuevo ancho lógico.

Para pasar a 4× basta con cambiar `RENDER_TIER` en `src/config.ts`: texturas, cámara y textos se adaptan solos.

**Personajes por partes** (`src/view/rigs/`): el chef y cada enemigo son un `CharacterRig` (un `Container` con una imagen por parte) descrito como datos en `rigs.ts` (`RigDefinition`: nombre, gráfico, posición respecto al centro de su casilla y punto de giro). `chefAnimation` y `enemyAnimation` deciden, como funciones puras del snapshot, en qué estado está cada personaje; `RigAnimator` cambia de estado (patrón State: `AnimationState` en `states.ts`) parando los tweens, volviendo a la postura base y arrancando los del nuevo. Los tweens solo tocan partes y nunca la posición del personaje, que sigue saliendo de la interpolación de la simulación.

**Rendimiento y post-procesado**: la referencia es una gráfica integrada modesta (AMD Radeon de un Ryzen «Renoir»); cualquier efecto debe mantener 60 fps en ella. Por eso las sombras y brillos van dibujados dentro de los SVG y el único filtro de Phaser en uso es el resplandor de los temas con `bloom` (`src/view/fx/bloom.ts`), una sola pasada sobre la cámara. Los filtros por objeto (brillo o sombra en cada ingrediente o personaje) se descartaron: con unas 20 pasadas extra por fotograma el juego dejaba de ser fluido en el equipo de referencia.

**Efectos** (`EventEffects`): adornos de vida corta (nube de pimienta, destello al pisar un segmento, aplastamiento de enemigo, chispas al completar una hamburguesa) que se destruyen solos y que `GameScene` limpia en `boardStarted`.

### 8.8 Flujo del juego, fases de partida, idioma y ajustes

El juego tiene **dos máquinas de estados** separadas a propósito:

1. **Fases de partida** (reglas, en la simulación, deterministas). `Simulation` delega cada tick en un objeto `GamePhase` (patrón State, `src/sim/phases/`) y emite `phaseChanged { from, to }` al cambiar:

   ```
   new ──► ready ──► playing ──contacto──► dying ──vidas > 0──► ready
                       │                     └──vidas = 0──► gameOver ──newGame()──► ready
                       └──todo apilado──► levelClear ──180 ticks o confirm──► ready (tablero nuevo)
   ```

   `ready` dura 90 ticks (1,5 s), `dying` 120 (2 s) y `levelClear` 180 (3 s); las duraciones están en `rules.ts` (`READY_TICKS`, `DYING_TICKS`, `LEVEL_CLEAR_TICKS`). Solo `playing` mueve el mundo. La acción `confirm` de `SimInput` adelanta el fin de nivel. Las fases hablan con la simulación a través de la interfaz `PhaseHost`, así que no conocen sus entidades y se prueban con un doble.

2. **Flujo de la aplicación** (vista). Escenas `BootScene` → `TitleScene` → `MenuScene` → `GameScene` + `HudScene`, y la **pausa**, que no es una fase porque no cambia ninguna regla: la simulación simplemente deja de recibir ticks.
   - `GameScene` publica el estado en un `GameSession` (`src/view/session/`, patrón Observer y mediador) y ejecuta sus órdenes (`pause`, `resume`, `quit`). `HudScene` solo escucha a la sesión: dibuja los paneles, los mensajes de `ready` y `levelClear`, la pantalla de fin de partida y el menú de pausa. Ninguna escena conoce a la otra.
   - Pausar llama a `this.scene.pause()` en `GameScene` (se congelan su `update` y sus tweens) y al reanudar `stepper.reset()` descarta el tiempo acumulado. La acción de pausa (Esc, P o Start del mando) la atiende solo `HudScene`. Perder el foco de la ventana, ocultar la pestaña, salir de la pantalla completa, o desconectar el mando también pausan (`GameScene` recibe estas *interrupciones* inyectadas).
   - Volver al menú detiene `HudScene` y arranca `MenuScene`; nunca se recarga la página. La puntuación se envía a los ajustes al acabar la partida y al salir.
   - Los menús usan `MenuList` (`src/view/ui/`), que lee acciones (ver 8.9): arriba y abajo para moverse, confirmar para elegir, izquierda y derecha para cambiar un valor, volver para volver, y clic o toque sobre cada opción. Elegir una opción con valor (clic, toque o confirmar) llama a su `cycle()` si lo tiene y, si no, a `change(1)`: los volúmenes usan `cycle` con `nextVolume` (de 10 vuelve a 0, para poder bajarlos con el dedo), mientras que la derecha se queda en 10. La escena llama a `menu.update()` en cada fotograma. Los sonidos del menú llegan como `UiSounds`.
   - El menú principal termina con **Salir** cuando la plataforma tiene `quit` (ver 8.4): en la aplicación de escritorio cierra la aplicación por IPC; en el navegador vuelve a la página del mismo sitio que abrió el juego (la portada de la web personal) y no aparece si el juego se abrió directamente. Esc en el menú principal solo selecciona Salir, para no salir por accidente.

**Idioma** (`src/i18n/`): todos los textos visibles salen de los catálogos `catalogs/es.ts` (el de referencia) y `catalogs/en.ts` (declarado como `Catalog`, de modo que si le falta, le sobra o cambia de forma alguna clave, falla `npm run typecheck`). Un texto es una cadena o una función `(parámetros, format) => string`; `format.number` y `format.plural` usan `Intl.NumberFormat` e `Intl.PluralRules` del idioma. `Localization` guarda el idioma activo y avisa a sus suscriptores al cambiarlo; `main.ts` mantiene el atributo `lang` del documento. El idioma inicial sale de `detectLanguage(navigator.languages)`: español si la primera preferencia es cualquier español, si no inglés.

**Ajustes** (`src/settings/`): `Settings` guarda idioma, tema (`auto` o un id), mejor puntuación, volúmenes de música y efectos (0–10), silencio y teclas asignadas en un único registro versionado (`{ "version": 1, ... }`) bajo la clave `xantar.settings` de `localStorage`, que también funciona en Electron. `parseSettings` lo lee campo a campo: un campo no válido toma su valor por defecto sin perder los demás, y un registro roto o de otra versión se ignora entero. Las teclas se validan como conjunto (`validateBindings`): si algo no cuadra, todas vuelven a las de por defecto. Los campos añadidos después de escribir un registro simplemente toman su valor por defecto, así que no hace falta cambiar de versión para añadir uno. `Settings` avisa a sus suscriptores en cada cambio (el teclado y el audio se actualizan así). Si el almacenamiento está bloqueado, el juego funciona sin recordar nada.

**Tema**: `chooseTheme` aplica la prioridad URL (`?theme=`) → opción del jugador (salvo `auto`) → tema del nivel → `classic`.

### 8.10 Audio: buses, efectos sintetizados y eventos

El audio pasa por el gestor de sonido de Phaser (Web Audio) envuelto en **`GameAudio`** (`src/view/audio/`), que es lo único que conocen las escenas:

- **Buses**: Phaser solo tiene un volumen maestro, así que los canales de **música** y **efectos** son lógicos: cada sonido se crea con la ganancia de su bus (`busGain`, curva `(nivel/10)²`) y, al cambiar un volumen, `GameAudio.apply` actualiza también los sonidos que ya suenan. El **silencio** usa el `mute` de Phaser y no toca los volúmenes. Los niveles salen de los ajustes (`musicVolume`, `sfxVolume`, `muted`) y `main.ts` los aplica en cada cambio. La acción `mute` (M) alterna el silencio en cualquier pantalla.
- **Música**: `BootScene` la carga con `this.load.audio(TITLE_MUSIC, 'music/tap-back.mp3')`; `TitleScene` llama a `playMusic` dentro del primer gesto (Phaser la retiene hasta que el contexto de audio se desbloquea) y Jugar la para.
- **Efectos sintetizados** (`synth/`, puro y con pruebas): cada efecto es una receta de datos (`SfxRecipe`: tonos con onda, barrido de frecuencia, envolvente y vibrato) que `renderRecipe` convierte en muestras deterministas (el ruido usa un generador con semilla, no `Math.random`). `BootScene` las renderiza a la frecuencia del contexto (unos 30 ms en total), crea un `AudioBuffer` por efecto y lo registra en `game.cache.audio`; desde ahí son sonidos normales de Phaser. No hay ficheros de efectos ni licencias que gestionar. Sin Web Audio no hay efectos y el juego sigue.
- **Eventos → efectos**: `EventSounds` recibe los eventos de cada fotograma en `GameScene`, junto a `EventEffects`, y `eventCue` (una tabla por tipo de evento) dice qué efecto suena. `CueThrottle` descarta la repetición del mismo efecto dentro de un intervalo mínimo (pisadas, aterrizajes), para que una cascada no se amontone. Los menús suenan a través de `UiSounds`.
- **Foco**: `pauseOnBlur` de Phaser (activo por defecto) pausa todo el sonido al perder el foco o al ocultar la pestaña, y lo reanuda al volver. Mientras el audio está bloqueado (antes del primer gesto) no se encolan efectos.

### 8.9 Entrada: acciones, teclado, mando y táctil

Ninguna escena lee teclas. Todo pasa por **acciones** (`src/input/actions.ts`): `up`, `down`, `left`, `right`, `pepper`, `confirm`, `back`, `pause` y `mute`.

```
 KeyboardSource ─┐
 GamepadSource  ─┼─► ActionInput.update() (PRE_STEP de Phaser, una vez por fotograma)
 TouchPad       ─┘        │ isDown / justPressed / repeated
                          ├─► GameScene → toSimInput() → Simulation.step
                          ├─► HudScene (pausa, fin de partida, menú de pausa)
                          └─► MenuList, ControlsPage, TitleScene
```

- **Fuentes** (`InputSource`, patrón Strategy): cada una devuelve en `poll()` las acciones mantenidas y las **pulsadas desde la lectura anterior** (así no se pierde una pulsación que empieza y acaba entre dos fotogramas, ni dos pulsaciones seguidas de la misma tecla). `pollAll` las combina: una acción está activa si cualquier dispositivo la activa.
- **`ActionState`** (puro, con pruebas) calcula por fotograma `isDown`, `justPressed` y `repeated` (la pulsación y luego, mantenida, cada 120 ms tras 400 ms: para moverse por los menús). **`ActionInput`** (vista) es el único objeto que leen las escenas; `main.ts` lo crea y lo actualiza en `Phaser.Core.Events.PRE_STEP`, antes de los `update` de las escenas. Así todas ven el mismo estado y una escena en pausa no deja teclas "pegadas".
- **Partida**: `GameScene` acumula `pepper` y `confirm` como pendientes hasta el siguiente tick (un fotograma puede no ejecutar ninguno) y `toSimInput` compone el `SimInput`. La simulación no cambia: sigue recibiendo direcciones, pimienta y confirmar.
- **Teclado** (`KeyboardSource`): escucha `keydown`/`keyup` en `window` con `KeyboardEvent.code` (la tecla física, independiente de la distribución) y las traduce con las **asignaciones** vigentes (`src/input/bindings.ts`): de una a dos teclas por acción reasignable (`up`, `down`, `left`, `right`, `pepper`, `pause`, `mute`), nunca compartidas. Fijas: Esc → `back` y `pause`; Enter → `confirm`; las teclas de la pimienta → también `confirm`. Reservadas (no asignables): Esc, Enter, Intro del teclado numérico y F11. Solo llama a `preventDefault` en las teclas que entiende y suelta todo al perder el foco o al ocultarse la página. Ignora las combinaciones con Ctrl, Alt o Meta (atajos del navegador).
- **Página Controles** (`ControlsPage`, en Opciones): filas por acción con dos huecos; confirmar captura la siguiente tecla (`KeyboardSource.capture`), Esc cancela y Retroceso vacía el hueco. `assign` intercambia la tecla si ya era de otra acción, de modo que ninguna se queda sin tecla y los menús siempre se pueden manejar. Las etiquetas salen de `keyLabel`: el carácter de la distribución del jugador (`navigator.keyboard.getLayoutMap()`, en Chrome, Edge y Electron) o el de una distribución US; las teclas con nombre (Espacio, Mayús…) salen de los catálogos (`key.*`).
- **Mando** (`GamepadSource`): sondea `navigator.getGamepads()` en cada fotograma; solo mandos con mapeo `standard`. Mapeo fijo: cruceta o stick izquierdo (zona muerta 0,5) → direcciones; A → `pepper` y `confirm`; X → `pepper`; B → `back`; Start → `pause`. Avisa de la desconexión de un mando en uso y `GameScene` pausa. Los navegadores solo muestran el mando tras pulsar un botón con la página delante, y solo en contextos seguros (`https`, `localhost` o la aplicación de escritorio).
- **Táctil**: `InputModality` detecta el primer toque (`pointerdown` con `pointerType === 'touch'`); desde entonces `HudScene` muestra `TouchControls`: cruceta (`hud.dpad`) abajo en el panel izquierdo y botón de pimienta (`hud.pepperButton`, que también confirma) abajo en el derecho, de hasta 160 unidades según el ancho del panel. Cada dedo se sigue por separado (Phaser con `input.activePointers: 3`) y se escribe en el `TouchPad` compartido; `dpadDirection` (pura) elige la dirección por el eje dominante con una zona muerta central, y deslizar el dedo cambia de dirección.
- **Siempre en horizontal** (`ForcedLandscape`, `src/view/platform/`): con una pantalla táctil en vertical (media query `(orientation: portrait) and (pointer: coarse)`), el contenedor `#game` de `index.html` se gira un cuarto de vuelta en sentido horario (`translateX(anchoWindow) rotate(90deg)`) y toma el tamaño de la ventana intercambiado, así que el juego se ve y se juega en horizontal aunque el teléfono tenga la rotación bloqueada; no hay aviso ni pausa al girar. Phaser mide con `getBoundingClientRect`, que ve la caja girada desde fuera, así que `ForcedLandscape.attach` sustituye, solo mientras está girado, cuatro pasos de sus gestores de escala y entrada (patrón Adapter): el tamaño del padre, los límites y el centrado del lienzo (medidos en el marco girado) y la transformación del puntero (`toTurnedFrame`, pura y con pruebas). `main.ts` llama a `apply()` al cambiar el tamaño de la ventana y calcula el layout con `viewport()`. En Android, al entrar en pantalla completa también se pide `screen.orientation.lock('landscape')`; si el sistema gira de verdad, el juego deja de girarse solo. La prueba de humo `portrait` lo cubre (arranque en vertical, menú y partida táctiles, y paso a horizontal).

---

## 9. Recetas para tareas comunes

### 9.1 Añadir una nueva escena

1. Crea `src/scenes/MiEscena.ts`:

   ```ts
   import Phaser from 'phaser';

   export default class MiEscena extends Phaser.Scene {
     constructor() {
       super({ key: 'MiEscena' });
     }

     create(): void {
       this.add.text(100, 100, 'Hola', { color: '#ffffff' });
     }
   }
   ```

2. Impórtala y regístrala en `src/main.ts`:

   ```ts
   import MiEscena from './scenes/MiEscena';
   // ...
   scene: [/* ... */, new MiEscena(/* dependencias */)]
   ```

3. Navega a ella con `this.scene.start('MiEscena')`.

### 9.2 Añadir un asset

1. Coloca el fichero en `public/` (por ejemplo `public/assets/nave.png`).
2. Cárgalo en `preload()` y úsalo en `create()`:

   ```ts
   preload(): void {
     this.load.image('nave', 'assets/nave.png');
   }

   create(): void {
     this.add.image(400, 300, 'nave');
   }
   ```

3. Recuerda que la ruta es relativa a la raíz y que `loader.imageLoadType: 'HTMLImageElement'` es lo que permite que funcione en Electron.

Para gráficos del juego (piezas, ingredientes, personajes, efectos, iconos del HUD) no se usan imágenes de `public/` sino SVG de tema: ver 9.8.

### 9.3 Comunicar renderer ↔ main (IPC)

Si en el futuro necesitas guardar datos en disco, mostrar diálogos nativos, etc.:

1. Añade el nombre del canal a `CHANNELS` (`electron/channels.ts`).
2. En `electron/main.ts`, atiéndelo **validando el emisor y los argumentos**: la página se trata como no fiable.

   ```ts
   ipcMain.handle(CHANNELS.saveGame, async (event, data: unknown) => {
     if (!senderWindow(event.sender, site) || typeof data !== 'string') return { ok: false };
     // aquí escribirías en disco
     return { ok: true };
   });
   ```

3. En `electron/preload.ts`, expón solo una función con argumentos concretos (nunca `ipcRenderer` entero):

   ```ts
   saveGame: (data: string) => ipcRenderer.invoke(CHANNELS.saveGame, data)
   ```

4. En el juego, amplía la interfaz `Platform` (`src/view/platform/Platform.ts`) con la operación y dale una implementación en `DesktopPlatform` y otra (o `null`) en `WebPlatform`, con su prueba en `Platform.test.ts`.

### 9.4 Publicar en web (GitHub Pages)

La versión web se publica en la web personal del autor, en https://madialeva.github.io/js/xantar/. Esa web es otro repositorio (`madialeva/madialeva.github.io`): GitHub Pages sirve su carpeta `docs/`, que su `deploy.sh` genera a partir de `src/`. Como `vite.config.ts` usa `base: './'`, las rutas son relativas y el build funciona en esa subruta sin configuración.

1. Clona la web junto a Xantar (`../madialeva.github.io`) o indica su ruta con `XANTAR_SITE_DIR`.
2. Ejecuta `npm run publish:site`. El script (`scripts/publish-site.mjs`) comprueba que la ruta es la web (tiene `deploy.sh` y `src/index.html`) antes de tocar nada. Después compila (`npm run build`; si falla, no cambia la web), sustituye entero `src/js/xantar/` por `dist/` (sin dejar bundles de builds anteriores) y ejecuta `deploy.sh` de la web. `deploy.sh` copia el juego tal cual: su quitacomentarios excluye `js/xantar/` porque estropearía el código minificado.
3. Revisa en local desde la web: `python3 -m http.server -d docs` → http://localhost:8000 → GAME → partida → Salir vuelve a la portada.
4. En la web, haz commit (`src/` y `docs/`) y push a `main`. GitHub Pages publica en uno o dos minutos.

El script no hace commit ni push. Un workflow de GitHub Actions que publicara automáticamente necesitaría un token con escritura en el repositorio de la web; queda pendiente.

---

### 9.5 Añadir o cambiar una regla de juego

1. La regla va en el núcleo (`src/sim/`), nunca en la escena. Localiza el objeto que la posee (`Chef`, `Enemy`, `Ingredient`, `IngredientField`, `Plate` o `Simulation`) y modifica su comportamiento.
2. Si necesita un número, añádelo a `src/sim/rules.ts` en tiles y ticks (no en píxeles ni milisegundos).
3. Si el cambio es observable por la vista, emite un `SimEvent` (`src/sim/events.ts`) con los datos necesarios y trátalo en `GameScene.#handleEvents`.
4. Escribe la prueba junto al código (`*.test.ts`) con un nivel mínimo hecho con cuadrículas de texto (`levelFromGrid`, `tinyGrid` en `src/sim/testing/grids.ts`) y un `Rng` falso (`StubRng`) si interviene el azar. `npm run test:watch` ayuda a iterar.
5. Comprueba que se mantiene el determinismo (`Simulation.determinism.test.ts`) y ejecuta `npm run lint && npm run typecheck && npm run test`.

### 9.6 Añadir una pieza al registro

1. Define una `PieceDefinition` (`src/sim/level/pieces/`): `id`, `symbol` (un carácter, único en su capa), `layer`, `width` (un número, o `'unit'` para el tamaño de unidad del nivel) y `contribute(placement, builder)`, que llama a los métodos del `LevelBuilder` (`addPlatform`, `addLadder`, `addPlate`, `addIngredient`, `setChefStart`, `addEnemySpawn`).
2. Regístrala: en `defaultPieces.ts` si forma parte de la versión actual del formato, o con `registry.register(...)` para pruebas y extensiones. Añadir piezas no cambia la versión del formato; cambiar el significado de un símbolo existente sí.
3. Si la pieza necesita una regla nueva, impleméntala en el núcleo (receta 9.5) y, si procede, una regla de validación (`src/sim/level/validation/rules.ts`).
4. Prueba con una cuadrícula pequeña (`levelFromGrid` en `src/sim/testing/grids.ts`) y comprueba el registro (`PieceRegistry.test.ts`).

### 9.7 Crear un nivel a mano y validarlo

1. Copia `src/levels/classic.level.json` y edita las tres capas (todas con `rows` filas de `cols` caracteres). Usa `+` donde una escalera toca una plataforma, `H` entre los cruces, y grupos de `segments` casillas iguales para ingredientes y platos.
2. Escribe una prueba (o un script) que lo cargue: `loadLevel(parseLevelJson(texto))` lanza `LevelError` si es estructuralmente incorrecto o `UnplayableLevelError` (con `issues`) si no se puede jugar; `validateLevel(loadLevel(doc, { requirePlayable: false }))` devuelve todas las incidencias, avisos incluidos.
3. Para usarlo en el juego, carga el documento en `GameScene` en lugar del clásico (la selección de niveles llegará con el editor).

---

### 9.8 Añadir un gráfico SVG

1. Añade su id y su tamaño lógico al catálogo `GRAPHICS` de `src/view/theme/graphics.ts` (las piezas llevan como prefijo el id del registro de piezas: `platform.left`, `plate.mid`…).
2. Dibuja `src/view/art/classic/<id>.svg` siguiendo `docs/STYLE_GUIDE.md`: `viewBox`, `width` y `height` iguales al tamaño del catálogo y colores solo con clases `f-`/`s-`/`c-` de la paleta.
3. Ejecuta `npx vitest run src/view/art`: la prueba de arte dice qué fichero y qué atributo no cumplen la convención, y la de temas avisa si `classic` se ha quedado incompleto.
4. Úsalo desde la vista con `art.image('<id>', x, y)` (`ArtFactory`): `BootScene` ya lo rasteriza para todos los temas.

### 9.9 Crear un tema

1. Crea `src/view/themes/<id>.ts` con su paleta parcial (`Partial<Palette>`): solo los tokens que cambian.
2. Si sustituye gráficos, pon sus SVG en `src/view/art/<id>/` con el mismo nombre que en `classic`; lo que no sustituya se toma de `classic`.
3. Regístralo en `createThemeRegistry` (`src/view/themes/index.ts`) con `registry.register({ id, name, palette, art: art.get(id) ?? {} })`. Añade `bloom: true` si el tema se dibuja con resplandor (una sola pasada de cámara con `applyBloom`; solo con WebGL y sin heredarse de `classic`). Hoy lo usa `midnight`.
4. Pruébalo con `?theme=<id>` en la URL o con `"theme": "<id>"` en un nivel. `npm run test` comprueba que solo usa tokens y gráficos existentes y colores válidos.

### 9.10 Añadir o animar una parte de un personaje

1. Para una parte nueva: añade su gráfico (9.8) y una entrada en el rig correspondiente de `src/view/rigs/rigs.ts` con su posición respecto al centro de la casilla y su punto de giro (`originX`/`originY`; por ejemplo, el hombro para un brazo). El orden de la lista es el orden de dibujo.
2. Para animarla, edita el estado en `src/view/rigs/states.ts`: `motion.swing(parte, desde, hasta, ms)` la mueve de ida y vuelta, `motion.once(...)` una sola vez y `motion.hold(...)` la deja en una postura. Los desplazamientos son relativos a la postura base (`dx`, `dy`, `angle`, `scaleX`, `scaleY`).
3. Un estado nuevo se añade al tipo (`ChefAnimation` o `EnemyAnimation`), a la función que lo elige (`chooseAnimation.ts`, con su prueba) y a la tabla de estados.

### 9.11 Verificar visualmente un cambio

1. **Prueba de humo**: `npm run smoke` compila la web y Electron y abre `dist/` en Electron (bajo `file://` y con el preload real de la aplicación, como la app de escritorio). En lugar de cerrar, registra las peticiones de salida (`app:quit`). Por defecto ejecuta el escenario `review`: los dos temas a 1920×1080, 1024×768 y 2340×1080, pulsando derecha un momento. Por cada ejecución guarda `.smoke/<escenario>/<ejecución>/*.png` y `console.log`, imprime `ok` o `FAILED` y termina con código 1 si la consola registra algún error o el renderizador se cae.
   - Otros escenarios: `npm run smoke -- quick`, `climb`, `game-over`, `menu` (menú y opciones en los dos idiomas), `pause` o `quit` (Esc selecciona Salir y Enter pide cerrar; el paso `expectQuit` falla si no llegó la petición) (definidos en `tools/smoke/scenarios.ts`; añadir uno es añadir datos). Todos pasan por el título (clic) y el menú (`Enter` en Jugar). Cada ventana usa un almacenamiento propio en memoria, así que los ajustes de una ejecución no afectan a la siguiente.
   - Una ejecución a medida: `npm run smoke -- --size 1280x720 --query theme=midnight --steps "wait:2500,click,wait:2000,down:Up,wait:500,shot:sube,up:Up" --name prueba`. Pasos: `wait:<ms>`, `click` (centro de la ventana), `key:<tecla>[:<ms>]`, `down:<tecla>`, `up:<tecla>` y `shot:<nombre>`; las teclas usan los nombres de Electron (`Left`, `Up`, `Space`, `Return`…).
   - En Linux usa `xvfb-run` si está instalado, sin abrir ventanas y con WebGL por software; `--visible` lo desactiva. Si `dist/` y `dist-electron/` ya están al día, `node scripts/smoke.mjs <escenario>` se salta la compilación.
2. **Lámina de arte**: con `npm run dev`, abre http://localhost:5173/tools/art-sheet.html. Dibuja con el código del juego (rasterizador, temas y rigs) todos los gráficos del catálogo, las tiras de ingredientes y platos de 4, 3 y 2 segmentos, un tramo de plataforma con escalera y cada personaje en cada estado de animación; el selector cambia de tema. Al editar un SVG, Vite recarga la página. Solo existe en desarrollo: `npm run build` no la incluye.

### 9.12 Añadir un texto a la interfaz

1. Añade la clave al catálogo español (`src/i18n/catalogs/es.ts`): una cadena, o una función si lleva parámetros, por ejemplo:

   ```ts
   'hud.combo': (p: { combo: number }, f: Format) => `COMBO ×${f.number(p.combo)}`,
   ```

2. Añádela con la misma forma al catálogo inglés. Si te olvidas, `npm run typecheck` falla señalando la clave.
3. Úsala con `localization.t('hud.combo', { combo })`. Nunca escribas el texto directamente en una escena.

### 9.13 Añadir un idioma

1. Añade su código a `LANGUAGES` (`src/i18n/language.ts`) y, si quieres que se elija solo, ajusta `detectLanguage` y su prueba.
2. Crea `src/i18n/catalogs/<código>.ts` como `export const fr: Catalog = { ... }` y regístralo en `CATALOGS` (`src/i18n/Localization.ts`).
3. Añade su nombre a los catálogos (`'language.fr'`): el selector de Opciones lo recorre solo. Revisa los plurales con `format.plural` (algunos idiomas tienen más formas que `one` y `other`; amplía `PluralForms` si hace falta).

### 9.14 Añadir una opción del jugador

1. Añade el campo a `PlayerSettings` con su validación en `parseSettings` y su prueba (un valor no válido debe caer al valor por defecto sin afectar a los demás).
2. Añade el método para cambiarlo en `Settings` (guarda en cada cambio) y su valor por defecto en `main.ts`.
3. Añade la entrada al menú de opciones en `MenuScene.#optionItems` con `label`, `value` y `change`, y sus textos a los catálogos.

### 9.16 Añadir un efecto de sonido

1. Añade el nombre a `SOUND_CUES` y su receta a `CUE_RECIPES` (`src/view/audio/synth/soundCues.ts`). Una receta es una lista de tonos (forma de onda, frecuencia inicial y final, ataque, sostén y caída, vibrato, inicio); los jingles son varios tonos con distinto `start`. Afínala de oído: `npm run dev`, ajusta y recarga.
2. Si llega en ráfagas, dale un intervalo mínimo en `CUE_INTERVALS_MS` (`src/view/audio/mixing.ts`).
3. `npm run test` comprueba que suena, que no satura, que dura como mucho 3 s y que acaba en silencio.

### 9.17 Asociar un sonido a un evento

- **Evento de la simulación**: cambia su entrada en `EVENT_CUES` (`src/view/audio/mixing.ts`); el tipo obliga a tener una entrada por cada tipo de evento, así que un evento nuevo no compila hasta decidir su sonido (o `null`). Añade el caso a la prueba de `eventCue`.
- **Interfaz**: los menús llaman a `UiSounds` (`move`, `select`, `back`); otros componentes pueden recibir `GameAudio` (o la interfaz `CuePlayer`) y llamar a `cue(...)`.

### 9.15 Añadir una acción

1. Añádela a `ACTIONS` (`src/input/actions.ts`) y, si el jugador debe poder cambiar su tecla, a `REMAPPABLE_ACTIONS` con su tecla por defecto en `DEFAULT_BINDINGS` (`src/input/bindings.ts`). Las asignaciones guardadas sin la acción nueva dejan de validar y vuelven a las de por defecto: avísalo en el PR.
2. Si un botón del mando la produce, añádelo a `BUTTONS` en `GamepadSource`; si tiene control táctil, a `TouchControls`.
3. Añade su nombre a los catálogos (`action.<nombre>`) para la página Controles.
4. Léela en la escena que corresponda con `input.justPressed(...)` o `input.isDown(...)`, y añade las pruebas de `bindings`, de la fuente y, si toca, un escenario de humo.

## 10. Build y empaquetado

### 10.1 Web

```bash
npm run build     # -> dist/
npm run preview   # sirve dist/ en local para probarlo
```

`dist/` contiene `index.html`, el JS con Phaser incluido y los assets de `public/`. Es 100 % estático: se puede subir a cualquier hosting.

### 10.2 Escritorio

```bash
npm run build:desktop:dir   # app desempaquetada en release/linux-unpacked/ (u OS equivalente)
npm run build:desktop       # instaladores en release/
```

Objetivos configurados en `package.json` (campo `build`):

| Plataforma | Formato |
|-----------|---------|
| Linux | AppImage |
| Windows | NSIS (`.exe`) |
| macOS | DMG |

**Limitación importante:** electron-builder solo puede generar el instalador de la plataforma en la que ejecutas el build. Los tres instaladores los genera la CI con una matriz Linux/Windows/macOS (ver 10.4).

**Iconos.** La fuente es `build/icon.svg`: la cabeza, los ojos y el gorro del chef copiados de `src/view/art/classic/` y colocados como en su rig, con la paleta clásica (al ser un recurso de empaquetado, lleva los colores escritos en un `<style>`). `npm run icon` la rasteriza a `build/icon.png` (1024×1024) con una ventana oculta de Electron (`scripts/build-icon.mjs`); el PNG se versiona y electron-builder deriva de él el `.ico` y el `.icns`. Si cambias el SVG, vuelve a ejecutar `npm run icon` (en Linux sin pantalla: `xvfb-run -a npm run icon`).

**Fusibles de Electron** (`build.electronFuses`): el ejecutable empaquetado no se puede usar como Node (`ELECTRON_RUN_AS_NODE`), ignora `NODE_OPTIONS` y `--inspect`, solo carga la aplicación desde `app.asar` (con validación de integridad donde Electron la admite), cifra las cookies y no da privilegios extra a `file://`. No afectan a `npm run dev:desktop` ni a la prueba de humo, que usan el Electron de `node_modules`.

**Firma.** Los instaladores de la v1.0.0 se generan **sin firma de código ni notarización** (`mac.identity: null`; en CI, `CSC_IDENTITY_AUTO_DISCOVERY=false`). Windows (SmartScreen) y macOS (Gatekeeper) avisan al abrirlos; el README explica cómo continuar. Firmar exige certificados de pago (Apple Developer, certificado de Windows) y queda para cuando se distribuya públicamente.

### 10.3 Qué se incluye en el paquete

Gracias a la configuración de `build.files`, el `app.asar` solo contiene:

```
/dist/**            (juego compilado)
/dist-electron/**   (main.js + preload.js; el proceso principal incluye sus módulos)
/package.json
```

Phaser va dentro del bundle de Vite, por lo que **no** se incluye `node_modules/phaser` (evita ~140 MB extra). Por eso `phaser` figura en `devDependencies`.

### 10.4 Integración continua (GitHub Actions)

Dos workflows en `.github/workflows/`, solo con acciones oficiales de GitHub (`actions/*`) y la versión de Node de `.nvmrc`:

| Workflow | Cuándo | Jobs |
|----------|--------|------|
| `ci.yml` | Solo PR hacia `develop/**` o `release/**` (un push nunca la dispara: lo que llega a esas ramas ya pasó por su PR) | `check`: lint, formato, tipos, pruebas y build web. `version`: `npm run check:version`. `smoke`: prueba de humo en Linux con `xvfb` (tras `check`), capturas como artefacto `smoke` |
| `desktop.yml` | Push a `release/**`, etiquetas `v*` y ejecución manual (*Run workflow*) | Matriz `ubuntu-latest`, `windows-latest`, `macos-latest`: `npm run build:desktop -- --publish never`; instaladores como artefactos `xantar-<os>` (14 días) |

**Versión frente a la rama.** `tools/ci/branchVersion.ts` (`expectedVersion`, con pruebas) deduce la versión esperada a partir de la rama destino del PR: `develop/vX.Y.Z` y `release/vX.Y.Z` exigen `X.Y.Z`; las demás no se comprueban. (También entiende una rama o etiqueta sin PR, `GITHUB_REF_NAME`, para probarlo en local.) `tools/ci/checkVersion.ts` la compara con `package.json`; Node 24 lo ejecuta directamente, sin compilar (elimina los tipos al cargarlo). Para probarlo en local:

```bash
GITHUB_REF_NAME=develop/v1.0.0 npm run check:version
```

**Detalles del entorno de Actions:**

- `check` instala sin el binario de Electron (`ELECTRON_SKIP_BINARY_DOWNLOAD=1`), que no necesita.
- `smoke` desactiva la restricción de AppArmor sobre los espacios de nombres de usuario (`kernel.apparmor_restrict_unprivileged_userns=0`); sin eso, el sandbox de Chromium no arranca en Ubuntu 24.04.
- `desktop.yml` fija `CSC_IDENTITY_AUTO_DISCOVERY=false`: los instaladores se generan **sin firmar** (ver 10.2). No se publican como versión de GitHub; se descargan desde la ejecución del workflow (*Artifacts*).
- La ejecución manual de `desktop.yml` solo aparece cuando el workflow está en la rama por defecto del repositorio.

**Protección de ramas.** Tras el primer merge, marcar `Lint, format, types, tests and build`, `Version matches the branch` y `Desktop smoke test` como comprobaciones obligatorias en la regla de protección de `develop/**` (Settings → Rules) para que un PR no se pueda fusionar con la CI en rojo.

---

## 11. Convenciones de TypeScript

- **Tipado estricto** activado (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`) tanto en `tsconfig.json` como en `tsconfig.electron.json`.
- **Campos privados** con `#` (estándar ES2022) para el interior de las clases; `protected` solo en puntos de extensión deliberados y `readonly` para lo que no cambia tras construirse.
- **TypeScript 7** (compilador nativo): `npm run typecheck` usa su `tsc`. El editor puede usar otra versión de TypeScript para el servidor de lenguaje; no afecta a la comprobación de tipos del proyecto.
- **Diseño**: orientado a objetos por defecto (objetos con estado y comportamiento, inyección de dependencias por constructor, composición sobre herencia), con estilo funcional para cálculo sin estado, eventos y datos inmutables. La lógica de dominio vive en `src/sim/` sin depender de Phaser; el detalle está en `AGENTS.md`.
- **Comentario de clase obligatorio**: toda clase lleva encima un comentario breve `/** ... */` (de una a tres líneas, en inglés) que explica para qué sirve y, si ayuda, su papel en el diseño (Strategy, State…). Lo mismo para las interfaces que definen el papel de un colaborador. Fuera de eso, **sin comentarios** salvo que aporten algo que el código no exprese.
- El renderer (`tsconfig.json`) solo incluye librerías de navegador (`DOM`); **no** tiene acceso a APIs de Node (`types: []`). Esto evita usar por error `fs`, `path`, etc. en el juego.
- El proceso Electron (`tsconfig.electron.json`) es lo contrario: solo Node, sin DOM.
- Código, identificadores y comentarios van en **inglés**; este manual es la única documentación en español.

---

## 12. Solución de problemas

### La música no suena la primera vez en el navegador
Es la **política de autoplay** del navegador: el audio no puede empezar sin una interacción del usuario. Por eso `TitleScene` espera al primer clic, toque o tecla para arrancar la música. La aplicación de escritorio se comporta igual: ya no desactiva esa política.

### Esc no pausa o no vuelve atrás en pantalla completa
En la aplicación de escritorio no ocurre: la pantalla completa es nativa (F11) y Esc siempre llega al juego. En el navegador, Esc sirve para salir de la pantalla completa y normalmente no se entrega a la página. Al entrar en pantalla completa el juego pide `navigator.keyboard.lock(['Escape'])` (Chrome, Edge y Electron), de modo que Esc llega al juego y mantenerla pulsada sigue saliendo. En navegadores sin esa API, salir de la pantalla completa pausa la partida; usa `P` para pausar.

### Pantalla negra al abrir el juego desde el fichero
Ocurre al abrir `index.html` o `dist/index.html` con `file://` (doble clic): el navegador bloquea los módulos y la carga de ficheros. Usa `npm run dev` o `npm run preview`. La aplicación de escritorio no tiene este problema porque sirve `dist/` por `app://`.

### Un asset no carga en la app de escritorio
El protocolo `app://` solo sirve ficheros de `dist/` y responde 404 a lo demás. Comprueba que el asset está en `public/` (o importado desde `src/`) y que se referencia con una ruta relativa (`music/foo.mp3`, no `/music/foo.mp3`). Si la consola muestra *Refused to load … Content Security Policy*, el tipo de recurso u origen no está permitido por la CSP de `vite.config.ts`.

### Errores `vaInitialize failed ... libva` al abrir Electron en Linux
Son avisos de aceleración de vídeo por hardware; no impiden jugar. Ignóralos o ejecuta en un entorno con soporte VAAPI.

### Aviso de npm: `packages have install scripts not yet covered by allowScripts`
Es una función de seguridad de npm 11. Electron descarga su binario en el `postinstall`; si no se ejecuta, la primera vez que lances `electron` lo descargará igualmente. Si un `npm install` limpio no deja Electron operativo, ejecuta `npm approve-scripts electron` o `npm rebuild electron`.

### Electron se cierra al instante o responde `bad option`

Comprueba `echo $ELECTRON_RUN_AS_NODE`. Algunas terminales de editor lo definen y hacen que Electron se comporte como Node. Ejecuta con `env -u ELECTRON_RUN_AS_NODE ./release/linux-unpacked/xantar` o desactívalo en esa terminal.

### El puerto 5173 está ocupado
Vite está configurado con `strictPort: true`, así que fallará en vez de cambiar de puerto. Libera el puerto o cámbialo en `vite.config.ts` (y también en el script `dev:desktop`, que usa `wait-on tcp:127.0.0.1:5173`).

### `Cannot find module 'electron'` al tipar el proceso principal
Comprueba que usas `npm run typecheck` (ejecuta también `tsconfig.electron.json`) y que `electron` está instalado en `devDependencies`.

---

## 13. Notas sobre Phaser 3 vs Phaser 4

- El proyecto usa **Phaser 4** (`^4.2.1`). La API utilizada (escenas, `add.text`, `add.graphics`, tweens, `scale`, `device.os`, `scene.start`, input de puntero) es compatible con lo que había en Phaser 3.
- El bundle de Phaser 4 es algo mayor que el antiguo build mínimo `phaser-arcade-physics` que se usaba antes (~1,39 MB frente a ~1,21 MB), pero a cambio se tiene el motor completo y los tipos oficiales al día.
- Si en algún momento se necesita reducir tamaño, se puede activar *code splitting* en Vite o estudiar los builds personalizados de Phaser. El aviso de "chunk > 500 kB" de Vite es normal con este motor.

---

## 14. Entorno de desarrollo en VS Code

El soporte de **TypeScript** y el **depurador de JS/TS** (`js-debug`) vienen integrados en VS Code: no hace falta instalar ninguna extensión para eso.

### 14.1 Extensiones recomendadas

**Imprescindibles**

| Extensión | ID | Para qué |
|-----------|----|----------|
| Oxc | `oxc.oxc-vscode` | Diagnósticos de Oxlint en el editor |
| Prettier | `esbenp.prettier-vscode` | Formato consistente al guardar |
| EditorConfig | `EditorConfig.EditorConfig` | Respetar indentación y finales de línea entre editores |
| Error Lens | `usernamehw.errorlens` | Muestra los errores TS en la misma línea, sin abrir la pestaña de problemas |
| Pretty TypeScript Errors | `yoavbls.pretty-ts-errors` | Errores de tipos legibles y con enlaces |

**Muy recomendables**

| Extensión | ID | Para qué |
|-----------|----|----------|
| Path Intellisense | `christian-kohler.path-intellisense` | Autocompletar rutas de assets e imports |
| npm Intellisense | `christian-kohler.npm-intellisense` | Autocompletar nombres de módulos en `import` |
| Import Cost | `wix.vscode-import-cost` | Ver el peso de cada import (útil con Phaser) |
| Code Spell Checker | `streetsidesoftware.code-spell-checker` | Corrección ortográfica en código |
| Spanish - Code Spell Checker | `streetsidesoftware.code-spell-checker-spanish` | Diccionario español (para los `.md` y comentarios) |
| Todo Tree | `Gruntfuggly.todo-tree` | Panel con los `TODO`/`FIXME` del proyecto |

**Opcionales**

| Extensión | ID | Para qué |
|-----------|----|----------|
| GitLens | `eamodio.gitlens` | Historial y autores por línea |
| Console Ninja | `wallabyjs.console-ninja` | Ver `console.log` inline durante la depuración |

> **No instales Live Server.** No es necesario con Vite y además interfiere. Para desarrollo, usa siempre `npm run dev`.

### 14.2 Recomendaciones del workspace

La lista está guardada en `.vscode/extensions.json`, de modo que al abrir el proyecto VS Code ofrece instalarlas todas con un clic (pestaña *Extensions* → *Install All* / *Show Recommendations*).

### 14.3 Lint y formato

El proyecto usa **Oxlint** (con **oxlint-tsgolint** para las reglas con información de tipos) para el análisis y **Prettier** para el formato. En el editor, Prettier formatea al guardar y la extensión de Oxc muestra los diagnósticos.

Ficheros de configuración:

| Fichero | Función |
|---------|---------|
| `.oxlintrc.json` | Configuración de Oxlint: reglas, entornos por carpeta y fronteras de `src/sim/` |
| `.prettierrc.json` | Reglas de estilo de Prettier |
| `.prettierignore` | Rutas que Prettier no debe tocar (builds, docs, tooling) |
| `.editorconfig` | Convenciones básicas de editor (2 espacios, LF, UTF-8) |
| `.vscode/settings.json` | Configuración local del editor (no se publica) |
| `.vscode/extensions.json` | Extensiones recomendadas del workspace (no se publica) |

Reglas destacadas de `.oxlintrc.json`:

- Categoría `correctness` en error, más reglas con tipos: `no-floating-promises`, `no-misused-promises`, `await-thenable`, `unbound-method` y `switch-exhaustiveness-check`.
- `no-empty` con `allowEmptyCatch: true`: permite `catch {}` vacíos (se usan, por ejemplo, en el almacenamiento de ajustes para que un fallo de `localStorage` no rompa el juego).
- `no-unused-vars` (aviso) ignora parámetros y capturas con prefijo `_`.
- Entorno de navegador por defecto y Node solo en `electron/`, `scripts/` y `tools/smoke/`.
- **Fronteras de `src/sim/`**: no puede importar Phaser, Node, `scenes/`, `objects/` ni `config`, ni usar globales de navegador, `Date` o `Math.random` (se inyecta un `Rng`). Garantiza que el núcleo sea puro y determinista.

El análisis con tipos usa un `tsconfig` por ejecución, por eso `npm run lint` lanza dos: una para el renderer (`tsconfig.json`) y otra para `electron/`, `scripts/` y `tools/` (`tsconfig.electron.json`, que también comprueba los tipos de `tools/smoke/`).

Comandos:

```bash
npm run lint          # analizar el código
npm run lint:fix      # analizar y corregir automáticamente
npm run format        # formatear con Prettier
npm run format:check  # solo comprobar (útil en CI)
```

Notas:

- `.prettierignore` excluye `docs/`, `.opencode/` y `openspec/` para no reformatear la documentación ni ficheros de herramientas.
- En CI, encadena `npm run lint && npm run format:check && npm run typecheck && npm run test`.

---

## 15. Próximos pasos

La hoja de ruta vigente está en el README (tabla *Roadmap*) y se gestiona con issues de GitHub y milestones por versión. Pendientes para después de la v1.0.0: alimentos de bonus (#13) y publicación de la web (#14). Ideas sin issue propia:

- Más tipos de enemigos.
