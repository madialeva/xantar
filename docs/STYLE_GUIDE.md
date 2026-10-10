# Guía de estilo visual — Xantar

Estilo vectorial moderno y limpio: formas geométricas simples, esquinas
redondeadas, contorno oscuro fino, sombras y brillos suaves dibujados dentro de
cada gráfico. Nada de pixel art ni de texturas fotográficas. Esta guía se escribe
en español de forma provisional; se traducirá al inglés más adelante.

## 1. Unidades y rejilla

- Todo se mide en **unidades lógicas**: una casilla del tablero mide 32×32 y el
  tablero 640×480 (20×15 casillas). El juego rasteriza cada SVG a su tamaño
  lógico multiplicado por el nivel de escala (2 en esta versión), así que un
  SVG de 32×32 acaba siendo una textura de 64×64 píxeles.
- El `viewBox` de cada SVG coincide con su tamaño lógico del catálogo
  (`src/view/theme/graphics.ts`): `viewBox="0 0 32 12"` para un tramo de
  plataforma, por ejemplo. La prueba de arte lo comprueba.
- Coordenadas con como mucho medio punto de precisión (`0.5`) para que los
  bordes caigan en píxeles enteros a 2×.

### Encaje de las piezas

| Elemento | Tamaño | Cómo se coloca |
|---|---|---|
| Tramo de plataforma (`platform.left/mid/right`), cruce (`crossing`) | 32×12 | centrado en la línea de la plataforma; la cara superior (línea − 6) es el suelo |
| Escalera (`ladder`) | 32×32 | una por fila, desde la línea de un piso hasta la del siguiente, detrás de las plataformas |
| Plato (`plate.left/mid/right`) | 32×10 | centrado en la línea del plato |
| Segmento de ingrediente (`<tipo>.left/mid/right`) | 32×(12–18) | apoyado sobre el suelo de la plataforma |
| Personajes | partes de 8–30 | el punto de anclaje es el centro de su casilla; los pies tocan el suelo (+10 respecto al anclaje) |
| Fondo del tablero (`board.backdrop`) | 640×480 | detrás de todo |

Un tramo de 2 casillas usa `left` + `right`; de 3, `left` + `mid` + `right`; de
4 o más, `mid` repetido entre los extremos. Un tramo de una sola casilla usa
solo `mid`.

## 2. Paleta

Los colores **no se escriben en los SVG**: cada forma usa un token de la paleta
mediante una clase, y el tema activo decide el color. Paleta del tema `classic`:

| Token | `classic` | Uso |
|---|---|---|
| `background` | `#14181f` | fondo fuera del tablero |
| `backdrop` / `backdropAccent` | `#1b2130` / `#232b3d` | fondo del tablero y su motivo |
| `platform` / `platformEdge` | `#3d7ea6` / `#2c5d7c` | losa de plataforma y su canto |
| `ladder` / `ladderShade` | `#c98b4a` / `#9a6633` | largueros y peldaños |
| `plate` / `plateEdge` | `#e8edf2` / `#a9b4c0` | platos |
| `bun` / `bunShade` / `seed` | `#e9a75a` / `#c47f35` / `#fff1d6` | panes y sésamo |
| `patty` / `pattyShade` | `#7b3f1d` / `#5a2b12` | carne |
| `lettuce` / `lettuceShade` | `#6cc24a` / `#3f8f2c` | lechuga |
| `chef` / `chefShade` / `skin` / `cheek` | `#ffffff` / `#d7dde5` / `#f3c58f` / `#f29c8f` | chef |
| `scarf` / `trousers` | `#e2504c` / `#5b84d8` | pañuelo y pantalón del chef (y botones de la chaqueta) |
| `hair` / `shoe` | `#7a4421` / `#c98a52` | pelo y bigote; zapatos (claros para destacar sobre fondo oscuro) |
| `hotdog` / `sausage` | `#e3a052` / `#c8442f` | perrito |
| `pickle` / `pickleShade` | `#5f9e3a` / `#3e6e24` | pepinillo |
| `egg` / `yolk` | `#fbfbf6` / `#f6c03b` | huevo |
| `eye` / `pupil` | `#ffffff` / `#1d1f24` | ojos de todos los personajes |
| `outline` | `#1d222b` | contorno |
| `shadow` / `highlight` | `#000000` / `#ffffff` | sombra y brillo (siempre con opacidad) |
| `pepper` / `sparkle` | `#f4f1ea` / `#ffe27a` | nube de pimienta y destellos |
| `hudText` / `hudAccent` / `hudPanel` / `danger` | `#f2f4f8` / `#ffc857` / `#1e2533` / `#ff5a5a` | HUD |

