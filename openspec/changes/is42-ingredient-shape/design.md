# Design

## Context

- `Ingredient` (`src/sim/entities/Ingredient.ts`) guarda en `IdleState` qué
  segmentos están pisados (`stomped: boolean[]`). Los demás estados
  (`falling`, `bouncing`, `stopped`) dan todos los segmentos como pisados y
  `stacked`, ninguno. `IngredientField` activa el ingrediente con `allStomped` y
  lo reinicia con `resetSegments`.
- `IngredientView` (`src/objects/IngredientView.ts`) baja `STOMP_DEPTH` = 3
  unidades cada segmento que la instantánea da como pisado. Como al caer todos
  cuentan como pisados, el ingrediente cae entero 3 unidades más bajo. Al tocar
  un piso (`touchDown`, desde el evento `ingredientLanded` sin plato) hunde el
  cuerpo 8 unidades y lo devuelve en 60 ms.
- La instantánea ya incluye la fase (`phase`), así que la vista sabe cuándo
  rebota un ingrediente.
- El pan de arriba (`build_bun_top` en `tools/blender/ingredients.py`) barre un
  perfil de cúpula (`crown_profile`, de 13,5 de alto) alrededor de una huella de
  estadio: recta a lo largo y con medio disco en cada punta. Visto de frente,
  el perfil es el mismo en las puntas que en el centro: los extremos suben casi
  en vertical, como un pan de perrito. El tramo central se repite, así que solo
  puede cambiar a lo largo de x dentro del primer y el último trozo.
- La lechuga son dos hojas (`LETTUCE_LAYERS`, con la parte alta a 5,2 y 7,0)
  en una imagen de 16×12; la carne, un disco de 9,2 de alto
  (`build_patty`) en una de 16×14. El color de la carne sale de una rampa que va
  de `#8C6A54` a `#100905` (`patty_material`). `INGREDIENT_HEIGHTS`
  (`src/view/art/graphics.ts`) da el alto de cada imagen y
  `INGREDIENT_THICKNESS` (`src/sim/rules.ts`), el grosor visible de cada
  ingrediente, medido en el render (`tmp/blender/metrics.json`): pan de abajo
  7,4, carne 8,3, lechuga 4,8 y pan de arriba 13. Las reglas lo usan para el
  golpe y el apilado.
- En las imágenes actuales, la luminancia media de la carne es 44; la del fondo
  del tablero (`#1b2130`), unos 32; la de la lechuga, 111; y la de los panes,
  118–129.
- Escala: una casilla son 16 unidades, un carácter del original a ×2. En
  vertical, 1 px del original son 2 unidades. Un tick de 60 Hz es casi un
  fotograma del original (57,44 Hz).

### Medidas del original

En la grabación (`tmp/ejemplo-partida.webm`, 30 fps, 4,5 px de vídeo por píxel
del original en vertical) se reconstruyó la imagen a 240×240 y, para cada
ingrediente, se siguió fotograma a fotograma el borde inferior de cada uno de
sus cuatro caracteres. La forma se compara con la de ese ingrediente en reposo,
porque el dibujo de la carne ya es más bajo en el centro.

| Momento | Original (px) | Casos |
|---|---|---|
| Pisar 1, 2 y 3 segmentos de izquierda a derecha | 1·0·0·0 → 2·1·0·0 → 3·2·1·0 | pan de las calles 3 y 4 (18,0–18,4 s y 19,1–20,2 s); lechuga de la calle 3 (40,8–41,1 s) |
| Pisar 1, 2 y 3 de derecha a izquierda | 0·0·0·1 → 0·0·1·2 → 0·1·2·3 | lechugas del piso 5 (28,0–28,4 s y 29,1–29,5 s) |
| Rampa con el chef lejos | no cambia | 29,5–36,2 s (calle 2) |
| Pisar el cuarto | plano en el fotograma siguiente, ya cayendo | todas |
| Caída | plano | todas |
| Rebote del que golpea (subida y espera, ≈ 7 fotogramas de vídeo) | extremos 1 px más bajos (la lechuga, 2) | pan 18,93–19,13 s; lechuga 19,60–19,77 s; lechuga en el plato 37,53–37,73 s |
| Tocar un piso | 1 fotograma hundido 4–5 px; luego extremos 1 px más bajos que el reposo durante ≈ 7 fotogramas de vídeo (≈ 0,23 s) | pan de la calle 3 (19,47–19,70 s) |
| Golpe | 1 fotograma con el centro 1 px más bajo | varias |
| Pan de arriba en reposo | 3·4·5·6·6·7…7·6·6·5·4 px de alto (columnas de vídeo, ≈ 1,4 px del original cada una) | calle 4, 11,2 s |
| Alto en reposo | carne 7–8 px, lechuga 5–6 px, pan de arriba 7 px, pan de abajo 7 px | 11,2 s, todas las calles |
| Color de la carne | marrón anaranjado vivo (≈ `#DE6700`) | 11,2 s |

## Goals / Non-Goals

**Goals:**

- Que el ingrediente a medio pisar se vea inclinado como en el original y no
  partido por un escalón.
