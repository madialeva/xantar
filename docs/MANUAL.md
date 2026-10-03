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

Estado actual del juego: un juego de una sola pantalla con un nivel clásico, inspirado en **BurgerTime** (1982). `TapScene` es la pantalla de título ("CLICK PARA JUGAR") y `GameScene` es la vista del juego: ejecuta el núcleo de simulación (`src/sim/`: chef, ingredientes de segmentos que se pisan y caen, enemigos, pimienta, puntuación y vidas) y lo dibuja. La hoja de ruta está en el README y en las issues de GitHub.

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
├── electron/                    # Proceso principal de Electron (no va al renderer)
│   ├── main.ts                  # Crea la ventana, carga dev server o dist/
│   └── preload.ts               # Puente seguro renderer ↔ main (contextBridge)
├── public/                      # Assets estáticos: se copian TAL CUAL a dist/
│   ├── assets/
│   │   ├── red.png
│   │   └── space.png
│   └── music/
│       └── tap-back.mp3
├── scripts/
│   └── build-electron.mjs       # Compila electron/*.ts -> dist-electron/ (CJS)
├── src/                         # Código del juego (renderer)
│   ├── main.ts                  # Punto de entrada: config de Phaser + new Phaser.Game()
│   ├── config.ts                # Solo de la vista: tamaño de tile, colores, alturas de dibujo
│   ├── sim/                     # Núcleo de simulación (TypeScript puro, sin Phaser ni DOM)
│   │   ├── Simulation.ts        # Agregado raíz: orquesta el tick, órdenes y estado de solo lectura
│   │   ├── GameStats.ts         # Puntos, vidas, pimientas, nivel y combo
│   │   ├── rules.ts             # Constantes de reglas en tiles y ticks
│   │   ├── rng.ts, events.ts, stepper.ts, geometry.ts, SimInput.ts
│   │   ├── level/               # Documento JSON, registro de piezas, ensamblado, Level y validación
│   │   ├── nav/                 # Grafo de navegación, NavPlace y camino más corto
│   │   ├── entities/            # Chef, Enemy (+ EnemyBrain), Ingredient, IngredientField, Plate, pepper
│   │   └── testing/             # Niveles (cuadrículas) y dobles de prueba compartidos por los tests
│   ├── levels/
│   │   └── classic.level.json   # Nivel clásico en el formato de nivel v1
│   ├── objects/                 # Vistas Phaser (sin lógica): ChefView, EnemyView, IngredientView
│   └── scenes/
│       ├── TapScene.ts          # Pantalla "CLICK/TOCA PARA JUGAR" + música
│       └── GameScene.ts         # Adaptador: ejecuta la simulación a paso fijo y la dibuja
├── docs/
│   └── MANUAL.md                # Este manual de desarrollador
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
└── .gitignore                   # Ignora node_modules/, dist/, dist-electron/, release/
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

- `src/main.ts` importa Phaser y las escenas, monta la configuración y arranca el juego:

  ```ts
  import Phaser from 'phaser';
  import { GAME_HEIGHT, GAME_WIDTH } from './config';
  import TapScene from './scenes/TapScene';
  import GameScene from './scenes/GameScene';

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#101418',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    loader: {
      imageLoadType: 'HTMLImageElement'
    },
    scene: [TapScene, GameScene]
  };

  const game = new Phaser.Game(config);

  window.addEventListener('resize', () => game.scale.refresh());
  ```

El juego usa una **resolución lógica fija** (640x480, definida en `src/config.ts`) y `Phaser.Scale.FIT`, de forma que la rejilla y las posiciones son siempre las mismas y el navegador solo escala el lienzo.

### 8.2 Escenas de Phaser

Cada escena es una clase que extiende `Phaser.Scene` y se exporta por defecto:

```ts
import Phaser from 'phaser';

export default class TapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TapScene' });
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

Para cambiar de escena: `this.scene.start('GameScene')`.

**Flujo actual:**

```
index.html -> src/main.ts -> TapScene
TapScene --(clic/tap)--> pantalla completa -> GameScene
GameScene --(botón ✕ o ESC)--> window.location.href = 'index.html'   (vuelve al inicio)
```

Detalle relevante de `TapScene`: la música se reproduce con `new Audio(...)` en lugar del gestor de sonido de Phaser, para que funcione también bajo `file://` (Electron) y no bloquee la escena si el audio falla.

