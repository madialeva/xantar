# Design

## Context

Hoy hay tres tipos de enemigo (`hotdog`, `onion`, `egg`) y cuatro de
ingrediente (`bunTop`, `lettuce`, `patty`, `bunBottom`). Todos comparten la
misma regla de persecución (`ChaseBrain`). Cada enemigo es un rig de partes
renderizadas: cuerpo, ojos y dos piernas, y en la salchicha y el huevo, además,
cinco fotogramas del cuerpo para su baile. Los ingredientes se renderizan como
una tira de cuatro casillas que se corta en `left`, `mid` y `right`, y la vista
los coloca con la parte de abajo de la imagen en la base que da la simulación.

Los cuatro diseños nuevos se validaron con el autor sobre bocetos
(`tmp/is56-drafts/`):
- `enemies.py` e `ingredients.py` reutilizan los scripts de `tools/blender/`.
- `compose.py` monta los rigs como el juego y genera la fila de comparación y
  los GIF de los bailes.
- `burgers.py` apila hamburguesas de ejemplo.

El change lleva esos bocetos al juego. Motivación en `proposal.md`; requisitos
en las specs.

## Goals / Non-Goals

**Goals:**

- Que el juego se vea como los bocetos validados: mismas formas, colores y
  bailes.
- Que la salchicha y el huevo no queden en ningún sitio: tipos, símbolos,
  gráficos, PNG, rigs, estados, scripts y documentación.
- Que las reglas no cambien: el chorizo y la mazorca persiguen igual que la
  salchicha y el huevo y entran por los mismos sitios y a los mismos tiempos.

**Non-Goals:**

- Hamburguesas más altas (de ocho ingredientes): el autor da por buena la
  altura actual; ninguna hamburguesa cambia su número de ingredientes.
- Más de cuatro hamburguesas por pantalla.
- Boca para la cebolla: el autor no la quiere, porque gira de canto y la boca
  aparecería y desaparecería con el giro. Su arte no cambia.
