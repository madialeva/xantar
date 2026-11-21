# Proposal

## Why

Los enemigos que quedan del original, la salchicha y el huevo, son los del
BurgerTime de 1982. El autor quiere que Xantar tenga enemigos propios para no
copiar los del original, como ya hizo al cambiar el pepinillo por la cebolla
(#49). Además, desde la segunda pantalla el original añade ingredientes nuevos
(queso y tomate), que Xantar aún no tiene (#56). Los diseños de los dos
enemigos y de los dos ingredientes se han validado con el autor sobre bocetos
renderizados (`tmp/is56-drafts/`).

## What Changes

- **Chorizo en lugar de la salchicha.** Un chorizo fresco gallego de pie, como
  la salchicha pero más gordo y liso, de rojo pimentón con vetas de grasa
  naranjas y amarillas. Lleva los extremos atados con cordel rojo y arriba asoma
  la punta de la tripa con un cabo de cordel suelto. Al andar se dobla a un lado
  y a otro, cóncavo y convexo, en cada paso, y la punta atada se bambolea.
- **Mazorca en lugar del huevo.** Una mazorca de maíz amarillo de pie, con las
  hojas de la vaina peladas hacia abajo como una falda y un mechón de pelo de
  maíz en la punta. Al andar baila el hula: balancea la cadera a un lado por
  paso, la falda de hojas va a la contra y el mechón se agita.
- **Boca sonriente.** El chorizo y la mazorca sonríen con una fila de dientes
  continua y una lengüecita, además de los ojos de enfado de todos los enemigos.
- **BREAKING (juego):** la salchicha y el huevo salen del juego: su tipo de
  enemigo, sus símbolos (`h` y `e`), su arte y sus animaciones. Las pantallas
  usan el chorizo (`z`) donde estaba la salchicha y la mazorca (`m`) donde
  estaba el huevo, con las mismas entradas y los mismos tiempos.
- **Queso y tomate.** Dos ingredientes nuevos con arte renderizado: una loncha
  de cheddar que se derrite por el borde de delante en lágrimas de punta
  redonda, y cuatro rodajas de tomate, una por trozo, algo inclinadas hacia la
  cámara para que se vea el corte. Símbolos `Q` y `O` en la capa de
  ingredientes. El queso cuelga por debajo de su base sobre lo que tenga
  debajo.
- **Pantallas.** Sin cambiar el número de ingredientes de ninguna hamburguesa:
  la clásica sigue igual; en la Pirámide, las dos hamburguesas centrales llevan
  queso en lugar de lechuga; en el Mostrador, las dos centrales llevan tomate y
  una de las de los lados, queso; en las Torres, las dobles llevan queso entre
  las dos carnes y, arriba, lechuga o tomate alternando.
- **BREAKING (formato de nivel):** `h` y `e` dejan de existir en la capa de
  actores; un documento que los use deja de cargar con un error que indica el
  símbolo y su posición. Ningún nivel del proyecto los usará.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `level-pieces`: "Piezas de la versión 1" (`z` chorizo y `m` mazorca en lugar
  de `h` y `e`; `Q` queso y `O` tomate).
- `level-data`: "Nivel clásico migrado", "Entradas de los enemigos" y
  "Pantallas del juego" (chorizos y mazorcas en lugar de perritos y huevos; los
  ingredientes nuevos en cada pantalla).
- `gameplay-rules`: "Grosor de los ingredientes" (queso 2 unidades, tomate 6).
- `character-rigs`: "Personajes por partes" (las partes propias del chorizo y
  de la mazorca); "Bailes de los enemigos" sale y entra "Baile de cada enemigo"
  (chorizo, cebolla y mazorca).
- `rendered-assets`: "Gráficos renderizados reproducibles" y "Aspecto de los
  ingredientes" (queso y tomate); "Fotogramas de baile" sale y entra
  "Fotogramas del cuerpo"; nuevos requisitos "Aspecto del chorizo", "Aspecto de
  la mazorca" y "Boca sonriente".
- `view-adapter`: "Laberinto a partir del nivel cargado" (enemigos del
  escenario de cambio de pantalla); nuevo requisito "Ingredientes que cuelgan
  de su base".

## Impact

- Simulación (`src/sim/`): `EnemyKind` (`chorizo`, `onion`, `corn`) e
  `IngredientKind` (más `cheese` y `tomato`), registro de piezas,
  `createEnemy`, `INGREDIENT_THICKNESS` y sus pruebas.
- Niveles: los cuatro documentos de `src/levels/` (actores y, en las pantallas
  2 a 4, ingredientes) y sus pruebas.
- Vista: catálogo de gráficos (fuera `hotdog.*` y `egg.*`, dentro `chorizo.*`,
  `corn.*`, `cheese.*` y `tomato.*`), rigs y estados de animación,
  `IngredientView` (el queso cuelga de su base), lámina de arte.
- Arte: `tools/blender/characters.py` (chorizo, mazorca y boca; fuera salchicha
  y huevo) e `ingredients.py` (queso y tomate), PNG renderizados nuevos y
  borrado de los de la salchicha y el huevo.
- Documentación: `README.md`, `docs/MANUAL.md`, `docs/STYLE_GUIDE.md` y
  `docs/GAMEDEV_FUNDAMENTALS.md`.
- GitHub: la issue #56 pasa a describir este alcance (enemigos propios e
  ingredientes nuevos, sin hamburguesas más altas ni más hamburguesas por
  pantalla) y se asigna al hito `v1.0.0`.
- Sin dependencias nuevas. El formato de nivel sigue en la versión 1.
