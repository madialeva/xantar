# Guía de estilo visual — Xantar

Xantar tiene un único aspecto con dos familias de arte:

- **Arte renderizado** (ingredientes y personajes): modelos 3D procedurales
  hechos con Blender y renderizados como PNG con transparencia. Comida que
  parece comida de verdad y personajes 3D con aire de dibujo animado.
- **Arte vectorial** (piezas del laberinto, platos, efectos e iconos del HUD):
  formas geométricas limpias, esquinas redondeadas, contorno oscuro fino y
  sombras y brillos suaves, coloreadas con una paleta única.

Cada gráfico del catálogo (`src/view/art/graphics.ts`) tiene exactamente una
fuente en `src/view/art/sources/`: `<id>.png` o `<id>.svg`. Esta guía se escribe
en español de forma provisional; se traducirá al inglés más adelante.

## 1. Unidades y rejilla

- Todo se mide en **unidades lógicas**: una casilla del tablero mide 18 de
  ancho (un carácter de la pantalla del original a escala ×2, 16, y dos más
  para aprovechar las pantallas apaisadas) y 21 de alto, y el tablero 702×630
  (las 39×30 casillas del original). Las filas
  son algo más altas que medio cocinero para que, con plataformas de 8 de
  grueso, entre dos pisos separados por dos filas (un tramo de escalera) quepa
  el chef de pie con 2 unidades de holgura: 2, 3 o 4 tramos miden 2, 3 o 4
  cocineros sin contar lo que la escalera se solapa con las plataformas. El
  chef mide 32 de alto y un ingrediente de cuatro trozos, 72 de ancho. Los
  personajes se dibujan algo más anchos que su arte (`widen` = 34/32 en los
  rigs), dos unidades más en los 32 del chef, para ir con las casillas. El juego
  dibuja cada gráfico a su tamaño lógico multiplicado por el nivel de escala (4
  en esta versión): un gráfico de 16×16 acaba siendo una textura de 64×64
  píxeles. El objetivo son pantallas Full HD o mayores.
- El tamaño lógico de cada gráfico lo fija el catálogo; los SVG lo repiten en
  su `viewBox` y los PNG miden exactamente ese tamaño × 4. La prueba de arte
  (`src/view/art/art.test.ts`) lo comprueba.

### Encaje de las piezas

| Elemento | Tamaño | Cómo se coloca |
|---|---|---|
| Tramo de plataforma (`platform.left/mid/right`), cruce (`crossing`) | 18×8 | centrado en la línea de la plataforma; la cara superior (línea − 4) es el suelo; el cruce es la ranura oscura por la que pasa la escalera |
| Largueros en un cruce (`ladder.rails`, renderizado) | 18×8 | encima del cruce, para que la escalera se vea atravesar la plataforma |
| Pasarela de entrada (`walkway`) | 18×8 | una por casilla de pasarela, centrada en la línea del piso; más fina y oscura que la plataforma (`platformEdge`, sin brillo) para que se lea como prolongación del piso por la que entran los enemigos y no como suelo del chef |
| Escalera (`ladder`, renderizada) | 18×21 | una por fila, desde la línea de un piso hasta la del siguiente, detrás de las plataformas; madera de abedul, clara y cremosa con una veta dorada fina, para que el tablero no se vea tan oscuro, con cuatro peldaños redondos por fila que se repiten sin costuras |
| Plato (`plate.left/mid/right`) | 18×10 | centrado en la línea del plato |
| Segmento de ingrediente (`<tipo>.left/mid/right`) | 18×(12–18) | apoyado sobre el suelo de la plataforma |
| Partes de personaje | según el rig | el punto de anclaje está 14 por encima de la línea de la plataforma (`characterY`); los pies tocan el suelo (+10 respecto al anclaje) |
| Fondo del tablero (`board.backdrop`) | 702×630 | detrás de todo |

Un tramo de 2 casillas usa `left` + `right`; de 3, `left` + `mid` + `right`; de
4 o más, `mid` repetido entre los extremos. Un tramo de una sola casilla usa
solo `mid`.

## 2. Arte renderizado

Lo generan los scripts de `tools/blender/` (ver el manual del desarrollador,
§8.7). Ningún PNG se retoca a mano: se cambia el script y se vuelve a generar.

### 2.1 Luz, cámara y materiales

- **Luz** igual para todo: tres soles (direccionales) — principal cálido
  desde arriba, delante y a la izquierda; relleno suave desde la derecha; y
  contraluz sin sombras para recortar las siluetas — y un entorno gris cálido
  tenue. Transformación de color *Khronos PBR Neutral*, que respeta los colores
  de los materiales.
- **Cámara** ortográfica. Ingredientes: inclinada **5°** hacia abajo, para ver
  un poco de la cara superior (sésamo, miga, marcas de parrilla). Personajes:
  de frente, sin inclinación, mirando a la **derecha** (el juego los voltea).
- **Materiales** realistas pero apetecibles: corteza dorada y brillante en el
  pan, miga pálida y porosa, carne a la brasa con tonos claros y oscuros y
  marcas de parrilla, lechuga verde translúcida con nervios, salchicha roja y
  muy brillante, clara de huevo con el borde tostado y crujiente, cebolla
  morada jugosa y algo translúcida, con la piel brillante, y tela mate con
  brillo suave en la ropa del chef.
