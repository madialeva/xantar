# Fundamentos del desarrollo de juegos

Guía para quien empieza a programar videojuegos y viene de otro tipo de
software. Explica, sin dar nada por sabido, los conceptos y la terminología que
aparecen al hacer un juego, y cómo se aplican en Xantar. No sustituye al
[manual de desarrollador](MANUAL.md), que describe la arquitectura concreta del
proyecto, ni a la [guía de estilo](STYLE_GUIDE.md), que fija el aspecto visual:
este documento explica el **porqué** de muchas decisiones que allí se dan por
hechas.

Cada apartado sigue el mismo esquema: **qué es**, **por qué importa** y **cómo
se hace en Xantar**, con enlaces al código cuando ayuda.

---

## Índice

1. [Qué tiene de especial un juego](#1-qué-tiene-de-especial-un-juego)
2. [El bucle de juego](#2-el-bucle-de-juego)
3. [El tiempo: fotogramas, ticks y paso fijo](#3-el-tiempo-fotogramas-ticks-y-paso-fijo)
4. [Separar simulación y vista](#4-separar-simulación-y-vista)
5. [Patrones de diseño habituales en juegos](#5-patrones-de-diseño-habituales-en-juegos)
6. [El motor: qué hace Phaser por nosotros](#6-el-motor-qué-hace-phaser-por-nosotros)
7. [Coordenadas, resolución y pantallas](#7-coordenadas-resolución-y-pantallas)
8. [Gráficos y tipos de assets](#8-gráficos-y-tipos-de-assets)
9. [Animación](#9-animación)
10. [Renderizado, GPU, filtros y rendimiento](#10-renderizado-gpu-filtros-y-rendimiento)
11. [Interfaz: HUD, menús y pantallas](#11-interfaz-hud-menús-y-pantallas)
12. [Niveles como datos](#12-niveles-como-datos)
13. [Movimiento, colisiones y física](#13-movimiento-colisiones-y-física)
14. [Inteligencia artificial y búsqueda de caminos](#14-inteligencia-artificial-y-búsqueda-de-caminos)
15. [Entrada: teclado, mando y táctil](#15-entrada-teclado-mando-y-táctil)
16. [Audio](#16-audio)
17. [Flujo del juego y estados](#17-flujo-del-juego-y-estados)
18. [Game feel: que se sienta bien](#18-game-feel-que-se-sienta-bien)
19. [Calidad: pruebas y verificación](#19-calidad-pruebas-y-verificación)
20. [Distribución: web, escritorio y móvil](#20-distribución-web-escritorio-y-móvil)
21. [Proceso: de prototipo a juego](#21-proceso-de-prototipo-a-juego)
22. [Glosario](#22-glosario)
23. [Para seguir aprendiendo](#23-para-seguir-aprendiendo)

---

## 1. Qué tiene de especial un juego

Una aplicación de gestión espera a que el usuario haga algo y responde. Un
juego **no espera**: aunque el jugador no toque nada, los enemigos se mueven,
los ingredientes caen y los contadores avanzan. Eso cambia casi todo:

- **Se ejecuta en bucle**, decenas de veces por segundo, y cada vuelta tiene un
  presupuesto de tiempo muy corto (unos 16 ms para ir a 60 imágenes por
  segundo). Lo que en otra aplicación sería un retraso aceptable, aquí es un
  tirón visible.
- **El estado cambia continuamente** y muchas cosas interactúan a la vez
  (chef, enemigos, ingredientes, platos, puntuación).
- **La sensación importa tanto como la corrección**: un salto puede ser
  "correcto" y aun así sentirse mal. Hay que probar jugando, no solo leyendo el
  código.
- **Se mezclan disciplinas**: programación, diseño de reglas, arte, animación,
  sonido e interfaz. Cada una tiene su vocabulario, y buena parte de este
  documento es ese vocabulario.

---

## 2. El bucle de juego

**Qué es.** El *game loop* es el corazón de cualquier juego. En cada vuelta:

```
 ┌──────────────────────────────────────────────┐
 │ 1. Leer la entrada (teclas, ratón, mando)    │
 │ 2. Actualizar el estado (mover, chocar, ...) │
 │ 3. Dibujar el estado en pantalla             │
 └──────────────────────────────────────────────┘
          ↑ se repite unas 60 veces por segundo ↓
```

Cada imagen dibujada es un **fotograma** (*frame*). Las **FPS** (*frames per
second*) son cuántas imágenes por segundo consigue dibujar el juego. 60 FPS es
el estándar de fluidez; por debajo de 30 se nota a tirones.

**Por qué importa.** Todo lo que pase en el juego ocurre dentro de ese bucle.
Si una vuelta tarda demasiado, el juego "pierde" fotogramas y se ve a saltos.

**En Xantar.** Phaser lleva el bucle por nosotros: en cada fotograma llama al
método `update(time, delta)` de la escena activa, donde `delta` es el tiempo
real transcurrido desde el fotograma anterior en milisegundos. Lo veremos en
[`src/scenes/GameScene.ts`](../src/scenes/GameScene.ts).

---

## 3. El tiempo: fotogramas, ticks y paso fijo

Este es uno de los conceptos más importantes y menos evidentes.

### 3.1 El problema del paso variable

La forma ingenua de mover algo es "en cada fotograma, avanza un poco". Pero el
número de fotogramas por segundo **no es fijo**: depende del monitor (60, 120,
144 Hz), de la carga del equipo o de si el navegador está en segundo plano. Si
el chef avanza 2 píxeles por fotograma, en un monitor de 144 Hz correría más
del doble de rápido que en uno de 60 Hz.

El arreglo habitual es multiplicar por el tiempo transcurrido (*delta time*):
`posición += velocidad × delta`. Funciona para mover, pero trae otros
problemas: con un `delta` grande (un tirón), un objeto rápido puede
"atravesar" una pared en una sola vuelta, y dos partidas con las mismas
pulsaciones nunca dan exactamente el mismo resultado.

### 3.2 Paso fijo (*fixed timestep*) y ticks

La solución de Xantar, y de la mayoría de juegos de acción serios, es separar
dos relojes:

- **Simulación a paso fijo**: las reglas avanzan en pasos idénticos llamados
  **ticks**, siempre 60 por segundo (cada tick son 16,67 ms), pase lo que pase
  con el monitor. Las velocidades se expresan "por tick" y las duraciones "en
  ticks" (el aturdimiento de un enemigo dura 300 ticks = 5 segundos).
- **Dibujo libre**: la pantalla se dibuja tan a menudo como pueda el equipo.

Para unirlos se usa un **acumulador**: en cada fotograma se suma el tiempo real
transcurrido y se ejecutan tantos ticks completos como quepan; el resto se
guarda para el siguiente fotograma.

```
tiempo real:   |--16ms--|--7ms--|--25ms--|--16ms--|
acumulador:     1 tick    0 ticks  1 tick   1 tick  (el resto se arrastra)
```

Si el juego se queda congelado un rato (por ejemplo, la pestaña estuvo en
segundo plano), se limita el número máximo de ticks de golpe para no entrar en
una "espiral de la muerte" intentando recuperar todo el tiempo perdido.

### 3.3 Interpolación

Si la simulación solo cambia 60 veces por segundo pero un monitor de 144 Hz
dibuja 144, muchos fotogramas mostrarían exactamente lo mismo y el movimiento
se vería a saltitos. Para evitarlo se **interpola**: cada entidad guarda su
posición del tick anterior y la del actual, y la vista dibuja un punto
intermedio según cuánto tiempo sobra en el acumulador (la fracción `alpha`,
entre 0 y 1).

```
tick anterior ●───────────────● tick actual
                    ▲
           se dibuja aquí si alpha = 0,4
```

### 3.4 Determinismo

Un sistema es **determinista** si, con el mismo estado inicial y las mismas
entradas, produce siempre el mismo resultado. Con paso fijo y un generador de
aleatoriedad con **semilla** (*seeded RNG*, un generador que da la misma
secuencia de números "aleatorios" si se le da el mismo número inicial), una
partida se puede repetir exactamente. Eso permite:

- **Pruebas** reproducibles de las reglas.
- **Repeticiones** (*replays*): basta con guardar la semilla y las pulsaciones
  (#8).
- **Depurar** un fallo raro volviendo a ejecutar la misma partida.

**En Xantar:**

- [`FixedStepper`](../src/sim/stepper.ts) es el acumulador (máximo 5 ticks por
  fotograma).
- [`rules.ts`](../src/sim/rules.ts) define `TICKS_PER_SECOND = 60` y expresa
  velocidades y duraciones en ticks.
- [`SeededRng`](../src/sim/rng.ts) es el generador con semilla que se inyecta a
  la simulación; en `src/sim/` está prohibido usar `Math.random` y `Date` (lo
  vigila el lint).
- [`interpolation.ts`](../src/objects/interpolation.ts) calcula la posición
  dibujada a partir de `prevX/prevY`, `x/y` y `alpha`.
- [`Simulation.determinism.test.ts`](../src/sim/Simulation.determinism.test.ts)
  comprueba que la misma semilla y las mismas entradas dan los mismos estados.

Un detalle sutil que ya resolvimos: una pulsación de un solo toque (la
pimienta) puede ocurrir en un fotograma que no ejecuta ningún tick. Por eso se
guarda "pendiente" y se entrega al siguiente tick que se ejecute, para no
perderla.

---

## 4. Separar simulación y vista

**Qué es.** Dividir el juego en dos capas con responsabilidades distintas:

| Capa | Responsabilidad | En Xantar |
|---|---|---|
| **Simulación** (dominio, modelo, núcleo) | Las reglas: quién se mueve, qué choca, cuántos puntos, cuándo se acaba la partida | [`src/sim/`](../src/sim/) |
| **Vista** (presentación) | Dibujar el estado, recoger la entrada, sonidos, animaciones y efectos | [`src/scenes/`](../src/scenes/), [`src/objects/`](../src/objects/), [`src/view/`](../src/view/) |

La regla de oro: **la vista conoce a la simulación, la simulación no conoce a
la vista**. La simulación no sabe que existe Phaser, ni el navegador, ni la
pantalla; trabaja en "unidades lógicas" (casillas) y en ticks.

```
 Entrada ──► Vista (Phaser) ──órdenes──► Simulación (TypeScript puro)
                  ▲                            │
                  └──── estado + eventos ──────┘
```

**Cómo se comunican:**

- **La vista manda órdenes**: en cada tick le pasa un `SimInput` (izquierda,
  derecha, arriba, abajo, pimienta). La simulación no sabe qué tecla era.
- **La vista lee el estado**: cada entidad expone un *snapshot* de solo
  lectura (posición, si está trepando, si está aturdida…).
- **La simulación emite eventos**: cosas que han pasado en el tick
  (`segmentStomped`, `chefHit`, `burgerDone`…). La vista reacciona a ellos con
  efectos, sonidos o actualizando el HUD. Ver
  [`events.ts`](../src/sim/events.ts).

**Por qué importa:**

- **Se puede probar sin pantalla.** Las cientos de pruebas de reglas de Xantar
  se ejecutan en milisegundos en Node, sin abrir un navegador.
- **Determinismo y repeticiones** (apartado anterior).
- **La vista se puede rehacer sin tocar las reglas**: el cambio visual de #4
  sustituyó todo el dibujo sin cambiar una sola línea de `src/sim/`, y la
  prueba de determinismo lo garantizaba.
- **Abre puertas**: un editor de niveles (#7), una IA que juegue sola, una
  versión en red o un cambio de motor reutilizan la misma simulación.

**Errores típicos que evita:** guardar el estado del juego en objetos de
Phaser, usar temporizadores o *tweens* del motor para reglas (si el juego se
reinicia en mitad de un tween, la regla queda a medias), o leer el teclado
desde dentro de una entidad.

**En Xantar** la frontera la vigila el lint: en `src/sim/` no se puede importar
Phaser, el DOM ni Node, ni usar `window`, `setTimeout`, `Math.random` o `Date`.
Las animaciones de la vista pueden usar tweens, pero solo como adorno: nunca
deciden nada de las reglas.

---

## 5. Patrones de diseño habituales en juegos

Los patrones clásicos de la orientación a objetos encajan muy bien en los
juegos. Los que usamos:

| Patrón | Idea | Dónde está en Xantar |
|---|---|---|
| **State** (estado) | Un objeto cambia de comportamiento según su estado, y cada estado es un objeto propio en lugar de un `switch` gigante | Fases de partida (preparado, jugando, muriendo, nivel completado, fin) en [`src/sim/phases/`](../src/sim/phases/); fases del ingrediente (reposo, esperando, cayendo, apilado) en [`Ingredient.ts`](../src/sim/entities/Ingredient.ts); estados de animación de los personajes en [`states.ts`](../src/view/rigs/states.ts) |
| **Strategy** (estrategia) | Comportamientos intercambiables detrás de una interfaz | La "mente" de los enemigos, [`EnemyBrain`](../src/sim/entities/EnemyBrain.ts) (`ChaseBrain` persigue al chef por el camino más corto) |
| **Observer** (observador) | Quien produce algo no sabe quién lo escucha | Los eventos de la simulación (`EventSink`) que la vista escucha; `GameSession` (estado de la partida para el HUD) y `Localization` (cambio de idioma) |
| **Factory** (fábrica) | Un punto que sabe crear objetos | `createEnemy`, `ArtFactory` (crea imágenes del tema a la escala correcta) |
| **Command** (orden) | Una acción representada como dato | `SimInput`: la entrada del tick como un objeto inmutable; base de las repeticiones |
| **Registry** (registro) | Catálogo extensible de tipos por identificador | [`PieceRegistry`](../src/sim/level/pieces/PieceRegistry.ts) (piezas de nivel), `ThemeRegistry` (temas) |

Otras dos prácticas que verás por todo el código:

- **Inyección de dependencias por constructor**: un objeto recibe sus
  colaboradores (el generador aleatorio, el registro de temas…) en lugar de
  crearlos. Así en las pruebas se pueden sustituir. Todo se "conecta" en un
  solo sitio, la **raíz de composición** ([`src/main.ts`](../src/main.ts)).
- **Datos inmutables y funciones puras** para cálculos sin estado (geometría,
  carga y validación de niveles, disposición de la pantalla): reciben datos y
  devuelven datos nuevos, sin efectos secundarios, y son triviales de probar.

Otro patrón muy común en juegos, que aquí no usamos todavía, es **ECS**
(*Entity Component System*): las entidades son solo identificadores, los datos
viven en componentes y la lógica en sistemas que recorren componentes. Brilla
con miles de entidades; para un juego como Xantar, con pocas decenas, la
orientación a objetos clásica es más clara.

---

## 6. El motor: qué hace Phaser por nosotros

**Qué es un motor.** Un *game engine* (motor) o *framework* de juegos es la
infraestructura común que casi todos los juegos necesitan: bucle, dibujo,
entrada, sonido, carga de recursos, cámaras, animaciones. Unity, Godot o Unreal
son motores completos con editor visual; **Phaser** es un framework de código
para juegos 2D en el navegador.

Conceptos de Phaser que aparecen en el proyecto:

- **Escena** (*Scene*): una "pantalla" o modo del juego con su propio ciclo de
  vida (`preload`, `create`, `update`). Xantar tiene `BootScene` (prepara los
  gráficos), `TapScene` (pantalla de título) y `GameScene` (la partida).
- **Game Object**: cualquier cosa que se dibuja (imagen, texto, contenedor,
  gráfico vectorial simple).
- **Contenedor** (*Container*): agrupa objetos para moverlos, rotarlos o
  escalarlos juntos. Un personaje por partes es un contenedor con una imagen
  por parte.
- **Lista de dibujo y profundidad** (*display list*, *depth*): el orden en que
  se pintan las cosas; lo que tiene más profundidad queda encima (el chef
  encima de los ingredientes, el HUD encima de todo). A esto también se le
  llama *z-order*.
- **Cámara**: la "ventana" por la que se ve el mundo. Puede desplazarse
  (*scroll*), acercarse (*zoom*) y aplicar efectos (el destello rojo al perder
  una vida).
- **Textura**: una imagen cargada en la tarjeta gráfica, lista para dibujarse
  muchas veces.
- **Tween** (de *in-between*): una animación de una propiedad de un valor a
  otro a lo largo del tiempo (posición, escala, transparencia), con una curva
  de suavizado (*easing*). Ver el apartado de animación.
- **Loader**: el cargador de recursos (imágenes, sonidos). Un detalle del
  proyecto: dentro de Electron los ficheros se abren con `file://` y ahí el
  cargador por defecto (XHR) no funciona, por eso hay ajustes específicos.

---

## 7. Coordenadas, resolución y pantallas

### 7.1 Mundo, pantalla y unidades lógicas

- **Coordenadas de mundo**: dónde están las cosas en el juego.
- **Coordenadas de pantalla**: en qué píxel del monitor se dibujan.
- **Unidades lógicas**: una unidad de medida propia del juego,
  independiente del monitor. En Xantar una casilla (*tile*) mide 32 unidades y
  el tablero mide 640×480 (20×15 casillas). La simulación va todavía más allá
  y trabaja directamente en casillas.

La cámara es la que traduce del mundo a la pantalla. Así, el código de juego
nunca piensa en píxeles reales.

### 7.2 Rejilla y casillas

Muchos juegos clásicos se construyen sobre una **rejilla** (*grid*) de
casillas (*tiles*): el escenario es una matriz de piezas (plataforma,
escalera, vacío) y los objetos se alinean a ella. Simplifica el diseño de
niveles, las colisiones y la búsqueda de caminos. Xantar usa una rejilla de 32
unidades ([`src/config.ts`](../src/config.ts)) y la regla del proyecto es no
"inventar" posiciones de pantalla a mano, sino calcularlas desde la rejilla.

### 7.3 Resolución, proporción y escalado

- **Resolución**: tamaño en píxeles (1920×1080).
- **Proporción** (*aspect ratio*): relación ancho/alto. 4:3 (monitores
  antiguos), 16:9 (la mayoría hoy), 19,5:9 o más en móviles en horizontal,
  21:9 en monitores ultrapanorámicos.
- **Escalar** el juego a la ventana tiene varias estrategias:
  - **FIT** (ajustar): se agranda hasta tocar un borde y se mantiene la
    proporción; sobra espacio en el otro eje, que queda en negro (**bandas** o
    *letterbox*).
  - **EXPAND/RESIZE**: el área de juego crece para llenar la ventana, y el
    juego decide qué hace con el espacio extra.
  - **Escalado entero** (×2, ×3…): típico del pixel art para que cada píxel se
    vea nítido.

**En Xantar** el tablero es siempre 640×480 lógico y está centrado. El área de
juego mide 480 de alto y entre 832 y 1152 de ancho según la proporción de la
ventana ([`computeLayout`](../src/view/layout/computeLayout.ts)); el espacio de
los lados son los **paneles laterales** del HUD. Así, en 16:9 y en móviles en
horizontal no hay bandas negras; en 4:3 sí aparecen arriba y abajo.

### 7.4 Pantallas de alta densidad y nivel de escala

Muchas pantallas tienen más de un píxel físico por "píxel CSS" (el
`devicePixelRatio`; 2 en muchos portátiles y móviles). Si el juego dibuja en un
lienzo pequeño y el navegador lo estira, se ve borroso.

Xantar dibuja el lienzo al doble de su tamaño lógico (**nivel de escala** o
*render tier* 2, `RENDER_TIER` en `src/config.ts`) y la cámara aplica un zoom
de 2, de modo que el código sigue trabajando en unidades lógicas pero la
imagen sale nítida. Elegir el nivel automáticamente según la pantalla es
trabajo pendiente (#23).

---

## 8. Gráficos y tipos de assets

**Asset** (recurso) es cualquier fichero que el juego usa y no es código:
imágenes, sonidos, música, fuentes, niveles. La forma de producir los gráficos
condiciona todo el pipeline, así que conviene conocer las opciones.

### 8.1 Raster y vectorial

- **Raster** (mapa de bits): la imagen es una cuadrícula de píxeles de colores
  (PNG, JPG, WebP). Si se agranda, se pixela o se emborrona.
- **Vectorial**: la imagen se describe con formas geométricas (líneas, curvas,
  rellenos). El formato web es **SVG**. Se puede dibujar a cualquier tamaño
  sin perder calidad.

La tarjeta gráfica, al final, siempre dibuja píxeles: un vectorial tiene que
**rasterizarse** (convertirse en píxeles) antes de usarse como textura.

### 8.2 Estilos y sus implicaciones

| Estilo | Qué es | Ventajas | Inconvenientes |
|---|---|---|---|
| **Pixel art** | Arte dibujado píxel a píxel a resolución muy baja, como los juegos de 8 y 16 bits | Estética retro, ficheros pequeños, rápido de iterar para un dibujante | Solo se ve bien escalado por enteros y sin suavizado; exige oficio |
| **Raster en alta resolución** (ilustración) | Dibujos pintados a mano o en 3D renderizado a 2D | Máximo detalle | Ficheros grandes; hay que preparar varias resoluciones |
| **Vectorial** | Formas geométricas limpias, colores planos | Nítido a cualquier tamaño, fácil de recolorear (temas), ficheros pequeños | Menos detalle orgánico; hay que rasterizar en el momento adecuado |
| **3D** | Modelos con volumen, luces y materiales | Libertad de cámara | Otra dimensión de complejidad; no aplica a Xantar |

Un detalle técnico del pixel art: al escalar se usa **filtrado "vecino más
cercano"** (*nearest*), que mantiene los píxeles cuadrados; el filtrado
**lineal** (*linear*), el normal para ilustración y vectorial, suaviza los
bordes.

**En Xantar** se eligió el **vectorial** (#4): todo sale de SVG que siguen la
[guía de estilo](STYLE_GUIDE.md), se rasterizan al arrancar a la escala real
de dibujo (`BootScene` + `SvgRasterizer`) y se usan como texturas. Así el juego
se ve nítido en cualquier pantalla y el mismo dibujo sirve para varios temas.

### 8.3 Sprites, hojas de sprites y atlas

- **Sprite**: una imagen 2D que representa un objeto del juego (el chef, un
  enemigo). Por extensión, el objeto que la dibuja.
- **Hoja de sprites** (*spritesheet*): una sola imagen con muchos fotogramas de
  animación colocados en rejilla.
- **Atlas de texturas**: una imagen grande con muchas imágenes pequeñas
  empaquetadas, más un índice de dónde está cada una. La tarjeta gráfica dibuja
  más rápido cuando muchas cosas comparten la misma textura (ver *draw calls*
  en el apartado 10). Xantar no lo necesita todavía (unas 60 texturas
  pequeñas), está anotado en #23.

### 8.4 Paleta, temas y guía de estilo

- **Paleta**: el conjunto cerrado de colores del juego. En Xantar cada color
  tiene un nombre (*token*: `bun`, `patty`, `outline`…) y los SVG usan el
  nombre, no el color.
- **Tema** o *skin*: un revestimiento visual intercambiable. Un tema cambia la
  paleta y, si quiere, algunos dibujos; el nivel y las reglas no cambian.
  Xantar tiene `classic` y `midnight`, y un nivel puede elegir el suyo.
- **Guía de estilo**: el documento que fija las reglas visuales (paleta,
  grosores, radios, sombras, tipografía) para que todo parezca hecho por la
  misma mano.

---

## 9. Animación

Hay varias formas de animar, y cada una pide un tipo de asset distinto.

### 9.1 Fotograma a fotograma

La clásica: se dibuja cada postura y se muestran en secuencia, como un dibujo
animado (*frame-by-frame*, con hojas de sprites). Da control total al artista,
pero cada animación nueva son muchos dibujos nuevos.

### 9.2 Interpolación (tweens) y curvas de suavizado

Un **tween** cambia una propiedad de un valor a otro en un tiempo dado: mover
de A a B en 200 ms, escalar de 0,7 a 1, desvanecer. La **curva de suavizado**
(*easing*) decide cómo avanza: lineal (velocidad constante), *ease-in*
(arranca despacio), *ease-out* (frena al final), *back* (se pasa un poco y
vuelve), *bounce* (rebota). Un buen *easing* es la diferencia entre un
movimiento mecánico y uno con vida.

### 9.3 Rig, huesos y animación por partes

- **Rig** (montaje): la estructura que permite mover un personaje. El término
  viene de la animación 3D, donde un modelo lleva un **esqueleto** de
  **huesos** (*bones*) y cada hueso arrastra la parte del dibujo que tiene
  asociada.
- **Animación esquelética** 2D: herramientas como Spine o DragonBones
  permiten montar esqueletos sobre dibujos 2D y deformarlos. Son potentes pero
  añaden un programa de autoría y una librería al juego.
- **Animación por partes** (*cutout*): versión sencilla del rig. El personaje
  se divide en piezas rígidas (cuerpo, cabeza, gorro, brazos, piernas), cada
  una con su **punto de giro** (*pivot*, el hombro para un brazo), y se animan
  moviendo, girando y escalando las piezas.

**En Xantar** se usa la animación por partes con tweens: cada personaje es un
`CharacterRig` descrito como datos en [`rigs.ts`](../src/view/rigs/rigs.ts), y
sus estados (quieto, andar, trepar, golpeado, aturdido) son objetos State en
[`states.ts`](../src/view/rigs/states.ts). Qué estado toca lo decide una
función pura a partir del snapshot de la simulación.

### 9.4 Principios de animación

Los animadores de Disney resumieron en los años 80 doce principios que siguen
vigentes. Los más útiles en juegos:

- **Squash & stretch** (aplastar y estirar): un objeto se aplasta al chocar y
  se estira al moverse rápido. Da sensación de peso y elasticidad. En Xantar,
  los ingredientes al aterrizar y el chef al ser golpeado.
- **Anticipación**: un pequeño movimiento previo que anuncia la acción.
- **Acción secundaria**: detalles que acompañan a la principal (el gorro que
  salta cuando golpean al chef).
- **Exageración**: en pantalla pequeña, lo sutil no se ve.

### 9.5 Máquina de estados de animación

Un personaje no hace una sola animación: anda, trepa, se para, recibe un
golpe. La **máquina de estados de animación** decide cuál toca y gestiona las
transiciones (parar la anterior, volver a la postura base y arrancar la
nueva). Es justo lo que hace `RigAnimator`.

---

## 10. Renderizado, GPU, filtros y rendimiento

### 10.1 CPU, GPU y APIs gráficas

- La **CPU** ejecuta la lógica del juego.
- La **GPU** (tarjeta gráfica, dedicada o integrada en el procesador) dibuja.
  Es muy rápida haciendo lo mismo con muchos píxeles a la vez.
- En el navegador se le habla a la GPU con **WebGL** (o el más moderno WebGPU).
  Si no hay WebGL, Phaser puede usar **Canvas 2D**, que dibuja con la CPU: más
  compatible, más lento y sin efectos especiales.

### 10.2 Draw calls y batching

Cada vez que la CPU pide a la GPU "dibuja esto" es una **llamada de dibujo**
(*draw call*), y cada una tiene un coste fijo. El motor intenta **agrupar**
(*batching*) muchas imágenes que usan la misma textura en una sola llamada. Por
eso existen los atlas.

### 10.3 Shaders, filtros y post-procesado

- **Shader**: un pequeño programa que se ejecuta en la GPU, normalmente una
  vez por píxel, para calcular su color. Todos los efectos visuales
  "especiales" son shaders.
- **Filtro** o **efecto**: un shader aplicado a un objeto o a toda la imagen
  (desenfocar, cambiar colores, iluminar).
- **Post-procesado**: filtros que se aplican a la imagen completa ya dibujada,
  como un retoque final.
- **Pasada** (*pass*): cada vez que algo se dibuja en una imagen intermedia
  (*framebuffer*) para aplicarle un filtro. Cada pasada cuesta.

Efectos típicos: **glow** (resplandor alrededor de un objeto), **bloom**
(halo de luz alrededor de las zonas brillantes de la imagen), **blur**
(desenfoque), **sombras** (*drop shadow*), **viñeta** (oscurecer los bordes).

**La lección de Xantar (#4):** probamos glow y sombra en cada ingrediente y
personaje, y bloom sobre la cámara. En el equipo de referencia (una gráfica
integrada modesta), glow y sombra por objeto suponían unas 20 pasadas extra
por fotograma y el juego dejaba de ser fluido; el bloom, una sola pasada, iba
bien. Por eso: las sombras y brillos van **horneados** (dibujados dentro de los
propios SVG, sin coste extra) y el único filtro en uso es el bloom del tema
`midnight`.

**Hornear** (*bake*) un efecto es calcularlo una vez de antemano y guardarlo
en el asset, en vez de calcularlo en cada fotograma.

### 10.4 Rendimiento

- **Presupuesto por fotograma**: 16,7 ms a 60 FPS, para todo (lógica, dibujo,
  navegador).
- **Equipo de referencia**: el equipo modesto en el que el juego debe ir
  fluido. En Xantar, una gráfica integrada AMD; cualquier efecto nuevo debe
  mantener 60 FPS en él.
- **Perfilar** (*profiling*): medir dónde se va el tiempo, con las
  herramientas del navegador, antes de optimizar. Optimizar a ciegas suele
  hacer el código más complejo sin mejorar nada.

---

## 11. Interfaz: HUD, menús y pantallas

- **HUD** (*heads-up display*): la información que se muestra encima o
  alrededor del juego mientras se juega: puntuación, vidas, munición, mapa. El
  nombre viene de los visores de los cazas, que proyectan datos sin que el
  piloto aparte la vista. En Xantar, los paneles laterales (puntos, récord,
  nivel, vidas, pimientas y botón de pausa).
- **HUD en una escena paralela**: muchos juegos dibujan el HUD en una escena
  o capa propia que se ejecuta a la vez que la del mundo. Así el HUD sigue
  activo cuando el mundo está en pausa y no se mezcla con su cámara ni con su
  lógica. En Xantar, `HudScene` corre junto a `GameScene` y solo conoce la
  partida a través de un mediador (`GameSession`, ver apartado 17).
- **Diegético y no diegético**: un HUD *diegético* forma parte del mundo del
  juego (un reloj en la muñeca del personaje); uno *no diegético* está
  superpuesto (nuestros paneles).
- **Superposición** (*overlay*): una capa temporal encima del juego (los
  mensajes de preparado y de nivel completado, el fin de partida y la pausa).
- **Menús y pantallas**: título, opciones, pausa, créditos. Su orden es el
  **flujo de pantallas** (apartado 17). Un buen menú se maneja igual con
  teclado, ratón o dedo; en Xantar lo hace el componente `MenuList`.
- **Internacionalización** (*i18n*, por las 18 letras entre la *i* y la *n*
  de *internationalization*): preparar el juego para varios idiomas. La clave
  es que **ningún texto visible esté escrito en el código**: todos salen de
  un **catálogo** por idioma, identificados por claves. Dos detalles que
  suelen olvidarse: los **parámetros** (no es lo mismo «3 vidas» que «1 vida»:
  las reglas de **plural** cambian de un idioma a otro) y el **formato de
  números** (12.500 en español, 12,500 en inglés). Xantar lo hace sin
  librerías, con catálogos tipados (`src/i18n/`): si a un idioma le falta un
  texto, el compilador lo detecta.

Buenas prácticas: que el HUD no tape la acción (por eso el tablero queda libre
y el HUD va a los lados), que se lea de un vistazo (iconos más números) y que
quepa en la pantalla más pequeña soportada.

---

## 12. Niveles como datos

**Qué es.** En lugar de programar cada nivel, describirlo como **datos** en un
fichero que el juego carga: qué hay en cada casilla, dónde empieza el chef,
dónde aparecen los enemigos.

**Por qué importa:**

- Crear o cambiar un nivel no toca el código de reglas.
- Permite un **editor de niveles** (#7) y que los jugadores creen los suyos.
- El formato puede **validarse**: comprobar al cargar que el nivel es
  jugable.

**Conceptos relacionados:**

- **Tilemap** (mapa de casillas): el nivel como matriz de piezas. Xantar usa
  una cuadrícula de caracteres en JSON (`=` plataforma, `H` escalera, `_`
  plato…), con tres capas (estructura, ingredientes, actores).
- **Registro de piezas**: el catálogo que dice qué significa cada símbolo, de
  modo que añadir una pieza nueva no obliga a tocar el cargador.
- **Formato versionado**: el fichero lleva un número de versión para poder
  evolucionar sin romper niveles antiguos.
- **Validador**: un conjunto de reglas que detecta niveles imposibles
  (ingredientes inalcanzables, escaleras que no llevan a ninguna parte).

En Xantar: [`classic.level.json`](../src/levels/classic.level.json),
[`src/sim/level/`](../src/sim/level/) y la sección 8.6 del
[manual](MANUAL.md).

---

## 13. Movimiento, colisiones y física

- **Colisión**: detectar que dos cosas se tocan. La forma más común en 2D es
  comparar **cajas alineadas con los ejes** (*AABB*, *axis-aligned bounding
  box*): dos rectángulos se tocan si se solapan en X y en Y. En Xantar, el
  contacto entre chef y enemigo es una comprobación de distancia en X y en Y
  (`CONTACT_X`, `CONTACT_Y`).
- **Efecto túnel** (*tunneling*): un objeto rápido avanza tanto en un paso que
  "salta" por encima de otro sin detectar el choque. Se evita con pasos
  pequeños o con **colisión continua** (comprobar todo el recorrido), que es
  lo que propone #18 para aplastar enemigos con ingredientes.
- **Motor de física**: una librería que simula gravedad, rebotes y fuerzas
  (Phaser incluye Arcade Physics y Matter.js). Es ideal para juegos donde
  importa la física realista; para un arcade de plataformas y escaleras como
  este, un movimiento propio sobre la rejilla es más predecible y fácil de
  probar. Por eso Xantar **no usa motor de física**.
- **Movimiento sobre un grafo**: el chef y los enemigos no se mueven
  libremente, sino por tramos de plataforma y de escalera. Su posición es "en
  qué tramo estoy y a qué distancia del inicio", lo que permite, por ejemplo,
  parar e invertir el sentido a mitad de una escalera.

---

## 14. Inteligencia artificial y búsqueda de caminos

En juegos, "IA" casi nunca es aprendizaje automático: es **el comportamiento
de los personajes que no controla el jugador**, programado con reglas.

- **Máquinas de estados**: el enemigo está patrullando, persiguiendo,
  aturdido…; cada estado decide qué hacer y cuándo pasar a otro.
- **Grafo de navegación** (*navigation graph*, *navmesh* en 3D): la
  representación de por dónde se puede ir. Nodos (cruces) y aristas (tramos
  transitables).
- **Búsqueda de caminos** (*pathfinding*): encontrar la ruta más corta en ese
  grafo. Los algoritmos clásicos son **Dijkstra** (explora por distancia
  acumulada) y **A\*** (como Dijkstra pero guiado por una estimación de lo que
  falta, más rápido en mapas grandes).
- **Aleatoriedad controlada**: un poco de azar hace que los enemigos no sean
  robots predecibles; con semilla, sigue siendo reproducible.
- **Dificultad justa**: la IA no tiene que ser perfecta, tiene que ser
  divertida. En Xantar los enemigos deciden cada cierto tiempo (no en cada
  tick) y a veces se dan la vuelta (20 %), para que se les pueda esquivar.

En Xantar: [`NavigationGraph`](../src/sim/nav/NavigationGraph.ts) con
`shortestPath` (Dijkstra) y la estrategia
[`ChaseBrain`](../src/sim/entities/EnemyBrain.ts). Comportamientos distintos
por tipo de enemigo están previstos en #17.

---

## 15. Entrada: teclado, mando y táctil

- **Sondeo frente a eventos**: se puede preguntar en cada fotograma "¿está
  pulsada esta tecla?" (*polling*) o reaccionar cuando se pulsa (*eventos*).
  Los juegos suelen sondear para el movimiento y usar eventos para acciones
  puntuales.
- **Pulsación mantenida y pulsación puntual**: andar es "mientras esté
  pulsada"; lanzar pimienta es "en el momento de pulsar" (*just pressed*).
- **Acciones en lugar de teclas**: el juego debería pensar en "izquierda" o
  "pimienta", no en "flecha izquierda" o "espacio". Una capa de **acciones**
  traduce teclado, mando o pantalla táctil a esas acciones y permite
  **reasignar** controles (#6). Xantar ya da un paso en esa dirección: la
  simulación solo recibe un `SimInput` con acciones.
- **Búfer de entrada**: recordar una pulsación unos instantes para que no se
  pierda (lo que hacemos con la pimienta entre ticks).
- **Táctil**: en móvil hacen falta controles en pantalla (cruceta y botones
  virtuales) o gestos. Pendiente en #6; los menús de Xantar ya aceptan toques.
- **Teclas que se queda el navegador**: en pantalla completa, Esc sirve para
  salir de ella y normalmente no llega a la página. La API *Keyboard Lock*
  (`navigator.keyboard.lock`) permite recibirla; Xantar la usa y, donde no
  existe, pausa la partida al salir de la pantalla completa.

---

## 16. Audio

- **Música** y **efectos de sonido** (*SFX*) se gestionan por separado, con
  volúmenes independientes (**buses** o canales) y opción de silenciar.
- **Sonido a partir de eventos**: el mismo sistema de eventos de la simulación
  sirve para disparar sonidos (`segmentStomped` → "plof").
- **Política de reproducción automática** (*autoplay*): los navegadores no
  dejan sonar audio hasta que el usuario interactúa con la página. Por eso la
  pantalla de título de Xantar espera un clic, un toque o una tecla: ese gesto
  desbloquea la música (y la pantalla completa, que tiene la misma regla).
- **Pausa al perder el foco**: si el jugador cambia de pestaña, el juego y el
  sonido deberían pausarse. Xantar ya pausa la partida; el sonido llega con
  #6.

---

## 17. Flujo del juego y estados

Un juego completo es una **máquina de estados** a gran escala: título → menú →
partida → pausa → fin de partida → menú. Cada estado decide qué se dibuja, qué
entrada se acepta y a dónde se puede ir.

**Dos máquinas, no una.** Conviene separar:

- Las **fases de partida**, que forman parte de las reglas: preparado, jugando,
  muriendo, nivel completado y fin de partida. Deciden cuándo se mueve cada
  cosa y cuánto dura cada pausa de juego, así que van en la simulación,
  cuentan ticks y son deterministas (una repetición las reproduce igual). En
  Xantar son objetos State en `src/sim/phases/`.
- El **flujo de la aplicación**: qué pantalla está abierta y si la partida
  está en pausa. No cambia ninguna regla (en pausa la simulación simplemente no
  avanza), así que es cosa de la vista: escenas de Phaser y una bandera de
  pausa.

Mezclarlas es un error clásico: si la pausa fuera una fase, una repetición
grabaría cuándo pausó el jugador; si el «¡PREPARADO!» fuera un temporizador de
la vista, la simulación y la pantalla podrían desincronizarse.

Conceptos relacionados:

- **Escenas** del motor como soporte del flujo, y **escenas paralelas** (el
  HUD sobre el tablero).
- **Mediador**: un objeto por el que dos partes se comunican sin conocerse. En
  Xantar, `GameSession` recibe el estado de la partida que publica el tablero
  y las órdenes (pausar, reanudar, salir) que pide el HUD.
- **Pausar de verdad**: detener la simulación, las animaciones y los efectos,
  y al reanudar **no recuperar de golpe** el tiempo pasado en pausa (el
  acumulador de ticks se vacía).
- **Persistencia**: guardar récords y opciones entre sesiones. En el navegador
  se usa `localStorage`; hay que **versionar** el registro y **tolerar datos
  rotos** (un ajuste corrupto no debe impedir jugar). En Xantar,
  `src/settings/`.
- **Opciones**: idioma, tema y, más adelante, volumen y controles.

---

## 18. Game feel: que se sienta bien

*Game feel* o *juice* es el conjunto de pequeños detalles que hacen que un
juego se sienta vivo y responda bien: no cambian las reglas, cambian la
sensación.

- **Respuesta inmediata**: cada acción del jugador debe tener una reacción
  visible o audible en el mismo instante.
- **Efectos al ocurrir algo**: destellos, pequeñas sacudidas, partículas,
  sonidos. En Xantar: el destello al pisar un segmento, el aplastamiento al
  aplastar un enemigo o las chispas al completar una hamburguesa
  (`EventEffects`).
- **Squash & stretch y easing** (apartado 9).
- **Tolerancia** (*forgiveness*): pequeñas ayudas invisibles, como permitir
  agarrar una escalera aunque el chef no esté exactamente alineado
  (`LADDER_GRAB_DISTANCE`).
- **Sin exagerar**: demasiados efectos cansan y tapan la información.

---

## 19. Calidad: pruebas y verificación

- **Pruebas unitarias de las reglas**: gracias a separar la simulación, se
  prueban escenarios completos ("el chef pisa los cuatro segmentos y el
  ingrediente cae") sin pantalla. `npm run test`.
- **Prueba de determinismo**: misma semilla y mismas entradas, mismos
  resultados.
- **Pruebas de humo** (*smoke tests*): arrancar el juego de verdad y comprobar
  que no se rompe nada evidente. En Xantar, `npm run smoke` abre la versión de
  escritorio, simula pulsaciones, guarda capturas y falla si hay errores en la
  consola.
- **Revisión visual**: los fallos visuales no los detectan las pruebas
  unitarias. La lámina de arte (`/tools/art-sheet.html` con `npm run dev`)
  muestra todos los gráficos y animaciones con el código real.
- **Lint, formato y tipos**: herramientas automáticas que detectan errores y
  mantienen el estilo (`npm run lint`, `format:check`, `typecheck`).
- **Integración continua** (*CI*): que todo lo anterior se ejecute solo en
  cada cambio (#6).
- **Pruebas de juego** (*playtesting*): jugar y observar a otros jugar. Es la
  única forma de saber si algo es divertido, difícil o confuso.

---

## 20. Distribución: web, escritorio y móvil

- **Build**: el proceso que convierte el código fuente en algo ejecutable y
  optimizado (`npm run build` genera la web en `dist/`).
- **Web**: un juego HTML5 es una página estática; se puede publicar en
  cualquier alojamiento de ficheros (#14).
- **Escritorio**: **Electron** empaqueta el juego con un navegador Chromium
  dentro, como aplicación instalable (`npm run build:desktop`). Peculiaridad:
  abre los ficheros con `file://`, que tiene restricciones distintas a un
  servidor web.
- **Móvil**: se puede jugar en el navegador del móvil o empaquetar como
  aplicación (con herramientas como Capacitor). Implica controles táctiles,
  orientación, tamaños de pantalla muy variados y hardware más limitado.
- **Probar en el móvil sin publicar**: servir la build en la red local
  (`npm run preview -- --host`) y abrirla desde el móvil en la misma Wi-Fi.

---

## 21. Proceso: de prototipo a juego

- **Prototipo / POC** (*proof of concept*): una versión rápida para comprobar
  que una idea funciona, sin preocuparse por la calidad. La primera versión de
  Xantar lo era.
- **Refundación** (lo que estamos haciendo): reconstruir sobre bases sólidas
  lo que el prototipo demostró, en pasos pequeños: primero la simulación (#2),
  después el modelo de nivel (#3), después lo visual (#4).
- ***Vertical slice***: una porción pequeña del juego, pero acabada al nivel
  de calidad final (un nivel completo, con su arte, sonido y menús). Sirve
  para validar el conjunto antes de producir mucho contenido.
- **Hoja de ruta** (*roadmap*): la lista ordenada de lo que viene, aquí en las
  issues de GitHub agrupadas por versión.
- **Incrementos pequeños y revisables**: cada cambio se puede probar y revisar
  por separado. En Xantar, cada cambio pasa por OpenSpec (propuesta y diseño
  aprobados antes de programar), una rama y un PR.
- **Alcance** (*scope*) y ***scope creep***: el alcance es lo que entra en un
  cambio; el *scope creep* es que vaya creciendo sin control. Los Non-Goals de
  cada diseño y las issues de seguimiento sirven para contenerlo: lo que no
  entra queda anotado para más adelante.
- **Deuda técnica**: atajos que hoy ahorran tiempo y mañana cuestan. Se asume
  conscientemente y se anota.

---

## 22. Glosario

| Término | Significado |
|---|---|
| AABB | Caja de colisión rectangular alineada con los ejes |
| Acumulador | Tiempo real pendiente de convertir en ticks de simulación |
| Asset | Recurso que no es código: imágenes, sonidos, fuentes, niveles |
| Atlas | Imagen grande con muchas imágenes pequeñas empaquetadas |
| Bake (hornear) | Precalcular un efecto y guardarlo en el asset |
| Batching | Agrupar dibujos para hacer menos llamadas a la GPU |
| Bloom | Halo de luz alrededor de las zonas brillantes de la imagen |
| Bones (huesos) | Piezas del esqueleto de un rig que mueven partes del dibujo |
| Canvas 2D | API de dibujo del navegador por CPU; alternativa a WebGL |
| Determinismo | Mismas entradas y estado inicial, mismo resultado |
| Draw call | Petición de dibujo de la CPU a la GPU |
| Easing | Curva que da forma a la velocidad de una animación |
| ECS | Entity Component System, arquitectura basada en datos |
| Escena paralela | Escena que se ejecuta a la vez que otra (el HUD sobre el tablero) |
| Evento | Aviso de que algo ha pasado en la simulación |
| Fase de partida | Estado de las reglas: preparado, jugando, muriendo, nivel completado, fin |
| FPS | Fotogramas por segundo |
| Frame (fotograma) | Cada imagen que se dibuja en pantalla |
| Framebuffer | Imagen intermedia en la GPU donde se dibuja antes de mostrar |
| Game feel / juice | Detalles que hacen que el juego se sienta vivo |
| Game loop | Bucle leer entrada, actualizar, dibujar |
| Glow | Resplandor alrededor de un objeto |
| GPU | Procesador gráfico |
| Grafo de navegación | Representación de por dónde se puede caminar |
| HUD | Información superpuesta durante la partida (vidas, puntos…) |
| i18n | Internacionalización: preparar el juego para varios idiomas |
| Interpolación | Dibujar un punto intermedio entre dos estados de la simulación |
| Letterbox (bandas) | Franjas vacías cuando la proporción no coincide |
| Mediador | Objeto por el que dos partes se comunican sin conocerse |
| Nivel de escala (render tier) | Multiplicador entre tamaño lógico y píxeles reales |
| Overlay | Capa temporal sobre el juego (pantalla de fin) |
| Paleta | Conjunto cerrado de colores del juego |
| Pasada (pass) | Dibujar a una imagen intermedia para aplicarle un efecto |
| Pathfinding | Búsqueda del camino más corto |
| Persistencia | Guardar datos entre sesiones (ajustes, récords) |
| Pivot | Punto de giro de una parte de un personaje |
| Plural (reglas de) | Cómo cambia una palabra según la cantidad en cada idioma |
| Pixel art | Arte dibujado píxel a píxel a baja resolución |
| Post-procesado | Efectos aplicados a la imagen completa ya dibujada |
| Rasterizar | Convertir un dibujo vectorial en píxeles |
| Rig | Montaje que permite animar un personaje (esqueleto o partes) |
| RNG con semilla | Generador aleatorio reproducible |
| Scene (escena) | Una pantalla o modo del juego en el motor |
| Shader | Programa que se ejecuta en la GPU para calcular colores |
| Simulación | Capa con las reglas del juego, sin dibujo |
| Snapshot | Vista de solo lectura del estado de una entidad |
| Sprite | Imagen 2D de un objeto del juego |
| Spritesheet | Imagen con los fotogramas de una animación |
| Squash & stretch | Aplastar y estirar para dar peso y elasticidad |
| SVG | Formato de imagen vectorial de la web |
| Tema / skin | Revestimiento visual intercambiable |
| Textura | Imagen cargada en la GPU |
| Tick | Paso fijo de la simulación (1/60 s en Xantar) |
| Tile (casilla) | Celda de la rejilla del nivel |
| Tilemap | Nivel descrito como matriz de casillas |
| Tunneling | Atravesar un objeto por avanzar demasiado en un paso |
| Tween | Animación de una propiedad entre dos valores |
| Unidades lógicas | Medidas propias del juego, independientes de la pantalla |
| Vertical slice | Porción pequeña del juego acabada a calidad final |
| WebGL | API gráfica del navegador que usa la GPU |
| Z-order (profundidad) | Orden en que se dibujan los objetos |

---

## 23. Para seguir aprendiendo

- **Robert Nystrom, *Game Programming Patterns*.** Libro gratuito en línea
  (gameprogrammingpatterns.com) sobre los patrones de este documento aplicados
  a juegos: bucle de juego, paso de actualización, State, Command, Observer.
  Muy recomendable para alguien que viene de la orientación a objetos.
- **Glenn Fiedler, *Fix Your Timestep!*** Artículo clásico sobre el paso
  fijo, el acumulador y la interpolación (gafferongames.com).
- **Red Blob Games, de Amit Patel** (redblobgames.com). Explicaciones
  interactivas de búsqueda de caminos, rejillas y coordenadas.
- **Jesse Schell, *The Art of Game Design: A Book of Lenses*.** Sobre diseño
  de juegos: qué hace que algo sea divertido.
- **Charla *Juice it or lose it*** (Martin Jonasson y Petri Purho). Cómo los
  pequeños efectos transforman la sensación de un juego.
- **Los doce principios de la animación** (Frank Thomas y Ollie Johnston,
  *The Illusion of Life*). Hay muchos resúmenes con ejemplos animados.
- **Documentación y ejemplos de Phaser** (phaser.io), para todo lo específico
  del motor.