- Que el ingrediente caiga plano y se arquee un poco al rebotar y al tocar un
  piso.
- Que el pan de arriba parezca el de una hamburguesa: una cúpula que se afina
  hacia los extremos.
- Que la simulación siga siendo la única que decide el estado de los segmentos:
  la vista solo dibuja.
- Que la lechuga, la carne y el pan de abajo tengan un grosor cercano al del
  original y que la
  carne se reconozca sobre el fondo del tablero.

**Non-Goals:**

- El fotograma suelto con el centro hundido al golpear: dura unos 2 ticks y no
  se percibe.
- Que la lechuga se arquee el doble que los demás y caiga con los extremos algo
  bajos tras ser golpeada: parece un detalle del sprite de la lechuga del
  original; se usa la misma medida para todos.
- Copiar el naranja del original para la carne: el arte es realista y la carne
  tiene que seguir pareciendo carne.
- Cambiar las reglas de pisado, la activación o la cadencia de la caída.

## Decisions

### 1. La profundidad de cada segmento es estado de la simulación

`IdleState` pasa de guardar qué segmentos están pisados a guardar cuántos
escalones ha bajado cada uno (`#sink: number[]`, 0 sin pisar). Al pisar un
segmento sin pisar, los que ya están pisados suben uno y el nuevo pasa a 1.
Pisar uno ya pisado no cambia nada, como hoy. `stomped` se deriva
(`sink > 0`), así que las reglas, los eventos y `allStomped` no cambian.

`IngredientSnapshot` gana `sink: readonly number[]`. Fuera de `IdleState`
(caída, rebote, parada con montados, en el plato) vale todo cero: el
ingrediente está plano. `resetSegments` lo pone a cero.

La grabación solo tiene recorridos en un sentido. Para uno abandonado y
retomado por el otro lado (pisar 0 y 1, irse, pisar 3) se aplica la misma
regla: 3·2·0·1. Es determinista y no cambia la jugabilidad.

Alternativas descartadas:

- Que la vista deduzca el orden comparando instantáneas. Tendría estado propio
  que se pierde al reiniciar el tablero o al reconstruir la vista, y decidiría
  algo del dominio.
- Guardar el orden de pisado en lugar de la profundidad. Da lo mismo, pero
  obliga a la vista a calcular la rampa; la profundidad ya es lo que se dibuja.

### 2. Un escalón son 2 unidades, dibujados como una pendiente continua

Cada segmento queda `sink · STOMP_STEP` unidades por debajo de su sitio, con
`STOMP_STEP = 2` (1 px del original). Con cuatro segmentos la rampa llega a 6
unidades en el primero pisado (hoy 3); con tres, a 4, y con dos, a 2. Se
retira `STOMP_DEPTH`. Como la caída ya no da los segmentos como pisados, el
ingrediente cae plano.

En el original cada escalón es 1 px y la rampa se lee como una pendiente. Con
el arte a alta resolución, los escalones de 2 unidades se ven como cortes
verticales en la hoja de arte. Por eso cada segmento se dibuja girado: el borde
entre dos segmentos queda a la media de sus profundidades, el centro de cada
uno a la media de sus dos bordes y su giro es la pendiente entre ellos (unos 4°
o 7°). Los segmentos girados se dibujan media unidad más anchos por cada lado
para que no se abra una rendija en las uniones, y como el tramo central se
repite sin costuras, el solape no se nota. Un segmento sin pisar junto a uno
pisado se inclina un poco hacia él; en el original cambia de escalón en ese
borde, pero la diferencia es de medio píxel.

Alternativa descartada: los escalones sin girar (la primera versión de este
cambio). Se veían como una escalera, que es lo que el autor quería evitar.

### 3. El arco es solo dibujo

En un ingrediente de tres o más segmentos, la vista baja los dos extremos
`ARCH_DEPTH = 2` unidades (1 px):

- mientras `phase` es `bouncing` (subida y espera del rebote, también al llegar
  al plato);
- durante `TOUCH_DOWN_ARCH_MS = 230` ms después de `touchDown`, que se lanza al
  tocar un piso, también en las paradas de un ingrediente con montados. El
  hundimiento de 8 unidades de `touchDown` se mantiene.

Con dos segmentos no hay centro y no se arquea.

El arco se dibuja con los mismos giros, así que también es una curva suave.

La cuenta de la pose de cada segmento (altura, giro y ancho) va en una función
pura de la vista, `segmentPoses(snapshot, arched)` en
`src/objects/segmentPoses.ts`, que se prueba con Vitest sin canvas. `IngredientView` decide `arched` (fase o plazo tras
`touchDown`, con el reloj de la escena) y aplica el resultado.

Alternativa descartada: un estado de "recién aterrizado" en la simulación. Las
reglas no dependen de él y añadiría ticks a un estado que solo existe para
dibujar.

### 4. El pan de arriba se afina en los trozos de los extremos

En `build_bun_top`, después de barrer el perfil, la altura de cada vértice por
encima del pie (2 unidades) se multiplica por `crown_taper(x)`:

- 1 en los dos tramos centrales (16 ≤ x ≤ 48), para que se sigan repitiendo sin
  costuras;