Un tema puede cambiar cualquier token; los que no cambia se toman de `classic`.
Para añadir un token nuevo hay que añadirlo a `PALETTE_TOKENS`
(`src/view/theme/palette.ts`) y darle color en `classic`.

## 3. Trazo, radios, sombras y brillos

- **Contorno**: `stroke-width="1.5"`, `stroke-linejoin="round"`,
  `stroke-linecap="round"`, clase `s-outline`. Lo llevan ingredientes,
  personajes, platos e iconos. Las plataformas y escaleras no llevan contorno:
  se distinguen por el canto (`platformEdge`, `ladderShade`).
- **Radios**: 3 en piezas pequeñas (segmentos, peldaños, partes de 8–12) y 6
  en cuerpos grandes (cuerpo del chef, enemigos, fondo de los paneles). Los
  extremos `left` y `right` de ingredientes y platos van redondeados solo por
  fuera; el tramo `mid` es recto para que el ingrediente se lea continuo.
- **Sombra**: la forma principal repetida 1,5 unidades más abajo con la clase
  `f-shadow` y `opacity="0.25"`, dibujada antes que la forma.
- **Brillo**: una franja o elipse en la parte superior con `f-highlight` y
  `opacity="0.3"`.
- **Sombreado**: la parte inferior de una forma con su token `…Shade`, sin
  degradados. Los degradados se permiten (con `c-<token>` en `stop`) pero se
  evitan salvo en efectos.

## 4. Personajes

- Se componen de **partes** independientes (`chef.body`, `chef.head`,
  `chef.hat`, `chef.eyes`, brazos y piernas; `<enemigo>.body`, `.eyes` y
  `.feet`). Cada parte es un SVG propio, dibujado de frente o de perfil
  mirando a la **derecha**: el juego la voltea para mirar a la izquierda.
- Las partes no llevan sombra al suelo; la sombra de contacto la dibuja el
  cuerpo.
- Ojos grandes y redondos (`eye` + `pupil`) para que se lean a tamaño pequeño.
- La animación (rebote, balanceo, *squash & stretch*) se hace moviendo y
  escalando partes; no hay fotogramas alternativos.

## 5. HUD y tipografía

- Paneles laterales con fondo `hudPanel`, radio 6 y margen interior de 8.
- Fuente: pila del sistema `"Trebuchet MS", "Segoe UI", "Helvetica Neue",
  Arial, sans-serif`, en negrita. Tamaños: 11 (etiquetas), 16 (valores), 22
  (títulos de las pantallas de fin). Etiquetas en `hudText` con opacidad 0,7;
  valores en `hudText`; avisos en `hudAccent` o `danger`.
- Iconos del HUD (`hud.life`, `hud.pepper`, `hud.pause`) con el mismo
  contorno que los personajes.

## 6. Convención de autoría de los SVG

Las fuentes viven en `src/view/art/<tema>/<graphicId>.svg` y el tema
`classic` tiene un fichero por cada gráfico del catálogo.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 14" width="32" height="14">
  <rect class="f-shadow" x="1" y="2.5" width="30" height="11" rx="3" opacity="0.25"/>
  <rect class="f-patty s-outline" x="1" y="1" width="30" height="11" rx="3" stroke-width="1.5"/>
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

### Exportar desde Inkscape

Inkscape escribe colores en `style`. Para mantener un SVG editado con él:
guardar como **SVG plano**, quitar los atributos `style`, `inkscape:*` y
`sodipodi:*`, y sustituir cada color por la clase del token correspondiente.
La prueba de arte señala el fichero y el atributo que falten por limpiar.
