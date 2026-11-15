# Design

## Context

Hoy la caída es una animación de duración fija:

- `Ingredient` (State) pasa por `idle` → `waiting` → `falling` → `idle` o
  `stacked`. `FallingState` dura `FALL_TICKS` (12 ticks) y solo expone un
  progreso de 0 a 1. La posición la calcula la vista
  (`IngredientView#bottomFor`), que interpola entre el piso de salida y el de
  llegada con `Quadratic.In`.
- `IngredientField#activate` calcula la cadena entera al activar el
  ingrediente: busca los golpeados de forma recursiva, los ordena de abajo
  arriba con `FALL_STAGGER_TICKS` (7 ticks) entre uno y otro y concede 50
  puntos por cada uno en ese momento. Al empezar cada caída llama a
  `CrushTarget.crush(left, right, fromRow, toRow)`, que aplasta a los enemigos de
  esas filas.
- El grosor de apilado vive en la vista (`INGREDIENT_STACK_HEIGHTS` en
  `src/view/art/graphics.ts`, `stackLifts` en `src/objects/stacking.ts`) y la
  spec dice que la simulación no se ve afectada por él.
- Al aterrizar, la vista aplasta el ingrediente con un tween de escala
  (`LANDING_SQUASH`).

### La referencia: medidas en la grabación del original

La grabación (`tmp/ejemplo-partida.webm`, local y sin versionar) dura 56 s, a
1920×1080 y 30 fps, y muestra BurgerTime en MAME, que funciona a 57,44 Hz con
una pantalla de 240×240 (4,5 píxeles de vídeo por píxel del original en
vertical). Se midió así:

- Una **kimografía** por columna de hamburguesa: el perfil vertical de colores
  de la columna en cada fotograma, puesto en fila. Cada ingrediente quieto es
  una línea horizontal y cada caída una diagonal, con sus rebotes y paradas.
- El seguimiento fotograma a fotograma, y por segmento, del borde inferior de
  cada ingrediente (por color: pan, lechuga, carne) a resolución completa.
- Las caídas usadas: columna 3 a 18,6–20,1 s (pan → lechuga → carne, sin
  enemigos), columna 2 a 36,2–37,9 s (lechuga → carne → pan de abajo → plato),
  columna 4 a 21,4–25,7 s y columna 3 a 43,0–46,6 s (pan con una salchicha
  montada: tres pisos y +500 cada vez). La puntuación se siguió en el marcador.

La escala: un piso del original son 32 px (4 casillas de 8 px) y sus
ingredientes miden unos 6 px de alto; en Xantar un piso son 3 casillas (96
unidades) y el pan de arriba mide 18. Las distancias verticales se multiplican
por **3** y los tiempos se conservan (un fotograma del original a 57,44 Hz es
casi un tick de 60 Hz).

| Aspecto | Original (medido) | Xantar |
|---|---|---|
| Caída | velocidad constante, ≈ 1 px por fotograma (≈ 57 px/s): un piso de 32 px en ≈ 0,57 s | 170/32 casillas/s: un piso de 3 casillas en 34 ticks (0,57 s) |
| Inicio | en el mismo fotograma en que se pisa el último segmento | al activarse |
| Golpe a un ingrediente quieto | el de abajo empieza a caer en ese fotograma | igual, por contacto |
| Rebote del que golpea | sube 6–7 px en 2–3 fotogramas de vídeo (≈ 80 ms) | 20/32 casillas en 5 ticks |
| Espera arriba | 6–7 fotogramas de vídeo (≈ 220 ms); total golpe → seguir ≈ 300 ms | 13 ticks (total 18) |
| Llegada a un piso | queda en él; el dibujo se hunde 4–5 px durante ≈ 1 fotograma de vídeo | queda en él; la vista lo hunde 12 unidades y lo devuelve en 60 ms |
| Llegada al plato | rebota ≈ 7 px, espera ≈ 7 fotogramas y vuelve a bajar (≈ 0,4 s de contacto a reposo) | rebote del golpe y vuelta a 170/32 casillas/s (≈ 25 ticks) |
| Enemigo montado | 1 enemigo → 3 pisos (dos veces en el vídeo); "two extra levels for every enemy" | 1 + 2n soportes |
| Parada intermedia | ≈ 8 fotogramas de vídeo desde que toca (≈ 270 ms) | 16 ticks |
| Bonificación | +500 al terminar la caída; el enemigo desaparece | 500 · 2^(n−1) |
| 50 puntos | al terminar cada caída (≈ 0,25 s después); las paradas no puntúan | al quedar quieto |