- en el primer y el último trozo, un cuarto de elipse que baja desde 1 en el
  borde interior hasta `CROWN_TIP = 0,35` en la punta. Con el pie, la punta
  mide 2 + 0,35 · 11,5 ≈ 6 unidades de 13,5 (un 44 %; en el original, unos 3 px
  de 7). En el borde interior la pendiente es cero, así que la unión con el
  tramo central es suave.

Las semillas de sésamo se colocan con la misma función, para que sigan sobre
la superficie. Solo se vuelve a renderizar `bunTop`
(`--only bunTop`). El centro conserva 13,5 de alto, así que el grosor de apilado
(13) no debería cambiar; se comprueba en `metrics.json`.

Alternativa descartada: recortar los PNG actuales con una máscara. La luz y las
sombras no seguirían la nueva forma.

### 5. Lechuga, carne y pan de abajo más altos

Se busca un grosor visible cercano al del original (×2: carne 14–16, lechuga
10–12, pan de abajo 14) sin que la carne parezca un ladrillo junto a un pan de
13:

- **Carne:** el disco pasa de 9,2 a unas 13 unidades de alto, con un grosor
  visible de unas 12. Su imagen pasa a 16×18.
- **Lechuga:** se suben la parte alta y el borde de las dos hojas (de 5,2 y 7,0
  a unas 8,5 y 10,5) para que su grosor visible sea de unas 8. Su imagen pasa a
  16×16.
- **Pan de abajo:** el talón pasa de 8,4 a unas 12 unidades de alto, con un
  grosor visible de unas 11 y la miga del corte a la vista. Su imagen pasa a
  16×18.

Las tres medidas se ajustan mirando el render. `INGREDIENT_THICKNESS`,
`INGREDIENT_HEIGHTS`, el catálogo y el requisito "Grosor de los ingredientes"
toman los valores medidos en `metrics.json`; si no salen 12, 8 y 11 exactos, se
corrige la delta de la spec con los medidos. Se vuelven a renderizar `lettuce`,
`patty` y `bunBottom`.

Consecuencias en el juego: un ingrediente que cae golpea antes a una lechuga o
a una carne quietas (su parte de arriba está más alta) y cada hamburguesa
completa mide unas 10 unidades más en el plato (de 33,5 a unos 44). Entre el
piso inferior (fila 23) y los platos (fila 28) hay 80 unidades, así que caben.

Alternativa descartada: llegar a las alturas del original (carne 14–16, pan
de abajo 14). Con la forma realista, la carne y el pan de abajo quedarían más
gruesos que el pan de arriba.

### 6. Carne más clara

En `patty_material` la rampa de color sube de tono: de un marrón dorado claro
(≈ `#B98458`) en las zonas altas a uno medio cálido (≈ `#7A4A2A`), dejando los
marrones muy oscuros (≈ `#2A160C`) solo para las marcas de parrilla y las
grietas. El objetivo es una luminancia media de la imagen de 80–100: muy por
encima del fondo y por debajo de los panes, así que se sigue distinguiendo del
pan de abajo al apilarla. Se comprueba midiendo los PNG con el mismo script que
dio el 44 de hoy, y en el juego.

### 7. Pruebas

- `Ingredient.test.ts`: rampa en los dos sentidos, recorrido abandonado y
  retomado, volver a pisar sin cambios, profundidad cero al caer, al rebotar,
  en el plato y tras `resetSegments`, e ingredientes de dos y tres segmentos.
- `IngredientField.test.ts`: el chef cruzando un ingrediente deja la rampa.
- Prueba de `segmentPoses`: plano en reposo y al caer, pendiente continua
  (cada borde coincide con el del vecino), sentido del giro, solape de los
  segmentos girados y arco solo con tres o más segmentos.
- La prueba de determinismo incluye `sink` en su resumen.
- Las pruebas que fijan los grosores (`rules.test.ts`, `IngredientField.test.ts`
  con 7,4 + 8,3) pasan a los valores nuevos; las del nivel clásico (cadena de
  caídas, montados) tienen que seguir pasando.

## Risks / Trade-offs

- **El primer segmento pisado baja 6 unidades, el doble que hoy, y deja un
  hueco bajo los pies del chef.** Es la proporción del original; se revisa en
  el smoke y jugando.
- **La regla de un recorrido retomado por el otro lado no está medida.** Se
  aplica la misma regla; si otra grabación muestra otra cosa, solo cambia
  `IdleState.stomp`.
- **El render de Blender depende de la máquina del autor.** El script está
  documentado en `docs/MANUAL.md` §8.7 y Blender está instalado; si el render
  no se puede hacer, el resto del cambio es independiente y se entrega igual.
- **Ingredientes más gruesos tapan más los pies del chef y de los enemigos al
  cruzarlos.** En el original pasa lo mismo, en la misma proporción; se revisa
  en el smoke.
- **Una carne más clara puede confundirse con el pan de abajo en el plato.**
  Por eso el objetivo se queda en 80–100, con las marcas oscuras; se revisa en
  la hoja de arte con la hamburguesa apilada.
