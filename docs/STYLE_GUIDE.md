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

- Todo se mide en **unidades lógicas**: una casilla del tablero mide 32×32 y el
  tablero 640×480 (20×15 casillas). El juego dibuja cada gráfico a su tamaño
  lógico multiplicado por el nivel de escala (4 en esta versión): un gráfico de
  32×32 acaba siendo una textura de 128×128 píxeles. El objetivo son pantallas
  Full HD o mayores.
- El tamaño lógico de cada gráfico lo fija el catálogo; los SVG lo repiten en
  su `viewBox` y los PNG miden exactamente ese tamaño × 4. La prueba de arte
  (`src/view/art/art.test.ts`) lo comprueba.

### Encaje de las piezas

| Elemento | Tamaño | Cómo se coloca |
|---|---|---|
| Tramo de plataforma (`platform.left/mid/right`), cruce (`crossing`) | 32×12 | centrado en la línea de la plataforma; la cara superior (línea − 6) es el suelo |
| Escalera (`ladder`) | 32×32 | una por fila, desde la línea de un piso hasta la del siguiente, detrás de las plataformas |
| Plato (`plate.left/mid/right`) | 32×10 | centrado en la línea del plato |
| Segmento de ingrediente (`<tipo>.left/mid/right`) | 32×(12–18) | apoyado sobre el suelo de la plataforma |
| Partes de personaje | según el rig | el punto de anclaje es el centro de su casilla; los pies tocan el suelo (+10 respecto al anclaje) |
| Fondo del tablero (`board.backdrop`) | 640×480 | detrás de todo |

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
  muy brillante, clara de huevo con el borde tostado y crujiente, pepinillo
  verde oscuro con verrugas, tela mate con brillo suave en la ropa del chef.
- Sin contorno dibujado: la silueta la marcan la luz y el contraluz.

### 2.2 Ingredientes

- Se renderizan los cuatro tramos de una vez y se cortan en `left`, `mid` y
  `right`. El **tramo central se repite sin costuras**: la luz no cambia a lo
  largo del ingrediente, y las texturas, las semillas, los desplazamientos y
  las ondas de la lechuga se repiten exactamente una vez por casilla.
- Cada ingrediente se apoya en la base de su imagen, con un margen de 1 unidad
  para su sombra de contacto.
- **Grosor visible** para el apilado en el plato (`INGREDIENT_STACK_HEIGHTS`):
  pan de abajo 7,4, carne 8,3, lechuga 4,8 y pan de arriba 13. Si cambia la
  forma de un ingrediente, se recalcula con `tmp/blender/metrics.json`.

| Ingrediente | Imagen | Forma |
|---|---|---|
| `bunTop` | 32×18 | cúpula de 13,5 de alto con unas 125 semillas de sésamo |
| `lettuce` | 32×12 | dos hojas posadas con el borde rizado colgando |
| `patty` | 32×14 | disco de 9,2 de alto con borde irregular y marcas de parrilla |
| `bunBottom` | 32×14 | base más ancha en el corte, con la miga a la vista |

### 2.3 Personajes

- Se componen de **partes** independientes, cada una renderizada sola con el
  encuadre exacto de su rectángulo en el rig (`src/view/rigs/rigs.ts`), de modo
  que su punto de giro coincide con el del juego.
- **Chef**: rubia con coleta, gorro de chef, chaqueta blanca con dos filas de
  botones y pañuelo rojo, pantalón azul y zapatos negros. Partes: `body`,
  `head`, `eyes`, `hat`, `ponytail`, `armLeft`/`armRight` (con el hombro
  incluido, para que el brazo gire unido al cuerpo) y `legLeft`/`legRight`.
- **Enemigos**: de la altura del chef (unas 38 unidades de los pies a la
  cabeza), con piernas de su color y zapatillas blancas, ojos grandes con cejas
  de enfadado. Partes: `body`, `eyes` y `leg` (una imagen para las dos piernas).
- **Bailes**: cada enemigo tiene cinco imágenes de su cuerpo, del mismo tamaño,
  de un extremo a otro de su baile con `body` en el centro:
  `<enemigo>.<baile>Back2`, `Back1`, `body`, `Front1`, `Front2`. La salchicha
  se dobla (`bend`), el pepinillo se contonea en S (`wiggle`) y la clara del
  huevo ondula (`ripple`). Los ojos son una parte aparte que el juego desplaza
  para seguir el baile.
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
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 10" width="32" height="10">
  <rect class="f-shadow" x="1" y="2.5" width="30" height="7" rx="3" opacity="0.25"/>
  <rect class="f-plate s-outline" x="1" y="1" width="30" height="7" rx="3" stroke-width="1.5"/>
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