## Goals / Non-Goals

**Goals:**

- La misma cadencia que el original medida en tiempo, con la simulación como
  única fuente de posiciones y tiempos.
- Que la cadena, el aplastamiento y los enemigos montados salgan del contacto
  entre cuerpos tick a tick: deterministas y probables sin canvas.
- Que la vista solo dibuje la altura interpolada y un adorno al tocar un piso.

**Non-Goals:**

- Cambiar las demás velocidades (chef, enemigos, escaleras) a las del original:
  siguen las del POC.
- El ligero arco de los segmentos durante el rebote (≈ 1 px en el original) y
  la inclinación del ingrediente mientras se pisa.
- El texto flotante "500" del original: es de las puntuaciones flotantes de #24.
- Sonidos nuevos (un silbido de caída): se reutilizan `fall`, `land` y `squash`
  (#29 recoge el pulido del sonido).
- Que un ingrediente golpeado lleve enemigos montados, o que un enemigo se suba
  a uno parado en un piso intermedio: no se ve en el vídeo.

## Decisions

### 1. La simulación es la dueña de la altura de cada ingrediente

`Ingredient` pasa a extender `MovingEntity`: `x` es el centro de sus casillas
(fijo) e `y` la altura de su base en filas, con el mismo convenio que el chef y
los enemigos (quieto en el piso de la fila `r` ⇒ `y = r`). `prevY` permite
interpolar. El campo llama a `beginTick` de sus ingredientes al empezar el tick.
El instantáneo pierde `fallFromRow`, `fallToRow`, `fallProgress` y
`landsOnPlate`; `row` sigue siendo la fila del piso (o del plato) en la que
está, y `stackSlot` se mantiene para el orden de dibujo.

Por qué: el movimiento decide reglas (cuándo se golpea, cuándo se aplasta a un
enemigo, cuándo se completa una hamburguesa y se pasa de nivel). Si la vista lo
animara, pantalla y reglas no coincidirían.

Alternativa descartada: mantener una duración fija por piso y cambiar solo la
curva en la vista. El golpe no podría ocurrir al contacto, el aplastamiento
seguiría al principio, el rebote no retrasaría la cadena y la spec prohíbe
reglas en los tweens de Phaser.

### 2. Constantes de la cadencia en `src/sim/rules.ts`

`FALL_SPEED = fromPx(170)`, `BOUNCE_HEIGHT = fromPx(20)`,
`BOUNCE_RISE_TICKS = 5`, `BOUNCE_HOLD_TICKS = 13`, `RIDER_STOP_TICKS = 16`,
`EXTRA_SUPPORTS_PER_RIDER = 2`, `ENEMY_HEIGHT = fromPx(32)` (alto de un enemigo
para el aplastamiento), `SCORE.riders = 500` e `INGREDIENT_THICKNESS` (decisión
5). Se retiran `FALL_TICKS` y `FALL_STAGGER_TICKS`. La subida del rebote es
lineal, como en el original (sube en 2–3 fotogramas sin suavizado); la vista
interpola entre ticks.

Por qué la escala ×3 en distancias y 1:1 en tiempo: lo que percibe el jugador es
cuánto tarda en bajar un piso y cuánto se queda arriba; el factor sale de los
pisos y del grosor de los ingredientes.

Alternativas descartadas: equivalencia por casilla (×4: 230 unidades/s, un piso
en 0,42 s, visiblemente más rápido que el vídeo) o por fracción de pantalla (el
tablero del original es más bajo: 114 unidades/s, un piso en 0,84 s, más lento).

### 3. Estados del ingrediente

Patrón State, como hoy:

- `IdleState`: quieto en un piso; sus segmentos se pueden pisar.
- `FallingState`: baja a `FALL_SPEED` hacia un soporte (piso o sitio en el
  plato). Sabe cuántos soportes le quedan y si es la vuelta tras el rebote en el
  plato.
- `BouncingState`: sube `BOUNCE_HEIGHT` en `BOUNCE_RISE_TICKS`, espera
  `BOUNCE_HOLD_TICKS` y vuelve a `FallingState` hacia el mismo soporte.
- `StoppedState`: parada intermedia de un ingrediente con enemigos montados;
  tras `RIDER_STOP_TICKS`, `FallingState` hacia el soporte siguiente.
- `StackedState`: apilado; ya no reacciona.

Las fases expuestas son `idle`, `falling`, `bouncing`, `stopped` y `stacked`;
`waiting` desaparece. El ingrediente conoce su movimiento; el campo, su
entorno (soporte de debajo, con quién choca, platos, enemigos), por medio de
`IngredientHost`, como hoy.

### 4. Cadena por contacto en `IngredientField`

En cada tick, para cada ingrediente en movimiento y en orden de id:

1. Avanza su estado.
2. Si baja y su base alcanza la parte de arriba de un ingrediente quieto de la
   fila de su soporte que solapa sus casillas (`fila − grosor`), lo golpea: el
   golpeado pasa a `FallingState` hacia su propio soporte (empieza a moverse en
   el tick siguiente, así el resultado no depende del orden) y se emite
   `ingredientsTriggered`; el que golpea ajusta su base a ese punto y pasa a
   `BouncingState`. Si alcanza a uno que ya se mueve, rebota sin tocarlo.
3. Si llega a su soporte: en un piso emite `ingredientLanded` sin plato y pasa a
   `StoppedState` si le quedan soportes o a `IdleState` si no; en el plato
   emite `ingredientLanded` con el plato y el hueco y rebota, y al volver a
   bajar pasa a `StackedState`.
4. Mientras se mueve, pide a los enemigos que se aplaste quien esté debajo
   (decisión 6).

Al quedar quieto (en `IdleState` o `StackedState`) concede los 50 puntos,
reinicia los segmentos, registra la llegada en el plato (que puede completar la
hamburguesa) y suelta a los enemigos montados. El fin de nivel se sigue
comprobando después del paso del campo, así que llega con el último
ingrediente ya quieto.

Alternativa descartada: conservar la cadena precalculada y ajustar retardos
para imitar el original. Los retardos dependerían de distancias y grosores, y
un ingrediente con enemigos montados, que vuelve a golpear al de abajo en cada
piso, no se puede expresar así.

### 5. El grosor es una regla de la simulación

`INGREDIENT_THICKNESS` (en casillas) pasa a `src/sim/rules.ts` con los valores
de hoy (`fromPx(7.4)`, `fromPx(8.3)`, `fromPx(4.8)`, `fromPx(13)`). `Plate`
recuerda el tipo de cada hueco y da la altura de la pila bajo un hueco. La
vista deja de calcular alturas: se borran `stackLifts` y su prueba, y
`INGREDIENT_STACK_HEIGHTS` sale de `graphics.ts`. Los valores siguen saliendo
del arte (`tmp/blender/metrics.json`); la guía de estilo y el manual dicen dónde
viven ahora.

Alternativa descartada: inyectar los grosores en `Simulation` desde el catálogo
del arte. Ahora deciden reglas (momento del golpe, contacto con el plato,
hamburguesa completa), como las demás constantes de `rules.ts`; inyectarlos
añadiría un colaborador para llevar cuatro números y obligaría a las pruebas a
dárselos.

La superficie del plato está 1 unidad más baja que la de una plataforma en el
dibujo (`PLATE_TOP` frente a `PLATFORM_TOP`); la vista conserva esa diferencia
para los ingredientes con hueco en un plato.

### 6. Aplastamiento por contacto (absorbe #18)

`CrushTarget` se sustituye por `EnemyRoster`, una interfaz que implementa
`Simulation` y que el campo usa sin conocer `Enemy`:

- `board(ingredient)`: monta a los enemigos que están sobre él (decisión 7).
- `crushUnder(ingredient)`: en cada tick en que cae o rebota, aplasta a los
  enemigos activos y no montados con `x` dentro de sus casillas y pies en `y`
  tales que `y − ENEMY_HEIGHT < base ≤ y`. El combo y la reaparición no cambian.
- `release(ingredient)`: suelta a sus enemigos montados.

Los enemigos se mueven después del campo, así que el aplastamiento usa su
posición del tick anterior: un tick de retraso que no se ve. El chef nunca se
aplasta. La condición `base ≤ y` evita aplastar a un enemigo que está encima
del ingrediente cuando este se aleja hacia abajo.

Alternativa descartada: decidir al empezar la caída y retrasar el aplastamiento
hasta que llegue. Aplastaría a enemigos que ya se han ido y salvaría a los que
entran; con una caída tres veces más lenta se nota (es el problema de #18).

### 7. Enemigos montados

- Al activar el chef un ingrediente (no al golpearlo), `board` monta a los
  enemigos activos, aturdidos o no, que están sobre una plataforma (no
  trepando) de su fila y con `x` dentro de sus casillas. El ingrediente baja
  `1 + 2n` soportes.
- `Enemy.ride(carrier)` guarda la posición del ingrediente (un
  `PositionSnapshot`); en su `step` el enemigo solo sigue su `y`, sin cerebro ni
  decisiones. El instantáneo expone `riding`.
- Los montados quedan fuera del contacto con el chef y del aplastamiento.
- `release` los aplasta (inactivos, reaparecen a los 150 ticks), concede
  `500 · 2^(n−1)` con `GameStats.addScore` (sin combo) y emite `ridersDropped`.
- Si el chef pierde una vida, `reset` termina el viaje; el ingrediente termina
  sus soportes y `release` no encuentra a nadie: no hay bonificación ni evento.

### 8. Eventos

- `ingredientsTriggered { ingredientIds }`: ingredientes que empiezan a caer
  (el activado por el chef, o los golpeados). Misma forma que hoy, más
  frecuente.
- `ingredientLanded { ingredientId, plateId, stackSlot }`: cada vez que toca un
  soporte (un piso, intermedio o final, o el plato en el primer contacto). La
  vista lo usa para hundir el ingrediente (solo en pisos) y para el sonido.
- Nuevo `ridersDropped { ingredientId, riders: { enemyId, x, y }[], points }`.
- Puntos y hamburguesas siguen con `scoreChanged` y `burgerDone`.

Alternativa descartada: un evento distinto para los pisos intermedios. Para la
vista es lo mismo (un toque); las reglas lo distinguen por dentro.

### 9. Vista

- `IngredientView.sync(ingredient, alpha)`: base en
  `platformY(y interpolada) − PLATFORM_TOP` (+1 con hueco en un plato). Sin
  `switch` por fase ni `FALL_TICKS`.
- `touchDown()` sustituye a `land()`: solo si el toque es en un piso, el cuerpo
  baja 12 unidades y vuelve en 60 ms (`Quad.easeOut`). Sustituye a
  `LANDING_SQUASH`.
- `GameScene`: sin `stackLifts`; profundidad por `stackSlot` como hoy;
  `ridersDropped` → `EventEffects.squash` en la posición de cada enemigo.
- `enemyAnimation` devuelve `ride` para un enemigo montado; el estado `ride` de
  todos los tipos deja la postura base (sin andar ni bailar).
- `EVENT_CUES`: `ridersDropped` → `squash`.

## Risks / Trade-offs

- [La cascada de una columna de cuatro pasa de ≈ 0,55 s a ≈ 2,4 s] → Es lo que
  se pide; las hamburguesas y el nivel tardan más en completarse. El README lo
  explica.
- [Los grosores de la simulación dependen del arte] → La guía de estilo y el
  manual dicen que, si se vuelve a renderizar un ingrediente, se actualiza
  `INGREDIENT_THICKNESS`; una prueba fija la altura de la hamburguesa clásica.
- [Un ingrediente que llega al plato mientras el de debajo aún rebota puede
  solaparse en el dibujo] → En el nivel clásico llega ≥ 0,4 s después; se acepta
  en niveles irregulares.
- [Solapes parciales con ingredientes de distinto grosor producen dos golpes y
  dos rebotes] → Es determinista y solo pasa en niveles irregulares; se acepta.
- [El sonido de caída suena una vez por golpe] → `CueThrottle` limita las
  repeticiones y los golpes de una columna van separados ≥ 0,5 s.
- [Pruebas que dependen de `FALL_TICKS`, del escalonado o de los puntos al
  activar] → Se reescriben con las reglas nuevas; la de determinismo compara
  `y`.

## Migration Plan

No hay datos guardados ni cambios en el formato de nivel. Se entrega por grupos
de tareas, cada uno en su commit y con el juego ejecutable. Volver atrás es
revertir el PR.