- Sin contorno dibujado: la silueta la marcan la luz y el contraluz.

### 2.2 Ingredientes

- Se renderizan los cuatro tramos de una vez y se cortan en `left`, `mid` y
  `right`. El **tramo central se repite sin costuras**: la luz no cambia a lo
  largo del ingrediente, y las texturas, las semillas, los desplazamientos y
  las ondas de la lechuga se repiten exactamente una vez por casilla.
- Cada ingrediente se apoya en la base de su imagen, con un margen de 1 unidad
  para su sombra de contacto.
- **Grosor visible** para el apilado en el plato (`INGREDIENT_THICKNESS`, en
  `src/sim/rules.ts`, porque la simulación lo usa para apilar y para saber
  cuándo un ingrediente golpea a otro): pan de abajo 11, carne 12, lechuga 8 y
  pan de arriba 13, cerca de las proporciones del original (unos 7 px cada uno;
  la lechuga, 5–6). En los sólidos es su altura (`support` en
  `tmp/blender/metrics.json`) menos la unidad del margen de la sombra; si cambia
  la forma de un ingrediente, se recalcula así y se comprueba apilando una
  hamburguesa.
- Un ingrediente mide 64 de ancho (cuatro casillas, dos cocineros, como en el
  original) y sus extremos redondeados caben en el primer y el último tramo.
- La **carne** es de un marrón a la brasa claro y cálido (luminancia media de
  la imagen entre 80 y 100), para que se reconozca sobre el fondo del tablero
  sin confundirse con los panes; las marcas de parrilla siguen oscuras.
- Al pisarlo, el juego **inclina** cada tramo para que el ingrediente forme una
  pendiente continua, y lo dibuja un poco más ancho para tapar las juntas: el
  arte no necesita nada especial para eso, salvo que los extremos de cada tramo
  encajen con el central.

| Ingrediente | Imagen | Forma |
|---|---|---|
| `bunTop` | 16×18 | cúpula de 13,5 de alto con semillas de sésamo que, también vista de frente, baja en el primer y el último tramo hasta un 25 % de su altura en la punta |
| `lettuce` | 16×14 | dos hojas posadas con el borde rizado colgando, la de arriba a 10,5 |
| `patty` | 16×17 | disco de 13 de alto con borde irregular y marcas de parrilla |
| `bunBottom` | 16×16 | base de 12 de alto, más ancha en el corte, con la miga a la vista |

### 2.3 Personajes

- Se componen de **partes** independientes, cada una renderizada sola con el
  encuadre exacto de su rectángulo en el rig (`src/view/rigs/rigs.ts`), de modo
  que su punto de giro coincide con el del juego.
- **Chef**: rubia con coleta, gorro de chef, chaqueta blanca con dos filas de
  botones y pañuelo rojo, pantalón azul y zapatos negros. Partes: `body`,
  `head`, `eyes`, `hat`, `ponytail`, `armLeft`/`armRight` (con el hombro
  incluido, para que el brazo gire unido al cuerpo) y `legLeft`/`legRight`.
- **Tamaño en el juego**: las partes se renderizan para un personaje de unas 38
  unidades de los pies a la cabeza, y cada rig lleva una escala (`scale` en
  `src/view/rigs/rigs.ts`) que lo deja en **32 unidades**, dos casillas: el chef
  a 0,82 y los enemigos entre 30 y 33 (la salchicha a 0,82, el huevo a 0,9 y
  la cebolla a 0,91). La escala se aplica alrededor de los pies, que siguen en el
  suelo. `rigHeights.test.ts` mide la altura con los píxeles opacos.
- **Enemigos**: de la altura del chef, con piernas de su color y zapatillas blancas, ojos grandes con cejas
  de enfadado. Partes: `body`, `eyes` y `leg` (una imagen para las dos piernas).
- **Bailes**: la salchicha y el huevo tienen cinco imágenes de su cuerpo, del
  mismo tamaño, de un extremo a otro de su baile con `body` en el centro:
  `<enemigo>.<baile>Back2`, `Back1`, `body`, `Front1`, `Front2`. La salchicha
  se dobla (`bend`) y la clara del huevo ondula (`ripple`). Los ojos son una
  parte aparte que el juego desplaza para seguir el baile.
- **Cebolla**: una rodaja gruesa de cebolla morada (24 unidades de diámetro y 5
  de grueso, con los bordes redondeados) de pie sobre dos piernas moradas. De
  frente se ven anillos concéntricos blancos con el borde violeta, más morados
  hacia fuera, dentro de una piel morada oscura y brillante; de canto, una
  barra morada. Los ojos asoman por encima del borde de arriba. En lugar de
  bailar, **gira como una moneda** alrededor del eje horizontal, como el
  pepinillo del original: seis imágenes de media vuelta en pasos de 30°,
  `onion.body` (de frente, la postura base) y `onion.turn1` a `onion.turn5`
  (`turn3`, de canto). Al andar da media vuelta por zancada y al trepar, la mitad
  de deprisa; los ojos bajan con el borde de arriba de la rodaja en cada
  fotograma.