### 8.3 Assets y la carpeta `public/`

Todo lo que esté en `public/` se copia sin procesar a la raíz de `dist/`. Por eso los assets se referencian con rutas **relativas a la raíz**:

```
public/assets/red.png      ->  dist/assets/red.png      ->  'assets/red.png'
public/music/tap-back.mp3  ->  dist/music/tap-back.mp3  ->  'music/tap-back.mp3'
```

Ventajas de `public/`:

- No hace falta importarlos en el código.
- Mantienen la misma ruta en desarrollo, en web de producción y en Electron.

Configuración **imprescindible** para Electron: `loader.imageLoadType: 'HTMLImageElement'` (ya aplicada en `src/main.ts`). Sin ella, Phaser carga las imágenes por `XHR`, que está bloqueado bajo `file://`.

### 8.4 Capa Electron

**`electron/main.ts`** (proceso principal):
- Añade `--autoplay-policy=no-user-gesture-required`, de modo que el audio puede sonar sin interacción previa (a diferencia del navegador).
- Crea una `BrowserWindow` con `contextIsolation: true` y `nodeIntegration: false` (configuración segura).
- En desarrollo carga `VITE_DEV_SERVER_URL`; en producción carga `dist/index.html`.

**`electron/preload.ts`**: expone una API mínima al renderer mediante `contextBridge`:

```ts
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform
});
```

En el juego se puede consultar con `(window as any).xantar?.isDesktop`. En el futuro, cualquier comunicación con el sistema operativo (guardar partida, abrir diálogos, etc.) debe pasar por aquí vía IPC.

**Compilación**: `scripts/build-electron.mjs` usa esbuild para convertir `electron/*.ts` a CommonJS en `dist-electron/` y genera un `dist-electron/package.json` con `{"type":"commonjs"}`. Esto es necesario porque el `package.json` raíz es ESM (`"type": "module"`) y Electron carga `main.js` como CommonJS.

### 8.5 El juego actual (tipo BurgerTime)

**Arquitectura: núcleo y vista.** Las reglas viven en `src/sim/`, que es TypeScript puro y no depende de Phaser, del DOM ni de Node (Oxlint lo impide en `.oxlintrc.json`). La capa de Phaser (`src/scenes`, `src/objects`) solo presenta: lee el estado de la simulación, recoge la entrada y reacciona a sus eventos. Las dependencias van siempre de la vista al núcleo.

- **Paso fijo.** `GameScene` alimenta un `FixedStepper` con el tiempo de cada fotograma y ejecuta en `Simulation` el número de *ticks* resultante (60 por segundo, con un máximo por fotograma). El resultado no depende del framerate. La vista interpola entre el estado de los dos últimos ticks (`prevX`/`prevY` y `alpha`).
- **Unidades lógicas.** El núcleo trabaja en tiles (1 unidad = 1 tile) y ticks. La vista convierte a píxeles con `TILE` (`src/config.ts`). Una entidad sobre la fila `r` está en `y = r`; la línea de plataforma en `y = r + 0,5`; el centro de la columna `c` en `x = c + 0,5`.
- **Nivel como datos.** `Simulation` recibe un `Level` cargado con `loadLevel(documento)`; el documento es un JSON versionado (ver 8.6). `src/levels/classic.level.json` es el nivel actual (4 plataformas a todo el ancho, escaleras en las columnas 0, 9, 10 y 19, 4 ingredientes por plato y 4 platos). `loadLevel` ensambla el nivel con el registro de piezas, deriva el grafo de navegación y, por defecto, rechaza los niveles con errores de jugabilidad (`validateLevel`).
- **Eventos.** `Simulation.step(input)` devuelve los `SimEvent` del tick (`ingredientLanded`, `enemySquashed`, `burgerDone`, `chefHit`, `levelCleared`, `gameOver`…). La vista los traduce a efectos (destello, nube de pimienta, pantallas de fin) y, más adelante, a sonido.
- **Aleatoriedad.** Se inyecta un `Rng` (`SeededRng`, con semilla). Con la misma semilla y la misma secuencia de entradas, la partida es idéntica.

