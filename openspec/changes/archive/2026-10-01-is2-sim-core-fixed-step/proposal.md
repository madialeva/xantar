# Proposal

Seguimiento: issue #2 (hito `v1.0.0`), primera del plan de hoja de ruta
(#3 modelo de nivel, #4 pipeline visual, #5 escenas e i18n, #6
input/audio/CI/Electron, #7 editor).

## Why

El POC actual mezcla simulación y presentación: `GameScene` (462 líneas) guarda
el estado de partida y aplica las reglas, y `Chef`, `Enemy` e `Ingredient` son
`Container` de Phaser que a la vez contienen la lógica. Esto impide testear
nada sin un canvas, hace que la lógica dependa del framerate (`delta`
variable con umbrales en píxeles como `< 3`), deja estado asíncrono en tweens y
`delayedCall` que sobreviven a un reinicio de tablero, y no permite
determinismo ni replays. Todos los cambios posteriores (nivel como datos,
editor de niveles, IA por grafo, estilo visual) se apoyan en tener antes un
núcleo de simulación independiente de Phaser; hacerlo ahora cuesta ~1.000
líneas y no 10.000.

## What Changes

- **Nuevo núcleo de simulación** en `src/sim/`, TypeScript puro (sin Phaser ni
  DOM), **modelado como objetos** (clases con estado encapsulado y
  comportamiento propio, colaboradores inyectados por interfaz, patrones
  Strategy/State/Observer/Factory donde varía el comportamiento) con estilo
  funcional para el cálculo sin estado y los eventos. Contiene el estado de la
  partida y todas las reglas (chef, ingredientes, enemigos, pimienta,
  puntuación, vidas, victoria).
- **Paso fijo a 60 Hz** con acumulador y límite de pasos por fotograma. La
  simulación avanza en *ticks* enteros y trabaja en **unidades lógicas**
  (1 tile = 1 unidad), no en píxeles ni milisegundos.
- **Nivel como datos**: el núcleo recibe una descripción estructurada del nivel
  (plataformas, escaleras, platos, ingredientes, posiciones iniciales) en lugar
  de constantes globales. El nivel actual se migra a ese formato.
- **Eventos de simulación** (`ingredientLanded`, `enemySquashed`, `burgerDone`,
  `chefHit`…) que la vista consume para animaciones, flashes, HUD y, más
  adelante, audio.
- **RNG con semilla** inyectado en la simulación; se prohíbe `Math.random` en
  `src/sim/`.
- **La caída de ingredientes, el aturdimiento y la reaparición pasan a ser
  estado de simulación** (contadores de ticks), no tweens ni `delayedCall`.
- **`GameScene` y los objetos de `src/objects/` pasan a ser capa de vista**:
  leen el estado de la simulación a través de interfaces de solo lectura, lo
  interpolan y lo dibujan; traducen eventos a efectos.
- **Tests con Vitest** sobre el núcleo: reglas por objeto, determinismo y paso
  fijo. Nuevo script `npm run test`.
- **Migración de ESLint a Oxlint con tsgolint** (reglas con tipos sobre el
  compilador nativo de TypeScript 7) y **guardas de frontera**: `src/sim/` no
  puede importar Phaser, usar globales de navegador ni `Math.random`. Prettier
  se mantiene. Se corrigen los dos problemas reales que las nuevas reglas
  detectan en el código actual.
- **Actualización de la toolchain** a las últimas versiones estables
  compatibles (Vite 8, Vitest 5, TypeScript 7 y parches de Prettier,
  Electron…), abandonando la compatibilidad con Node anterior a 22.12
  (`engines` y `.nvmrc`).
- **Sin cambios de jugabilidad**: el objetivo es paridad con el POC (salvo
  diferencias inevitables de redondeo a ticks, documentadas en el diseño). Los
  desajustes entre el README y el comportamiento (dificultad por nivel, combo,
  aplastamiento por colisión) **no** se corrigen aquí.
- Actualización de `AGENTS.md` (versiones y regla de la frontera `src/sim/`),
  de `README.md` (requisito de Node) y de `docs/MANUAL.md` (versiones,
  arquitectura y convenciones).
- Al archivar el cambio, la sección Non-Goals del `design.md` alimentará issues
  de seguimiento (regla 9 de `AGENTS.md`); las líneas que ya cubre una issue de
  la hoja de ruta (#3–#7) se enlazan a ella en lugar de duplicarse.

## Capabilities

### New Capabilities

- `simulation-core`: contrato del núcleo de simulación: pureza (sin Phaser/DOM),
  paso fijo en ticks, unidades lógicas, entrada abstracta, eventos, RNG con
  semilla y determinismo reproducible.
- `level-data`: estructura de datos que describe un nivel y su carga con
  validación mínima de integridad; agrupación derivada de ingredientes en
  columnas de caída.
- `gameplay-rules`: reglas de juego vigentes del POC formalizadas como línea
  base: movimiento del chef, escaleras, recorrido y caída de ingredientes,
  apilado en el plato, enemigos, pimienta, puntuación, vidas y victoria.
- `view-adapter`: capa Phaser que ejecuta la simulación con acumulador de paso
  fijo, interpola para dibujar y traduce eventos a efectos visuales.

### Modified Capabilities

<!-- No hay especificaciones previas en openspec/specs/: estas son las
     primeras, y fijan como línea base lo que ya hace el POC. -->

## Impact

- **Código**: nuevo `src/sim/` y `src/levels/`; se reescriben `src/scenes/GameScene.ts`
  y `src/objects/{Chef,Enemy,Ingredient}.ts` como vistas; `src/level.ts` se
  sustituye por la navegación del núcleo; `src/config.ts` queda con lo propio
  de la vista (tamaño de tile, colores, conversiones) y las constantes de
  reglas pasan al núcleo en unidades lógicas.
- **Dependencias**: `vitest` como **devDependency**; actualización de las
  devDependencies existentes (Vite 8, TypeScript 7, Prettier, Electron, etc.);
  `oxlint` y `oxlint-tsgolint` sustituyen a ESLint, `typescript-eslint`,
  `@eslint/js`, `globals` y `eslint-config-prettier`. No hay dependencias de
  ejecución nuevas.
- **Entorno**: Node mínimo 22.12 (`engines`), `.nvmrc` con 24. Cambia el
  requisito documentado (antes 20.19+).
- **Tooling**: script `test`, configuración de Vitest, `.oxlintrc.json` (con las
  reglas de frontera de `src/sim/`) en lugar de `eslint.config.js`. El comando de verificación previa a la
  entrega pasa a incluir
  `npm run test`.
- **Documentación**: `AGENTS.md`, `README.md` (requisitos) y `docs/MANUAL.md`.
- **Fuera de alcance** (cambios posteriores del hito `v1.0.0`): segmentos de
  ingrediente, grafo de navegación, registro de piezas, formato de rejilla y
  validador completo, y movimiento sobre grafo con inversión a mitad de
  escalera (#3); SVG, temas y paneles laterales (#4); máquina de estados y
  escenas, i18n (#5); input abstracto, audio, CI y Electron (#6); editor (#7).