- El resto de la animación (rebote, balanceo, *squash & stretch*) se hace
  moviendo y escalando partes.

## 3. Arte vectorial

### 3.1 Paleta

Los colores **no se escriben en los SVG**: cada forma usa un token de la paleta
mediante una clase, y el juego le da el color de `PALETTE`
(`src/view/art/palette.ts`).

| Token | Color | Uso |
|---|---|---|
| `background` | `#14181f` | fondo fuera del tablero |
| `backdrop` / `backdropAccent` | `#1b2130` / `#232b3d` | fondo del tablero y su motivo |
| `platform` / `platformEdge` | `#3d7ea6` / `#2c5d7c` | losa de plataforma y su canto |
| `ladder` / `ladderShade` | `#c98b4a` / `#9a6633` | largueros y peldaños |
| `plate` / `plateEdge` | `#e8edf2` / `#a9b4c0` | platos |
| `chef` / `chefShade` | `#ffffff` / `#d7dde5` | icono de vidas (gorro) |
| `sausage` / `scarf` / `pupil` | `#c8442f` / `#e2504c` / `#1d1f24` | pimentero del HUD y motas de la nube de pimienta |
| `outline` | `#1d222b` | contorno |
| `shadow` / `highlight` | `#000000` / `#ffffff` | sombra y brillo (siempre con opacidad) |
| `pepper` / `sparkle` | `#f4f1ea` / `#ffe27a` | nube de pimienta y destellos |
| `hudText` / `hudAccent` / `hudPanel` / `danger` | `#f2f4f8` / `#ffc857` / `#1e2533` / `#ff5a5a` | HUD |

Para añadir un token hay que añadirlo a `PALETTE_TOKENS` y darle color en
`PALETTE`.

### 3.2 Trazo, radios, sombras y brillos

- **Contorno**: `stroke-width="1.5"`, `stroke-linejoin="round"`,
  `stroke-linecap="round"`, clase `s-outline`. Lo llevan platos, efectos e
  iconos. Las plataformas y escaleras no llevan contorno: se distinguen por el
  canto (`platformEdge`, `ladderShade`).
- **Radios**: 3 en piezas pequeñas (peldaños, iconos) y 6 en piezas grandes
  (fondo de los paneles). Los extremos `left` y `right` de plataformas y platos
  van redondeados solo por fuera; el tramo `mid` es recto para que se lean
  continuos.
- **Sombra**: la forma principal repetida 1,5 unidades más abajo con la clase
  `f-shadow` y `opacity="0.25"`, dibujada antes que la forma.
- **Brillo**: una franja o elipse en la parte superior con `f-highlight` y
  `opacity="0.3"`.
- **Sombreado**: la parte inferior de una forma con su token `…Shade` o
  `…Edge`, sin degradados. Los degradados se permiten (con `c-<token>` en
  `stop`) pero se evitan salvo en efectos.

### 3.3 Convención de autoría de los SVG

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" width="16" height="10">
  <rect class="f-shadow" x="1" y="2.5" width="14" height="7" rx="3" opacity="0.25"/>
  <rect class="f-plate s-outline" x="1" y="1" width="14" height="7" rx="3" stroke-width="1.5"/>
</svg>
```

Reglas (las comprueba `src/view/art/art.test.ts`):

1. Raíz `<svg>` con `xmlns`, `viewBox="0 0 W H"`, `width` y `height` iguales al
   tamaño del catálogo.
2. Ningún color literal: ni `#rgb`, ni `rgb()`, ni nombres de color en
   `fill`, `stroke` o `stop-color`. Esos atributos solo admiten `none` o una
   referencia local a un patrón o degradado del propio fichero (`url(#id)`).
3. El color se da con clases: `f-<token>` (relleno), `s-<token>` (trazo) y
   `c-<token>` (color de parada de degradado). Ninguna otra clase.
4. Sin atributos `style` ni elementos `<style>`, `<script>`, `<image>` o
   `<foreignObject>`. Grosores, opacidades y uniones van en atributos
   (`stroke-width`, `opacity`, `stroke-linejoin`…).

#### Exportar desde Inkscape

Inkscape escribe colores en `style`. Para mantener un SVG editado con él:
guardar como **SVG plano**, quitar los atributos `style`, `inkscape:*` y
`sodipodi:*`, y sustituir cada color por la clase del token correspondiente.
La prueba de arte señala el fichero y el atributo que falten por limpiar.

## 4. HUD y tipografía

- Paneles laterales con fondo `hudPanel`, radio 6 y margen interior de 8.
- Fuente: pila del sistema `"Trebuchet MS", "Segoe UI", "Helvetica Neue",
  Arial, sans-serif`, en negrita. Tamaños: 11 (etiquetas), 16 (valores), 22
  (títulos de las pantallas de fin). Etiquetas en `hudText` con opacidad 0,7;
  valores en `hudText`; avisos en `hudAccent` o `danger`.
- Iconos del HUD (`hud.life`, `hud.pepper`, `hud.pause`) con contorno
  `s-outline`.
