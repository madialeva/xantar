# level-data Specification

## Purpose
Define cómo se describe un nivel como datos que la simulación consume, en lugar
de constantes globales. Establece el contenido mínimo de esa descripción y su
comprobación de integridad. Es un formato transitorio que evolucionará con el
editor de niveles, pero ya desacopla las reglas de un nivel concreto.

## Requirements

### Requirement: Descripción de nivel como datos
Un nivel SHALL describirse mediante un documento JSON versionado, serializable y
sin funciones ni referencias a Phaser, que contenga: el identificador de formato
`xantar-level`, el número de versión, un nombre, el número de columnas y de
filas, el tamaño de unidad del nivel (`segments`, opcional), tres capas de
cuadrícula (`structure`, `ingredients` y `actors`), cada una como una lista de
`filas` cadenas de `columnas` caracteres, y la lista opcional `entries` con el
retraso de entrada de los enemigos. Los caracteres SHALL interpretarse con el
registro de piezas. La simulación SHALL obtener toda la geometría y
colocaciones del nivel exclusivamente de este documento. Los tramos de
plataforma contiguos de una misma fila SHALL tratarse como un único tramo
continuo.

#### Scenario: Cambiar el nivel sin tocar las reglas
- **WHEN** se inicia la simulación con un documento de nivel distinto pero
  válido
- **THEN** chef, enemigos, ingredientes y plataformas aparecen según ese
  documento sin modificar código de reglas

#### Scenario: Descripción serializable
- **WHEN** un documento de nivel se convierte a JSON y se vuelve a leer
- **THEN** la simulación iniciada con el resultado se comporta igual que con
  el original

#### Scenario: Documento sin entradas
- **WHEN** se lee un documento de nivel sin el campo `entries`
- **THEN** se carga igual que antes y todos sus enemigos tienen retraso 0

### Requirement: Nivel clásico migrado
El proyecto SHALL incluir el nivel clásico como un documento de nivel en el
fichero `src/levels/classic.level.json`, con una cuadrícula de 39×30 trazada
sobre la primera pantalla del juego original: ocho filas de plataforma, en las
filas 5, 9, 11, 13, 15, 17, 19 y 23 (las filas 0 a 4 quedan libres); nueve
columnas de escalera, una a cada lado de cada hamburguesa y una bajo cada
hamburguesa, con tramos de distinto largo; cuatro platos de cuatro casillas en
la fila 28; cuatro ingredientes de cuatro segmentos por plato, repartidos en
pisos distintos; el inicio del chef en el centro de la fila de plataforma
inferior; y, como en el original, cuatro enemigos que entran desde los bordes
del tablero por pasarelas de cuatro casillas a los dos lados de los pisos
superior e inferior: un huevo por abajo a la derecha a los 500 ms, un perrito
por abajo a la izquierda a los 1000 ms, un perrito por arriba a la derecha a
los 2750 ms y un perrito por arriba a la izquierda a los 4500 ms. El campo de
juego SHALL quedar centrado en el tablero.

#### Scenario: Paridad de geometría
- **WHEN** se carga el nivel clásico
- **THEN** la simulación contiene cuatro columnas de cuatro ingredientes
  (panecillo superior, lechuga, carne y panecillo inferior, de arriba abajo),
  cada una sobre su plato; un chef en la fila de plataforma inferior; y cuatro
  entradas de enemigo, tres perritos y un huevo, en los bordes de los pisos
  superior e inferior, que también son los puntos de reaparición

#### Scenario: Hamburguesas separadas por escaleras
- **WHEN** se carga el nivel clásico
- **THEN** entre dos hamburguesas, y a la izquierda de la primera y a la
  derecha de la última, hay tres casillas con una escalera en la del centro, y
  ninguna hamburguesa toca a otra

#### Scenario: Pisos a varias alturas
- **WHEN** se miden las distancias entre filas de plataforma consecutivas del
  nivel clásico
- **THEN** son de 4, 2, 2, 2, 2, 2 y 4 filas, de arriba abajo: 2, 1, 1, 1, 1, 1 y
  2 cocineros, como los pisos de la primera pantalla del original

#### Scenario: Campo centrado
- **WHEN** se carga el nivel clásico
- **THEN** sus plataformas van de la columna 4 a la 34, con cuatro columnas
  libres a cada lado, ocupadas en los pisos superior e inferior por las
  pasarelas de entrada

#### Scenario: Orden de entrada del original
- **WHEN** empieza la fase `playing` del primer tablero
- **THEN** entran, por este orden, el huevo por abajo a la derecha, un perrito
  por abajo a la izquierda, otro por arriba a la derecha y otro por arriba a la
  izquierda