**Modelo de objetos del núcleo** (`src/sim/`):

- `Simulation`: agregado raíz. Cada tick ejecuta chef → ingredientes → enemigos → pimienta → contacto. Estado de partida: `playing`, `levelClear`, `gameOver`; órdenes `startBoard`, `nextLevel`, `newGame`.
- **Grafo de navegación** (`src/sim/nav/`): se deriva del nivel y tiene tramos de plataforma (`PlatformEdge`) y de escalera (`LadderEdge`) unidos en los cruces. La posición de chef y enemigos es un `NavPlace` (arista + desplazamiento); `graph.shortestPath` calcula el camino más corto y `graph.reachableFrom` la alcanzabilidad.
- `Chef`: camina por su tramo de plataforma y se engancha a una escalera a ≤ 0,6 casillas del cruce. Sobre la escalera solo se mueve mientras pulsas arriba o abajo y puede parar e invertir en cualquier punto.
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
| Confirmar (fin de nivel / game over) | `Enter` |
| Salir al menú | `Esc` o botón `✕` |

**Vidas y fin de partida**: 3 vidas. Tocar un enemigo no aturdido resta una vida; al llegar a 0 aparece *GAME OVER* y `Enter` reinicia.

**Pendiente / ideas**: alimentos de bonus (helado, café, patatas), más enemigos, música y efectos de sonido, controles táctiles y puntuación persistente.

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
  "layers": {
    "structure":   ["....", "+==+", "H..H", "+==+", ".__."],
    "ingredients": ["....", ".TT.", "....", ".BB.", "...."],
    "actors":      ["....", "....", "....", ".C..", "...."]
  }
}
```

(Ejemplo abreviado: cada capa tiene `rows` cadenas de `cols` caracteres.) `segments` es opcional (2, 3 o 4; 4 por defecto): fija el número de segmentos de cada ingrediente y el ancho en casillas de ingredientes y platos, para pantallas de minihamburguesas.

| Capa | Símbolo | Pieza |
|------|---------|-------|
| `structure` | `.` `=` `H` `+` `_` | vacío, plataforma, escalera, cruce (plataforma con escalera), plato |
| `ingredients` | `T` `L` `P` `B` | pan superior, lechuga, carne, pan inferior |
| `actors` | `C` `h` `p` `e` | inicio del chef, aparición de perrito, pepinillo y huevo |

Reglas: una racha de casillas iguales de una pieza ancha (ingredientes y platos) se divide en unidades del tamaño `segments`; un segmento de ingrediente necesita casilla de plataforma debajo; los marcadores de enemigo son también los puntos de reaparición. Los errores estructurales lanzan `LevelError` con capa, fila y columna. Además, `validateLevel` informa de incidencias de jugabilidad (`ingredient-unreachable`, `ingredient-no-plate`, `ladder-dangling`, `no-ingredients` como errores; `plate-empty`, `platform-unreachable`, `spawn-unreachable` como avisos) y `loadLevel` rechaza por defecto los niveles con errores (`requirePlayable: false` los acepta, para el futuro editor).

Cada símbolo lo define una `PieceDefinition` (id, símbolo, capa, ancho y qué aporta al nivel) del `PieceRegistry`. Las piezas no contienen nada gráfico.

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
   scene: [TapScene, StartScene, MiEscena]
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

### 9.3 Comunicar renderer ↔ main (IPC)

Si en el futuro necesitas guardar datos en disco, mostrar diálogos nativos, etc.:

**`electron/main.ts`**

```ts
import { app, BrowserWindow, ipcMain } from 'electron';

ipcMain.handle('guardar-partida', async (_event, datos: string) => {
  // aquí escribirías en disco
  return { ok: true };
});
```

**`electron/preload.ts`**

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform,
  guardarPartida: (datos: string) => ipcRenderer.invoke('guardar-partida', datos)
});
```

### 9.4 Publicar en web (GitHub Pages)

Como `vite.config.ts` usa `base: './'`, las rutas son relativas y el build funciona tanto en la raíz de un dominio como en un subdirectorio (`usuario.github.io/repo/`).