- Queso o tomate en la pantalla clásica, que sigue la primera del original.
- Comportamiento propio de cada enemigo (#17), recetas por plato (#16) y las
  pantallas 5 y 6 (#55), que podrán usar los ingredientes nuevos.

## Decisions

### 1. Identificadores y símbolos

`EnemyKind` pasa a `'chorizo' | 'onion' | 'corn'` e `IngredientKind` suma
`'cheese' | 'tomato'`. En el formato de nivel:

| Pieza | Capa | Símbolo | Por qué |
|---|---|---|---|
| chorizo | `actors` | `z` | chori**z**o |
| mazorca | `actors` | `m` | **m**azorca |
| queso | `ingredients` | `Q` | **q**ueso |
| tomate | `ingredients` | `O` | redondo como la rodaja |

La `c` minúscula se confundiría a simple vista con la `C` del chef, y `T` ya es
el pan de arriba. `h` y `e` desaparecen: un documento que los use falla con su
posición, como pasó con `p` en #49. Los cuatro documentos cambian `h` → `z` y
`e` → `m` sin tocar entradas ni retrasos. Los dos enemigos nuevos usan
`ChaseBrain`.

*Alternativa descartada:* conservar `h` y `e` como alias del chorizo y la
mazorca, que mantendría vivos los nombres del original que se quieren retirar.

### 2. El chorizo: cinco fotogramas de doblez y una punta que se bambolea

`build_chorizo(scene, group, bend)` en `tools/blender/characters.py`, tal como
quedó en el boceto:
- **Tripa:** lisa, sobre una línea central arqueada `bend × 3,4 × sin(πt)`, de
  radio 5,6 y de la fila 3 a la −24,5 del rig. Redondeada en los extremos y
  estrangulada en el atado.
- **Material:** rojo pimentón con vetas de grasa naranjas y amarillas (Voronoi
  deformado y estirado a lo largo), satinado.
- **Atado:** tres vueltas de cordel rojo en cada extremo y la boca (decisión 4).
- **Fotogramas:** los de `dance_frames("chorizo", "bend")`, de −1 a 1, igual
  que los de la salchicha.

Partes del rig (escala 0,85, `widen` como todos):

| Parte | Gráfico | Tamaño | Posición | Origen |
|---|---|---|---|---|
| piernas | `chorizo.leg` | 6×8 | (−2,4, 2) y (2,6, 2) | arriba |
| cuerpo | `chorizo.body` + 4 fotogramas | 20×30 | (0, 5) | abajo |
| punta atada | `chorizo.knot` | 14×10 | (−0,5, −24,6) | 0,6 de alto, en el atado |
| ojos | `chorizo.eyes` | 12×7 | (2,6, −15,8) | centro |

La punta (el extremo retorcido de la tripa con un cabo de cordel hacia atrás y
otro corto hacia delante) es una parte aparte para que se bambolee sin volver a
renderizar.

Al andar hace lo mismo que la salchicha:
- `cycle('body', STEP_MS)` y los ojos oscilando ±3 en horizontal. A la altura de
  los ojos el arco se desplaza unas 2,9 unidades, así que sirve el mismo
  `BEND_EYES_DX`.
- La punta oscila ±14° con `swing`, un poco retrasada (`delay`), como en el GIF.
- Trepar, aturdido y montado comparten los estados comunes.

### 3. La mazorca: el hula con tweens, sin fotogramas

`build_cob` en `characters.py`:
- Núcleo amarillo oscuro y 16 filas de granos: elipsoides aplanados con un tono
  propio cada uno, brillantes y algo translúcidos.
- Hojas de la vaina peladas hacia abajo, separadas en dos partes: las de delante
  (`corn.huskFront`) y las de detrás (`corn.huskBack`).
- Mechón de 40 hilos rubios que oscurecen hacia las puntas (`corn.silk`).

Partes del rig (escala 0,9), en orden de dibujo:

| Parte | Gráfico | Tamaño | Posición | Origen |
|---|---|---|---|---|
| hojas de detrás | `corn.huskBack` | 28×10 | (0, −2,2) | arriba |
| piernas | `corn.leg` | 6×8 | (−2,4, 2) y (2,6, 2) | arriba |
| cuerpo | `corn.body` | 14×24 | (0, 3) | abajo |
| hojas de delante | `corn.huskFront` | 28×10 | (0, −2,2) | arriba |
| pelo | `corn.silk` | 14×8 | (0, −19) | abajo |
| ojos | `corn.eyes` | 12×7 | (2,0, −13) | centro |

Las piernas son verde hoja.

El hula no cambia la forma de la mazorca, solo mueve partes, así que se hace
con `swing`, sin fotogramas. Cada paso dura `STEP_MS`:

| Parte | Movimiento |
|---|---|
| cuerpo | gira ±7° alrededor de su base |
| ojos | siguen lo alto del cuerpo: ±2 en horizontal y ±7° |
| pelo | sigue lo alto del cuerpo (±2,7) y gira ∓9° |
| hojas de delante | giran ∓11° |
| hojas de detrás | giran ∓8° |

Las hojas y el pelo llevan un pequeño `delay` para ir detrás del cuerpo, como en
el GIF. Las piernas, como las de todos.

*Alternativa descartada:* fotogramas renderizados del hula. Multiplicarían las
imágenes por cinco sin ganar nada visible, porque las partes no cambian de
forma.

### 4. Boca sonriente en la imagen del cuerpo

`add_mouth(scene, group, axis, radius, …)` en `characters.py` coloca la boca
sobre la superficie de cualquier cuerpo vertical descrito por su eje y su radio:
- **Forma:** borde de arriba con las comisuras hacia arriba y borde de abajo más
  hondo en el centro.
- **Piezas:** interior oscuro, una fila de dientes continua (una tira) y una
  lengua.
- **Dónde va:** dentro de la imagen del cuerpo, así que en el chorizo se dobla en
  cada fotograma. En la mazorca se quitan los granos que caerían en la boca
  (`in_mouth`) para que se vea entre ellos.
- **Ojos:** siguen siendo `add_eyes`, con las cejas de enfado de todos.

*Alternativa descartada:* la boca como parte aparte. En el chorizo no seguiría
la doblez y obligaría a otro desplazamiento sincronizado.

### 5. Queso y tomate en `ingredients.py`

Los dos constructores pasan del boceto a `tools/blender/ingredients.py`.

**Queso** (`build_cheese`):
- Una loncha de 2 de grueso sobre una rejilla que cae por los bordes: dos
  lágrimas de punta redonda por casilla en el borde de delante (de 3,4 y 1,8 de
  largo, repetidas cada casilla para que el tramo central encaje) y las
  esquinas caídas en las casillas de los extremos.
- Material cheddar: amarillo anaranjado, céreo y translúcido, más naranja donde
  cae.
- Se renderiza sin el suelo que recoge la sombra, porque ese plano, a la altura
  de la base, tapa todo lo que cuelga por debajo.

**Tomate** (`build_tomato`):
- Cuatro rodajas torneadas a partir de un perfil redondeado (el de la carne,
  `slab_profile`): radio 9,8, grueso 4,2, una por casilla, inclinadas 8° hacia
  la cámara. Las de los extremos van 0,8 hacia dentro para no salirse del
  encuadre.
- Material: piel roja brillante y, en el corte, carne roja, cuatro cámaras con
  gelatina y semillas claras y el centro más claro.

El torneado evita las estrías que daba el cilindro biselado en el primer
boceto.

Alturas de la imagen (`INGREDIENT_HEIGHTS`) a partir de lo que ocupa cada uno en
el boceto, con los márgenes de `add_camera`: queso 11 y tomate 9. Si el render
avisa de que no cabe, se sube una unidad.

### 6. Grosor y apilado

`INGREDIENT_THICKNESS` suma queso `rowsOf(2)`, el grueso de la loncha, y tomate
`rowsOf(6)`. En el tomate, la parte de delante de las rodajas mide unas 5,5 y el
borde de atrás llega a 6,9; con 6, lo que va encima tapa ese borde, como el pan
de arriba tapa la lechuga.

Las hamburguesas con queso o tomate quedan algo más bajas que las de lechuga.
Ninguna gana ingredientes, que es lo que el autor quiere conservar.

### 7. El queso cuelga de su base

Hoy la vista pone la parte de abajo de la imagen en la base. Cada imagen deja
un margen de 1 bajo su punto más bajo, así que la base del modelo queda de 1 a
2 unidades por encima del suelo (`low` de `metrics.json` entre −0,1 y −1). El
queso llega 5,5 por debajo de su base, así que dibujado igual flotaría.

Se añade `INGREDIENT_HANGS` al catálogo de gráficos: cuánto más abajo se dibuja
la imagen de un ingrediente. Solo lo usa el queso, con unas 5 unidades (la
diferencia entre su `low` y el de la carne). `IngredientView` la suma al colocar
los segmentos, de modo que:
- la loncha se apoya donde se apoyaría la base de otro ingrediente;
- las lágrimas cuelgan por delante de lo que tiene debajo, la carne en el plato
  o el borde de la plataforma en un piso.

El valor se ajusta en la lámina de arte. Los demás ingredientes no se mueven.

*Alternativa descartada:* colocar todos los ingredientes por su `low`. Movería
hasta una unidad los ingredientes ya ajustados a ojo.

### 8. Ingredientes de cada pantalla

Sin cambiar el número de ingredientes de ninguna hamburguesa. La lista de cada
pantalla, de arriba abajo, está en la spec de `level-data`; en el documento se
cambia cada `L` por `Q` u `O` en su fila:

| Pantalla | Hamburguesas | Cambio |
|---|---|---|
| Clásica | todas | sin cambios |
| Pirámide | las dos centrales | lechuga de las filas 9 y 13 → queso |
| Mostrador | las dos centrales, en los platos de la fila 17 | lechuga de las filas 7 y 9 → tomate |
| Mostrador | la de la derecha | lechuga de la fila 9 → queso |
| Torres | las cuatro | lechuga de abajo (filas 15 y 17) → queso |
| Torres | segunda y cuarta | lechuga de arriba (fila 9) → tomate |

El queso aparece en la segunda pantalla y el tomate en la tercera, siguiendo la
progresión del original.

### 9. Lo que sale

- **Gráficos:** `hotdog.*` (cuerpo, cuatro dobleces, ojos, pierna) y `egg.*`
  (cuerpo, cuatro ondulaciones, ojos, pierna), del catálogo y de las fuentes.
- **Código:** sus rigs y estados en `rigs.ts` y `states.ts`, y `build_sausage`,
  `sausage_eyes`, `sausage_material`, `build_egg`, `egg_eyes` y
  `egg_white_material` de `characters.py`, con sus entradas en `ENEMIES`.

`ENEMIES` pasa a admitir partes extra (la punta del chorizo; las hojas y el pelo
de la mazorca), y `render_enemy` renderiza los fotogramas solo para el cuerpo.

## Risks / Trade-offs

- **[Las lágrimas del queso tapan el borde de la plataforma en un piso]** →
  Están pensadas así: queso fundido que cae por el borde. Si se ven raras en la
  partida, se acortan o se baja `INGREDIENT_HANGS`, sin tocar las reglas.
- **[Un queso de 2 de grueso se ve poco al pisarlo]** → El tramo pisado baja lo
  mismo que en los demás ingredientes y sus lágrimas siguen viéndose; se
  comprueba en la lámina de arte y jugando la Pirámide.
- **[Las hojas o el pelo de la mazorca se separan del cuerpo al girar]** → Las
  hojas de delante tapan la base de la mazorca y el pelo nace en su punta, que
  se mueve con él. Si asoma un hueco, se reduce el giro o se alarga la parte.
- **[La punta del chorizo deja ver una costura al inclinarse]** → El atado de
  cordel está en la imagen del cuerpo y la punta gira sobre él. Se comprueba en
  la lámina de arte.
- **[Quitar `h` y `e` rompe documentos de fuera]** → No hay ninguno publicado
  (el editor, #7, aún no existe); la carga da un error claro con la posición.
- **[Hamburguesas algo más bajas en las pantallas 2 a 4]** → Es consecuencia de
  ingredientes más finos sin añadir ninguno; deja más hueco bajo los pisos de
  encima de los platos del Mostrador y de las Torres.

## Migration Plan

- Sin migración de datos: el formato de nivel sigue en la versión 1 y los
  ajustes no cambian. Un documento con `h` o `e` deja de cargar con un error que
  indica el símbolo y su posición.
- Vuelta atrás: revertir los commits; el arte generado está versionado.
