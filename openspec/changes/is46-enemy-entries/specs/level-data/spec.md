## MODIFIED Requirements

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

## ADDED Requirements

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