Opción sencilla: mover el contenido de `dist/` a la rama/carpeta que sirva GitHub Pages tras `npm run build`.

Opción recomendada (CI): un workflow de GitHub Actions que ejecute `npm ci && npm run build` y publique `dist/` con `actions/upload-pages-artifact` + `actions/deploy-pages`.

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

**Limitación importante:** electron-builder solo puede generar el instalador de la plataforma en la que ejecutas el build. Para publicar en las tres hay que usar CI (GitHub Actions con una matriz Linux/Windows/macOS). Además, para distribuir de verdad se necesitan **iconos** propios y **firma de código** (obligatoria en macOS y recomendable en Windows).

### 10.3 Qué se incluye en el paquete

Gracias a la configuración de `build.files`, el `app.asar` solo contiene:

```
/dist/**            (juego compilado)
/dist-electron/**   (main.js + preload.js)
/package.json
```

Phaser va dentro del bundle de Vite, por lo que **no** se incluye `node_modules/phaser` (evita ~140 MB extra). Por eso `phaser` figura en `devDependencies`.

---

## 11. Convenciones de TypeScript

- **Tipado estricto** activado (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`) tanto en `tsconfig.json` como en `tsconfig.electron.json`.
- **Campos privados** con `#` (estándar ES2022) para el interior de las clases; `protected` solo en puntos de extensión deliberados y `readonly` para lo que no cambia tras construirse.
- **TypeScript 7** (compilador nativo): `npm run typecheck` usa su `tsc`. El editor puede usar otra versión de TypeScript para el servidor de lenguaje; no afecta a la comprobación de tipos del proyecto.
- **Diseño**: orientado a objetos por defecto (objetos con estado y comportamiento, inyección de dependencias por constructor, composición sobre herencia), con estilo funcional para cálculo sin estado, eventos y datos inmutables. La lógica de dominio vive en `src/sim/` sin depender de Phaser; el detalle está en `AGENTS.md`.
- **Sin comentarios** en el código salvo que aporten algo que el código no exprese.
- El renderer (`tsconfig.json`) solo incluye librerías de navegador (`DOM`); **no** tiene acceso a APIs de Node (`types: []`). Esto evita usar por error `fs`, `path`, etc. en el juego.
- El proceso Electron (`tsconfig.electron.json`) es lo contrario: solo Node, sin DOM.
- Código, identificadores y comentarios van en **inglés**; este manual es la única documentación en español.

---

## 12. Solución de problemas

### La música no suena la primera vez en el navegador
Es la **política de autoplay** del navegador: `audio.play()` se rechaza si no ha habido interacción del usuario. No es un bug. En Electron no ocurre porque `main.ts` desactiva esa política. En web, opciones: dejar que arranque en el primer clic, o aceptar que solo suene a partir de la primera interacción.

### Pantalla negra al abrir el juego desde el fichero
Ocurre al abrir con `file://` (doble clic). Usa `npm run dev` o `npm run preview`. La causa histórica era el loader de audio de Phaser; ya se sustituyó por `new Audio()`.

### Los assets (imágenes) no cargan en la app de escritorio
Asegúrate de que `src/main.ts` tiene `loader: { imageLoadType: 'HTMLImageElement' }`. Si en el futuro usas JSON/atlas, esos sí van por `XHR` y necesitarán un protocolo local propio en Electron.

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
- `no-empty` con `allowEmptyCatch: true`: permite `catch {}` vacíos (se usan en `TapScene` para que un fallo de audio no rompa la escena).
- `no-unused-vars` (aviso) ignora parámetros y capturas con prefijo `_`.
- Entorno de navegador por defecto y Node solo en `electron/` y `scripts/`.
- **Fronteras de `src/sim/`**: no puede importar Phaser, Node, `scenes/`, `objects/` ni `config`, ni usar globales de navegador, `Date` o `Math.random` (se inyecta un `Rng`). Garantiza que el núcleo sea puro y determinista.

El análisis con tipos usa un `tsconfig` por ejecución, por eso `npm run lint` lanza dos: una para el renderer (`tsconfig.json`) y otra para `electron/` y `scripts/` (`tsconfig.electron.json`).

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
- Valorar el protocolo local para Electron si se usan atlas JSON de sprites.
