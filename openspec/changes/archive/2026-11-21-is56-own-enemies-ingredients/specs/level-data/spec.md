## MODIFIED Requirements

### Requirement: Nivel clásico migrado
El proyecto SHALL incluir el nivel clásico como un documento de nivel en el
fichero `src/levels/classic.level.json`, con una cuadrícula de 39×30 trazada
sobre la primera pantalla del juego original: ocho filas de plataforma, en las
filas 5, 9, 11, 13, 15, 17, 19 y 23 (las filas 0 a 4 quedan libres); nueve
columnas de escalera, una a cada lado de cada hamburguesa y una bajo cada
hamburguesa, con tramos de distinto largo; cuatro platos de cuatro casillas en
la fila 28; cuatro ingredientes de cuatro segmentos por plato, repartidos en
pisos distintos; el inicio del chef en el centro de la fila de plataforma
inferior; y, con las entradas y los tiempos del original, cuatro enemigos
propios que entran desde los bordes del tablero por pasarelas de cuatro
casillas a los dos lados de los pisos superior e inferior: una mazorca por
abajo a la derecha a los 500 ms, un chorizo por abajo a la izquierda a los
1000 ms, un chorizo por arriba a la derecha a los 2750 ms y un chorizo por
arriba a la izquierda a los 4500 ms. El campo de juego SHALL quedar centrado en
el tablero.

#### Scenario: Paridad de geometría
- **WHEN** se carga el nivel clásico
- **THEN** la simulación contiene cuatro columnas de cuatro ingredientes
  (panecillo superior, lechuga, carne y panecillo inferior, de arriba abajo),
  cada una sobre su plato; un chef en la fila de plataforma inferior; y cuatro
  entradas de enemigo, tres chorizos y una mazorca, en los bordes de los pisos
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
- **THEN** entran, por este orden, la mazorca por abajo a la derecha, un
  chorizo por abajo a la izquierda, otro por arriba a la derecha y otro por
  arriba a la izquierda

#### Scenario: Nivel clásico jugable
- **WHEN** se valida el nivel clásico
- **THEN** no se produce ninguna incidencia

### Requirement: Entradas de los enemigos
Un marcador de enemigo sobre una pasarela de entrada SHALL ser una entrada: el
enemigo aparece en él y entra andando por la pasarela hasta la plataforma a la
que está pegada. Un marcador sobre una plataforma SHALL hacer aparecer al
enemigo directamente en ella. Cada elemento de `entries` SHALL dar la fila, la
columna y el retraso en milisegundos de un marcador de enemigo; un marcador sin
elemento en `entries` SHALL tener retraso 0.

#### Scenario: Marcador en una pasarela
- **WHEN** un nivel tiene un marcador de chorizo en el extremo exterior de una
  pasarela pegada al extremo izquierdo de una plataforma
- **THEN** el chorizo aparece en el marcador y entra andando hacia la derecha
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
entran por pasarelas, y SHALL validarse sin incidencias. Desde la segunda
pantalla SHALL aparecer el queso y el tomate en lugar de algunas lechugas, sin
cambiar el número de ingredientes de ninguna hamburguesa.

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
- **THEN** han entrado tres chorizos y una mazorca en la Pirámide; dos
  chorizos, dos cebollas y una mazorca en el Mostrador; y cuatro chorizos y dos
  cebollas en las Torres

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
  superior, lechuga o tomate, carne, queso, carne y pan inferior, con lechuga en
  la primera y la tercera hamburguesa y tomate en la segunda y la cuarta, y
  cada plato espera seis

#### Scenario: Queso en la Pirámide
- **WHEN** se carga la Pirámide
- **THEN** las dos hamburguesas centrales tienen, de arriba abajo, pan
  superior, queso, carne y pan inferior, y las dos de los lados, pan superior,
  lechuga, carne y pan inferior

#### Scenario: Tomate en el Mostrador
- **WHEN** se carga el Mostrador
- **THEN** las dos hamburguesas centrales tienen, de arriba abajo, pan
  superior, tomate, carne y pan inferior; la de la izquierda, pan superior,
  lechuga, carne y pan inferior; y la de la derecha, pan superior, queso, carne
  y pan inferior
