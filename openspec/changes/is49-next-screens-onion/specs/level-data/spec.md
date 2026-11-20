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