#### Scenario: Nivel clásico jugable
- **WHEN** se valida el nivel clásico
- **THEN** no se produce ninguna incidencia

### Requirement: Comprobación de integridad al cargar
Al cargar un documento de nivel, el sistema SHALL comprobar su integridad
estructural y rechazarlo con un error descriptivo que indique, cuando proceda,
la capa, la fila y la columna, si: el formato o la versión no están soportados;
alguna capa no tiene exactamente `filas` filas de `columnas` caracteres; algún
carácter no corresponde a una pieza del registro para esa capa; una racha de
casillas de una pieza de varias casillas no tiene una longitud múltiplo de su
ancho (para ingredientes y platos, el tamaño de unidad del nivel); falta la posición inicial del chef o hay más de una; o un segmento de
ingrediente no tiene una casilla de plataforma debajo en la capa `structure`. La
validación de jugabilidad (alcanzabilidad, destinos de caída) es una
comprobación distinta y queda fuera de este requisito.

#### Scenario: Ingrediente fuera del tablero
- **WHEN** una fila de la capa de ingredientes tiene más caracteres que las
  columnas del nivel
- **THEN** la carga falla con un error que indica la capa, la fila y el motivo

#### Scenario: Nivel sin posición de chef
- **WHEN** se carga un nivel sin ninguna marca de inicio del chef
- **THEN** la carga falla con un error descriptivo

#### Scenario: Símbolo desconocido
- **WHEN** una capa contiene un carácter que ninguna pieza del registro usa en
  esa capa
- **THEN** la carga falla con un error que indica el carácter, la capa, la fila
  y la columna

#### Scenario: Racha de ingrediente incompleta
- **WHEN** una fila de la capa de ingredientes contiene una racha de seis
  casillas iguales en un nivel con unidades de cuatro casillas
- **THEN** la carga falla con un error que indica la fila y la columna de la
  racha

#### Scenario: Ingrediente sin plataforma
- **WHEN** un segmento de ingrediente está en una casilla sin plataforma en la
  capa `structure`
- **THEN** la carga falla con un error que indica la fila y la columna

### Requirement: Importación y exportación en JSON
El sistema SHALL ofrecer una función que lea un documento de nivel desde texto
JSON y una que lo escriba, de modo que escribir y volver a leer un documento dé
el mismo nivel. La escritura SHALL ser estable (el mismo documento produce el
mismo texto) y legible (una cadena por fila de cada capa). Un texto que no sea
JSON válido, o un documento con una versión posterior a la soportada, SHALL
rechazarse con un error descriptivo.

#### Scenario: Ida y vuelta
- **WHEN** se escribe el nivel clásico a texto y se vuelve a leer
- **THEN** se obtiene un documento igual y la simulación se comporta igual

#### Scenario: Texto no válido
- **WHEN** se lee un texto que no es JSON
- **THEN** la lectura falla con un error descriptivo

#### Scenario: Versión futura
- **WHEN** se lee un documento cuya versión es posterior a la soportada
- **THEN** la lectura falla indicando la versión encontrada y la soportada

### Requirement: Tamaño de las unidades del nivel
Un documento de nivel SHALL poder declarar el tamaño de sus unidades con el campo
`segments`, cuyos valores permitidos son 2, 3 y 4; si se omite, SHALL valer 4. El
tamaño de unidad SHALL ser el número de segmentos de cada ingrediente y el ancho
en casillas de cada ingrediente y de cada plato del nivel. Un valor no permitido
SHALL rechazarse con un error descriptivo.

#### Scenario: Minihamburguesas
- **WHEN** se carga un nivel con `segments` igual a 3 y rachas de seis casillas
  de ingrediente
- **THEN** se crean dos ingredientes de tres segmentos cada uno

#### Scenario: Tamaño por defecto
- **WHEN** se carga un nivel sin el campo `segments`
- **THEN** sus ingredientes y platos tienen cuatro casillas

#### Scenario: Tamaño no permitido
- **WHEN** se carga un nivel con `segments` igual a 5
- **THEN** la carga falla indicando el valor y los valores permitidos

### Requirement: Casillas de medio cocinero
Cada casilla de la cuadrícula de un nivel SHALL ser, para las reglas, un
carácter del juego original a escala ×2: 16 unidades, la mitad que el chef de
pie. Las medidas horizontales de las reglas de juego (velocidades, márgenes,
distancias de enganche, contacto y alcance de la pimienta) SHALL contarse a 16
unidades por casilla. Para aprovechar las pantallas apaisadas, cada casilla
SHALL dibujarse de 18 unidades de ancho, sin que cambie el juego, y de 21 de
alto, y el tablero SHALL conservar las 39 columnas y 30 filas del original. Con
plataformas de 8 unidades de grueso, dos pisos separados por dos filas (un
tramo de escalera) SHALL dejar entre ellos algo más que la altura del chef, de
modo que 2, 3 o 4 tramos midan 2, 3 o 4 cocineros sin contar lo que la escalera
se solapa con las plataformas.

