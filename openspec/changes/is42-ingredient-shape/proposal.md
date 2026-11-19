# Proposal

## Why

Al pisar un ingrediente, Xantar baja cada segmento pisado 3 unidades, todos
iguales: el ingrediente queda partido en un escalón brusco. En el original el
ingrediente pisado se inclina como una rampa, se arquea al rebotar y al tocar
un piso, y el pan de arriba es una cúpula que se afina hacia los extremos. En
Xantar el pan de arriba tiene los extremos casi verticales, como un pan de
perrito, y no parece el de una hamburguesa, menos aún al inclinarse. Además, la
lechuga, la carne y el pan de abajo son más bajos que en el original, y la carne es tan oscura
que sobre el fondo del tablero apenas se reconoce. Es la issue #42, que sale de
un Non-Goal de #41 y de #45, ampliada a pedido del autor.

Medido en la grabación del original (`tmp/ejemplo-partida.webm`, ver
`design.md`):

- **Rampa al pisar.** Cada vez que el chef pisa un segmento nuevo, ese segmento
  baja 1 px y todos los que ya estaban pisados bajan 1 px más. Tras pisar tres
  de cuatro, el ingrediente queda a 3, 2, 1 y 0 px: una rampa que baja hacia
  donde empezó el chef. Pasa igual de izquierda a derecha que al revés, y la
  rampa se mantiene aunque el chef se aleje.
- **Plano al caer.** Al empezar la caída, los segmentos vuelven a estar a la
  misma altura.
- **Arco.** Mientras rebota tras golpear a otro ingrediente o llegar al plato,
  y durante ≈ 0,23 s tras tocar un piso, los dos segmentos de los extremos
  quedan 1 px por debajo de los centrales.
- **Cúpula.** El pan de arriba mide 7 px en el centro y unos 3 px en la punta;
  sube hasta su altura completa a lo largo del primer y el último trozo.
- **Alturas y color.** La carne mide 7–8 px de alto, tanto como el pan de
  arriba, la lechuga 5–6 px y el pan de abajo 7 px: a escala ×2, 14–16, 10–12
  y 14 unidades. En Xantar la carne tiene un grosor de 8,3, la lechuga de 4,8
  y el pan de abajo de 7,4. La carne del original es
  de un marrón anaranjado vivo. La de Xantar tiene una luminancia media de 44
  sobre un fondo de unos 32, frente a 118–129 de los panes.

## What Changes

- **Profundidad de los segmentos pisados.** La simulación lleva, por cada
  segmento, cuántos escalones ha bajado: al pisar uno nuevo, ese pasa a 1 y los
  ya pisados suben uno. La vista lo dibuja a 2 unidades por escalón (1 px del
  original a escala ×2). Las reglas de pisado y activación no cambian.
- **Segmentos planos al moverse.** Mientras cae, rebota, está parado con
  enemigos montados o está en el plato, la vista dibuja los segmentos a la
  misma altura (hoy los baja todos 3 unidades porque cuenta como pisados).
- **Arco del rebote y del aterrizaje.** La vista baja 2 unidades los segmentos
  de los extremos mientras el ingrediente rebota y durante 230 ms tras tocar un
  piso. Es solo dibujo.
- **Pan de arriba en cúpula.** El script de Blender afina la altura del pan en
  el primer y el último trozo, y se vuelve a renderizar `bunTop`. El tramo
  central y el grosor de apilado no cambian.
- **Lechuga, carne y pan de abajo más altos.** Se modelan más altos en
  Blender: un grosor visible de unas 8 unidades la lechuga, de unas 12 la carne
  y de unas 11 el pan de abajo, y sus imágenes pasan a 16×16, 16×18 y 16×18. Los grosores de apilado (`INGREDIENT_THICKNESS`) se
  actualizan con lo medido en el render, así que las hamburguesas quedan más
  altas en el plato y un ingrediente que cae golpea antes a los ingredientes
  más gruesos.
- **Carne más clara.** Un marrón de carne a la brasa más claro y más cálido,
  con una luminancia media de 80–100. Las marcas de parrilla siguen oscuras.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `gameplay-rules`: "Pisado de segmentos" (cada segmento pisado tiene una
  profundidad en escalones que crece con cada pisada nueva) y "Grosor de los
  ingredientes" (nuevos grosores de la lechuga, la carne y el pan de abajo).
- `view-adapter`: "Segmentos de ingrediente" (rampa según la profundidad,
  segmentos planos al moverse y arco del rebote y del aterrizaje).
- `rendered-assets`: "Aspecto de los ingredientes" (el pan de arriba es una
  cúpula que se afina hacia los extremos; la lechuga, la carne y el pan de
  abajo, más altos, y la carne, más clara).

## Impact

- Simulación: `src/sim/entities/Ingredient.ts` (la profundidad de cada segmento
  en `IdleState` y en `IngredientSnapshot`) y sus pruebas, más las de
  `IngredientField`.
- Vista: `src/objects/IngredientView.ts` (rampa, segmentos planos y arco).
- Arte: `tools/blender/ingredients.py` (forma del pan de arriba, altura de la
  lechuga, la carne y el pan de abajo, color de la carne) y los PNG de los
  cuatro ingredientes en `src/view/art/sources/`; `INGREDIENT_HEIGHTS` y el catálogo en
  `src/view/art/graphics.ts`.
- Reglas: `INGREDIENT_THICKNESS` en `src/sim/rules.ts` y las pruebas que fijan
  sus valores (`rules.test.ts`, `IngredientField.test.ts`).
- Documentación: `docs/STYLE_GUIDE.md` (tabla de ingredientes: forma del pan
  de arriba, alturas, color de la carne y grosores), `docs/MANUAL.md` (§8.5:
  profundidad de los segmentos) y `README.md` (el ingrediente se inclina al
  pisarlo).
- Sin dependencias nuevas ni cambios en el formato de nivel.
- GitHub: issue #42; se asigna al hito `v1.0.0`.
