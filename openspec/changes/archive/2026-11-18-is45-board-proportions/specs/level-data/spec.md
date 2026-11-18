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
inferior y tres enemigos (perrito, pepinillo y huevo) en la fila superior. El
campo de juego SHALL quedar centrado en el tablero.

#### Scenario: Paridad de geometría
- **WHEN** se carga el nivel clásico
- **THEN** la simulación contiene cuatro columnas de cuatro ingredientes
  (panecillo superior, lechuga, carne y panecillo inferior, de arriba abajo),
  cada una sobre su plato; un chef en la fila de plataforma inferior; y tres
  enemigos en la fila superior que también son los puntos de aparición

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
  libres a cada lado

#### Scenario: Nivel clásico jugable
- **WHEN** se valida el nivel clásico
- **THEN** no se produce ninguna incidencia

## ADDED Requirements

### Requirement: Casillas de medio cocinero
Cada casilla de la cuadrícula de un nivel SHALL medir la mitad que el chef de
pie: el chef ocupa 2×2 casillas, del alto de los pies a lo alto del gorro y del
ancho de dos trozos de ingrediente, como un carácter del juego original a
escala ×2. Así, la separación entre dos pisos unidos por una escalera es un
número entero de alturas del chef cuando es un número par de filas.

#### Scenario: Escalera de un cocinero
- **WHEN** un tramo de escalera une dos plataformas separadas por dos filas y el
  chef está de pie en la de abajo, al pie de la escalera
- **THEN** lo alto de su gorro llega al suelo de la plataforma de arriba

#### Scenario: Ingrediente de dos cocineros
- **WHEN** se dibuja un ingrediente de cuatro segmentos
- **THEN** mide de ancho lo mismo que dos cocineros de alto