#### Scenario: Escalera de un cocinero
- **WHEN** un tramo de escalera une dos plataformas separadas por dos filas y el
  chef está de pie en la de abajo, al pie de la escalera
- **THEN** lo alto de su gorro queda 2 unidades por debajo de la plataforma de
  arriba

#### Scenario: Ingrediente de dos cocineros
- **WHEN** se dibuja un ingrediente de cuatro segmentos
- **THEN** mide cuatro casillas de ancho, lo mismo que dos cocineros de alto
  en la rejilla del original, y se dibuja de 72 unidades

#### Scenario: Casillas más anchas, mismo juego
- **WHEN** el chef anda por una plataforma durante un segundo
- **THEN** avanza 5,375 casillas, las 86 unidades del original a 16 por
  casilla, que en el tablero se dibujan como 96,75 unidades

#### Scenario: Dos tramos
- **WHEN** una escalera une dos pisos separados por cuatro filas
- **THEN** deja 76 unidades libres entre sus plataformas: dos cocineros y algo
  más

### Requirement: Entradas de los enemigos
Un marcador de enemigo sobre una pasarela de entrada SHALL ser una entrada: el
enemigo aparece en él y entra andando por la pasarela hasta la plataforma a la
que está pegada. Un marcador sobre una plataforma SHALL hacer aparecer al
enemigo directamente en ella. Cada elemento de `entries` SHALL dar la fila, la
columna y el retraso en milisegundos de un marcador de enemigo; un marcador sin
elemento en `entries` SHALL tener retraso 0.

#### Scenario: Marcador en una pasarela
- **WHEN** un nivel tiene un marcador de perrito en el extremo exterior de una
  pasarela pegada al extremo izquierdo de una plataforma
- **THEN** el perrito aparece en el marcador y entra andando hacia la derecha
  hasta esa plataforma

#### Scenario: Retraso de una entrada
- **WHEN** `entries` da 1000 ms al marcador de la fila 23 y la columna 0
- **THEN** ese enemigo aparece 60 ticks después de empezar la fase `playing`

### Requirement: Pantallas del juego
El proyecto SHALL incluir, por este orden, cuatro pantallas como documentos de
nivel de 39×30 en `src/levels/`: la clásica y tres de diseño propio, Pirámide
(`pyramid.level.json`), Mostrador (`counter.level.json`) y Torres
(`towers.level.json`). Cada una SHALL tener cuatro hamburguesas, el campo de
juego centrado, el inicio del chef en el centro del piso de abajo y enemigos que
entran por pasarelas, y SHALL validarse sin incidencias.

#### Scenario: Orden de las pantallas
- **WHEN** se cargan las pantallas del juego
- **THEN** son, por este orden, la clásica, la Pirámide, el Mostrador y las
  Torres

#### Scenario: Pantallas jugables
- **WHEN** se valida cada pantalla y se sueltan sus ingredientes de uno en uno,
  empezando cada vez por el más bajo
- **THEN** la validación no da ninguna incidencia y se completan todas sus
  hamburguesas

#### Scenario: Enemigos de cada pantalla
- **WHEN** empieza la fase `playing` de cada pantalla nueva y pasan sus retrasos
  de entrada
- **THEN** han entrado tres perritos y un huevo en la Pirámide; dos perritos,
  dos cebollas y un huevo en el Mostrador; y cuatro perritos y dos cebollas en
  las Torres

#### Scenario: Cima de la Pirámide
- **WHEN** se carga la Pirámide
- **THEN** sus dos pisos más altos solo cubren las dos hamburguesas centrales y
  sus enemigos entran por los lados de un piso intermedio y del piso de abajo

#### Scenario: Platos en el Mostrador
- **WHEN** se carga el Mostrador
- **THEN** las dos hamburguesas centrales terminan en platos a media altura,
  con un piso por debajo que pasa bajo ellos, y las dos de los lados en platos
  abajo del todo

#### Scenario: Hamburguesas dobles en las Torres
- **WHEN** se carga la pantalla de las Torres
- **THEN** cada hamburguesa tiene seis ingredientes, de arriba abajo pan
  superior, lechuga, carne, lechuga, carne y pan inferior, y cada plato espera
  seis
