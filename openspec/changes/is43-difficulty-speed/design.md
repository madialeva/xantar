# Design

## Context

- Las velocidades viven en `src/sim/rules.ts`: `CHEF_SPEED` (115 unidades/s),
  `CLIMB_SPEED` (80) y `ENEMY_SPEED` (68), que `Enemy` usa para andar, para
  subir escaleras y para entrar por las pasarelas. Son las del prototipo.
- `Simulation` es la raíz de composición del núcleo: recibe `level` y `rng`
  (`SimulationOptions`), crea chef, enemigos e `IngredientField`, y delega en
  las fases (State). `DyingPhase` llama a `PhaseHost.respawn()`, que solo
  recoloca al chef y deja a los enemigos fuera con sus retrasos; el campo de
  ingredientes no se toca, así que las pisadas sobreviven a la muerte (la spec
  actual lo exige en «Ingredientes tras perder una vida»).
- `IngredientField` mueve los ingredientes (State: `IdleState`, `FallingState`,
  `BouncingState`, `StoppedState`, `StackedState`) y avisa al resto por tres
  colaboradores: `EventSink`, `GameStats` (puntos y pimienta) y `EnemyRoster`
  (montar, aplastar y soltar enemigos). Un ingrediente que suelta el chef monta
  a los enemigos que tiene encima al empezar la caída y baja `1 + 2n` soportes;
  los golpeados bajan uno. `Plate` reparte los sitios del plato y cuenta los
  aterrizajes. `Ingredient.resetSegments()` ya deshace las pisadas de un
  ingrediente quieto.
- `#checkContact` quita una vida si un enemigo activo, no aturdido y no
  montado toca al chef. `#checkLevelClear` pasa a `levelClear` cuando todas las
  hamburguesas están completas.
- Ajustes: `PlayerSettings` (registro versionado, campos nuevos con su valor
  por defecto al leer), `Settings` (Observer) y `MenuScene`, cuya página de
  opciones solo se abre desde el menú principal. `GameScene.create()` crea una
  `Simulation` nueva cada vez que se elige Jugar.

### La referencia: medidas en la grabación del original

`tmp/ejemplo-partida-2.webm` (local, sin versionar): 6 min 19 s a 1920×1080 y
30 fps (cada fotograma de vídeo sale duplicado: 15 imágenes distintas por
segundo), BurgerTime en MAME a 57,44 Hz. Muestra las pantallas 1 (20–121 s), 2
(125,6–216 s), 3 (219,1–306 s) y 4 (307,7–373 s), con muertes a 30,9 s,
201,7 s, ~322 s, ~342 s y ~370 s.

