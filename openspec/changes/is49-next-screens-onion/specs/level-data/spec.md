## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Casillas de medio cocinero
Cada casilla de la cuadrícula de un nivel SHALL medir 16 unidades de ancho, la
mitad que el chef de pie (como un carácter del juego original a escala ×2), y
21 de alto, y el tablero SHALL conservar las 39 columnas y 30 filas del
original. Con plataformas de 8 unidades de grueso, dos pisos separados por dos
filas (un tramo de escalera) SHALL dejar entre ellos algo más que la altura del
chef, de modo que 2, 3 o 4 tramos midan 2, 3 o 4 cocineros sin contar lo que la
escalera se solapa con las plataformas.

#### Scenario: Escalera de un cocinero
- **WHEN** un tramo de escalera une dos plataformas separadas por dos filas y el
  chef está de pie en la de abajo, al pie de la escalera
- **THEN** lo alto de su gorro queda 2 unidades por debajo de la plataforma de
  arriba

#### Scenario: Ingrediente de dos cocineros
- **WHEN** se dibuja un ingrediente de cuatro segmentos
- **THEN** mide de ancho lo mismo que dos cocineros de alto

#### Scenario: Dos tramos
- **WHEN** una escalera une dos pisos separados por cuatro filas
- **THEN** deja 76 unidades libres entre sus plataformas: dos cocineros y algo
  más