Escala: MAME muestra la pantalla de 240×240 del original con proporción 4:3
(810×1080 píxeles de vídeo, x = 555–1365): 4,5 píxeles de vídeo por píxel del
original en vertical, pero **3,375 en horizontal** (un ingrediente de 32 px
mide unos 103 píxeles de vídeo). El recorte habitual (`crop=1080:1080:420:0`,
`scale=240:240`) usa 4,5 en los dos ejes, así que las distancias horizontales
medidas en él se multiplican por 4/3. A Xantar: un píxel del original son 2
unidades (#45) y los segundos se conservan.

Método: se separaron por color los sprites de cada fotograma (perritos rojos,
huevo blanco, pepinillos verdes, chef por su gorro y su cuerpo blancos), se
siguieron de fotograma en fotograma y se ajustó una recta a cada tramo de al
menos 0,7 s recto en horizontal o en vertical. Se tomó la mediana por tipo de
movimiento y por tiempo desde que empieza cada tablero.

| Movimiento | Original | Por fotograma | Xantar | Hoy |
|---|---|---|---|---|
| Chef andando | 42,9 px/s | 0,75 px | 86 u/s | 115 |
| Chef en escalera | 21,5 px/s | 0,37 px | 43 u/s | 80 |
| Enemigo andando (al empezar) | 26,7 px/s | 0,47 px | 54 u/s | 68 |
| Enemigo en escalera (al empezar) | 13,5 px/s | 0,24 px | 27 u/s | 68 |

Los enemigos van a 5/8 del chef andando y subiendo, y suben a la mitad de lo
que andan. Perritos, huevo y pepinillos van igual de rápidos.

La velocidad de los enemigos sube con el tiempo de juego del tablero, contado
desde que empieza o desde que se vuelve a jugar tras perder una vida
(pantallas 1 a 3 juntas):

| Tiempo de juego | Andando | Subiendo | Factor |
|---|---|---|---|
| 0–21 s | 26,7 px/s | 13,5 px/s | 1 |
| 21–43 s | 27,6 px/s | 14,0 px/s | 1,03 |
| 43–65 s | 28,5 px/s | 14,5 px/s | 1,07 |
| desde 65 s | 33,3 px/s | 16,9 px/s | 1,25 |

- El acelerón llega a 65,2 s en la pantalla 1 (contando desde la vuelta tras
  la muerte de 30,9 s), a 65,4 s en la 2 y hacia los 67 s en la 3 (pocos
  datos): tres intervalos de unos 21,75 s.
- En la pantalla 2 los enemigos iban a ×1,25 cuando murió el chef (201,7 s) y
  volvieron a ×1 tras "GET READY" (207 s).
- La pantalla 4 empieza ya en ×1,07, al principio y tras perder una vida, y
  pasa a ×1,25 hacia los 21 s de juego.
- Ningún tablero de la grabación pasa de unos 87 s de juego: no se sabe si hay
  más escalones.

Otros hechos de la grabación:

- **Enemigos por pantalla:** 3 perritos y 1 huevo en las pantallas 1 y 2;
  2 perritos, 2 pepinillos y 1 huevo en la 3; 4 perritos y 2 pepinillos en la 4.
- **Muerte con pisadas:** a 30,9 s atrapan al chef con la mitad izquierda del
  pan de arriba de la calle 3 pisada; tras "GET READY" (36,5 s) el pan está
  entero.
- **Final de la pantalla 1:** a 120,27 s el chef pisa el último segmento; el
  pan toca la hamburguesa a 120,43 s y rebota; a 120,70 s el chef pasa a la
  pose de celebración con el pan aún en el aire; los enemigos siguen andando
  hasta que el pan se asienta y todo se congela a 121,0 s. No se ve ningún
  contacto en ese intervalo.

## Goals / Non-Goals

**Goals:**

- Las proporciones del original entre chef, enemigos y caídas, con la curva de
  ritmo de Normal medida en la grabación.
- Una sola fuente de verdad para la velocidad de los enemigos (la dificultad y
  el reloj de juego, en la simulación) y deterministas sin canvas.
- Que el tablero asegurado salga de las mismas reglas de caída que el juego, no
  de una aproximación paralela.

**Non-Goals:**

- Más enemigos por nivel: van con cada pantalla del original (#49).
- Velocidades distintas por tipo de enemigo (#17): en la grabación son iguales.
- Escalones más allá de 65 s o vueltas más rápidas tras la sexta pantalla: no
  se ven en la grabación.
- Una señal en pantalla del tablero asegurado, como la pose de celebración del
  original al tocar el plato.
- Un récord por dificultad o mostrar la dificultad en el HUD (#26).
- Cambiar la dificultad durante una partida: las opciones solo se abren desde el
  menú principal.
- Reajustar el alcance de la pimienta y del contacto (#47).
- Estrechar las calles del nivel clásico a las del original (decisión de #45).

## Decisions

### 1. Velocidades del original en `rules.ts`

`CHEF_SPEED = fromPx(86)`, `CLIMB_SPEED = fromPx(43)`,
`ENEMY_WALK_SPEED = fromPx(54)` y `ENEMY_CLIMB_SPEED = fromPx(27)` (sustituyen
a `ENEMY_SPEED`). La curva y los factores también son constantes del núcleo:
`PACE_STEPS = [1, 1.03, 1.07, 1.25]`, `PACE_STEP_TICKS = fromMs(21_750)` (1305
ticks), `LATE_PACE_LEVEL = 4` con `LATE_PACE_FIRST_STEP = 2`, `EASY_PACE = 0.85`
y `HARD_PACE = 1.25`.

Por qué: con las caídas ya en la escala del original, mantener el chef y los
enemigos del prototipo deja las caídas relativamente lentas y a los enemigos
trepando a la misma velocidad que andan. El autor eligió adoptar todas las del
original.

Alternativa descartada: conservar el chef a 115/80 y escalar los enemigos para
mantener la proporción (72/36). Las caídas quedarían más lentas que en el
original respecto al chef.

### 2. Dificultad del dominio y ritmo como Strategy

`src/sim/difficulty.ts` define `type Difficulty = 'easy' | 'normal' | 'hard'`
(con `DIFFICULTIES` como `as const` y un `isDifficulty` para los ajustes) y la
interfaz `EnemyPace` (Strategy):

```ts
interface EnemyPace {
  /** Speed factor of the enemies on a level after some ticks of play on its board. */
  factor(level: number, playTicks: number): number;
}
```

con dos implementaciones sin estado: un ritmo constante (Fácil, Difícil) y el
ritmo creciente de Normal (escalón inicial según el nivel, uno más cada
`PACE_STEP_TICKS`, tope en el último). `paceFor(difficulty)` es la fábrica.

Por qué: es donde varía el comportamiento; el resto de la simulación no
pregunta por la dificultad. Un `switch` sobre la dificultad en `Simulation`
mezclaría la curva con la composición, y una nueva variante (un modo
"arcade" con más escalones, por ejemplo) sería otra Strategy.

Alternativa descartada: multiplicadores por dificultad dentro de `Enemy`. El
enemigo no sabe del nivel ni del reloj del tablero, y #17 añadirá parámetros
por tipo que se componen mejor fuera.

### 3. El reloj de juego lo lleva la simulación y los enemigos reciben su paso

`SimulationOptions` gana `difficulty?: Difficulty` (Normal por defecto).
`Simulation` guarda su `EnemyPace` y un contador `#playTicks` que suma uno en
cada tick de `playing` y vuelve a cero en `startBoard()` y al volver a jugar
tras perder una vida. En cada tick calcula el paso de los enemigos,
`{ walk: ENEMY_WALK_SPEED · f, climb: ENEMY_CLIMB_SPEED · f }`, y se lo pasa a
`enemy.step(chef, rng, gait)`. `Enemy` usa `gait.walk` al andar y al entrar por
la pasarela y `gait.climb` en la escalera. La simulación expone el factor del
momento (`pace`) para las pruebas.

Por qué: el reloj depende de sucesos de la partida (tablero nuevo, vida
perdida) que solo conoce la simulación; pasar el paso como argumento deja a
`Enemy` sin estado compartido y fácil de probar con cualquier velocidad. El
tiempo en `ready`, `dying`, `levelClear` y la pausa no cuenta porque en ellos
no se llama a `#playTick`.

Alternativa descartada: inyectar en cada enemigo un objeto de ritmo mutable y
compartido. Es estado oculto que cambia por debajo del enemigo.

### 4. Deshacer las pisadas al volver a jugar

`PhaseHost.respawn()` pasa a hacer tres cosas: recolocar a chef y enemigos
(como hoy), poner a cero el reloj de juego y pedir al campo que deshaga las
pisadas (`IngredientField#liftStomps()`, que llama a `resetSegments()` en cada
ingrediente quieto). Los apilados no cambian y los que caían siguen su estado,
congelados hasta que vuelve `playing`. No hace falta evento: la vista dibuja las
profundidades desde el instantáneo en cada fotograma.

Alternativa descartada: reconstruir el campo entero, como al empezar el
tablero. Devolvería arriba los ingredientes ya caídos.

### 5. Tablero asegurado: previsión sobre una copia del campo

Cuando el chef suelta un ingrediente (`#startFalls` con `dropped`), y si el
tablero aún no está asegurado, `IngredientField` hace una previsión: crea una
copia de sí mismo (Prototype) con copias de sus platos y de sus ingredientes,
cada uno en el mismo estado, y colaboradores mudos: un `EventSink` que descarta
los eventos, un `EnemyRoster` que no monta, no aplasta ni suelta a nadie, y un
receptor de puntos que los ignora. Avanza la copia, sin chef, hasta que ningún
ingrediente se mueve, y mira si todas las hamburguesas están completas. Si lo
están, el campo queda asegurado (`isSecured`) hasta que se reconstruye el
tablero. `Simulation#checkContact` no quita vidas con el campo asegurado.

Para copiar: `Plate#copy()`, `Ingredient#copyFor(host)` y `copy()` en cada
estado del ingrediente (los contadores de `BouncingState` y `StoppedState` y las
profundidades de `IdleState` son su único estado mutable). Para silenciar los
puntos, el campo deja de depender de `GameStats` y depende de una interfaz
pequeña, `FieldRewards` (`addScore`, `grantPepper`), que `GameStats` cumple sin
cambios.

Por qué es exacto: lo único que cambia el futuro de los ingredientes son las
pisadas del chef. Los enemigos no lo cambian: los montados se cuentan al empezar
la caída, y aplastar o soltar enemigos no mueve ingredientes. Y es monótono: una
caída más solo puede añadir aterrizajes (un plato está completo cuando le han
caído todos los suyos), así que un tablero asegurado no deja de estarlo y basta
con prever en cada ingrediente soltado.

Coste: la copia tiene una veintena de ingredientes y avanza lo que les quede de
caída (unos cientos de ticks como mucho), solo cuando el chef suelta un
ingrediente; un tope de ticks protege de un bucle por un error.

Alternativas descartadas:

- **Regla del plato:** asegurado cuando cada plato tiene todos sus ingredientes
  apilados o con sitio asignado. Es sencilla, pero solo lo detecta cuando el
  último empieza a caer desde el piso más bajo: no cubre al ingrediente con
  enemigos montados que sale de un piso superior ni la cadena que pide el autor.
- **Cálculo por columnas** (pisos, montados y empujones): repetiría las reglas
  de golpe, rebote y parada y acabaría desviándose de ellas.
- **Guardar y restaurar el campo real** (Memento): avanzar el campo real emite
  eventos y toca puntos y enemigos; habría que silenciarlo igual y restaurarlo
  es más arriesgado que tirar una copia.

### 6. La dificultad en los ajustes y en el menú

`PlayerSettings` gana `difficulty` (Normal por defecto), leído con
`isDifficulty` como los demás campos; el registro sigue en la versión 1.
`Settings#setDifficulty()` guarda y avisa. En `MenuScene`, Dificultad es la
primera opción: ← y → recorren Fácil, Normal y Difícil en círculo, con el mismo
`cycle` que el idioma (los índices de idioma, Controles y Volver se desplazan
uno). `GameScene.create()` pasa `settings.values.difficulty` a la
`Simulation`. Textos nuevos en los catálogos: `options.difficulty` y
`difficulty.easy|normal|hard` (DIFICULTAD, FÁCIL, NORMAL, DIFÍCIL / DIFFICULTY,
EASY, NORMAL, HARD).

### 7. Pruebas

- Ritmo: los dos ritmos y la fábrica (factores constantes, escalones a 1305,
  2610 y 3915 ticks, tope, inicio en el nivel 4).
- `Enemy`: anda y entra a `gait.walk`, sube a `gait.climb`.
- `Chef`: 86 unidades en 60 ticks andando y 43 subiendo.
- Reglas de `Simulation`: velocidades por dificultad, reloj que se para fuera de
  `playing` y vuelve a cero al perder una vida y al empezar el tablero, pisadas
  deshechas al volver a jugar con apilados y caídas intactos, tablero asegurado
  en los cuatro casos de la spec y contacto normal cuando la caída no basta.
- `IngredientField`: la copia no emite eventos ni da puntos y deja intacto el
  campo real; previsión verdadera y falsa; monotonía con una caída posterior.
- Ajustes: lectura con y sin dificultad, valor desconocido, `setDifficulty`.
- Las pruebas que suponen las velocidades antiguas pasan a usar las constantes.

## Risks / Trade-offs

- **[El juego se siente más lento]** → Es el original: el chef un 25 % más
  lento andando y casi la mitad subiendo. El autor lo valida jugando antes del
  PR; los valores están en `rules.ts`.
- **[Fácil y Difícil son propuestas]** (×0,85 y ×1,25, la velocidad más alta
  medida) → Si al jugar no se sienten bien, se ajustan las constantes y, con
  ellas, la spec y las pruebas en este mismo cambio.
- **[Las calles de Xantar son más anchas]** (7 casillas frente a 6 caracteres:
  el campo mide 31 casillas y el del original 26) → Cruzar un piso dura un 19 %
  más que en el original. Se acepta; cambiarlo es rehacer el tablero de #45.
- **[Escalón inicial del nivel 4 con un solo ejemplo]** → La pantalla 4 empieza
  en ×1,07 dos veces en la grabación; si #49 muestra que va con la pantalla y no
  con el número de nivel, pasará a ser un dato del nivel.
- **[Enemigos que atraviesan al chef]** → Con el tablero asegurado, un enemigo
  puede pasar por encima del chef sin consecuencias y sin aviso. Es lo que pide
  el autor; una señal visual queda fuera (Non-Goals).
- **[La copia y el campo real se separan]** → Si se añade estado a un
  ingrediente y no a su `copy()`, la previsión fallaría en silencio; una prueba
  compara, tick a tick, una caída real con la de su copia.
- **[Récord compartido]** → Una partida en Fácil puede batir el récord de una en
  Normal. Se acepta hasta la tabla de récords (#26).

## Migration Plan

Sin migración: el registro de ajustes sigue en la versión 1 y la dificultad
ausente se lee como Normal. Volver atrás es revertir el cambio; un registro con
`difficulty` se sigue leyendo en la versión anterior, que ignora el campo.
