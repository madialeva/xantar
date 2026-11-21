## MODIFIED Requirements

### Requirement: Laberinto a partir del nivel cargado
La vista SHALL dibujar plataformas, escaleras, cruces, platos y pasarelas de
entrada a partir del nivel cargado y no de constantes, con el gráfico asignado
al id de cada pieza, de modo que cualquier nivel válido se dibuje
correctamente. Los extremos de cada tramo de plataforma y de cada plato SHALL
dibujarse con su remate. Las pasarelas SHALL dibujarse como una prolongación
más oscura del piso al que están pegadas, que se distinga de la plataforma por
la que anda el chef. Cuando un tablero nuevo es de otra pantalla, la vista
SHALL dibujar el laberinto de esa pantalla y un personaje por cada uno de sus
enemigos, sin restos de la anterior.

#### Scenario: Nivel con plataformas irregulares
- **WHEN** se carga un nivel con plataformas de longitudes distintas y escaleras
  en columnas distintas por piso
- **THEN** la vista dibuja cada plataforma, escalera y plato en su posición

#### Scenario: Mismo nivel con otro tema
- **WHEN** se carga un documento de nivel antiguo que declara un tema
- **THEN** las piezas ocupan exactamente las mismas casillas y se dibujan igual
  que sin ese campo

#### Scenario: Pasarelas a los lados de un piso
- **WHEN** se carga un nivel con pasarelas a los dos lados de un piso
- **THEN** la vista dibuja el piso con sus remates y, más allá de cada remate,
  la pasarela hasta el borde del tablero con su propio gráfico

#### Scenario: Cambio de pantalla
- **WHEN** en Normal termina `levelClear` de la segunda pantalla y empieza el
  tablero de la tercera
- **THEN** la vista muestra los pisos, las escaleras, los platos y los
  ingredientes de la tercera pantalla, ninguno de la segunda, y cinco enemigos
  con el aspecto de su tipo: dos chorizos, dos cebollas y una mazorca

#### Scenario: Misma pantalla otra vez
- **WHEN** en Fácil empieza el segundo tablero de una pantalla
- **THEN** la vista muestra el mismo laberinto, con los ingredientes en su
  posición inicial

## ADDED Requirements

### Requirement: Ingredientes que cuelgan de su base
La vista SHALL dibujar cada ingrediente con su base a la altura que le da la
simulación. Un ingrediente cuyo arte llega por debajo de su base, como las
lágrimas del queso, SHALL dibujarse con esa parte colgando sobre lo que tenga
debajo, la carne de su hamburguesa o el borde de su piso, y no levantado para
que quepa encima.

#### Scenario: Queso sobre la carne
- **WHEN** en un plato hay un queso apilado sobre una carne
- **THEN** la loncha del queso se apoya en lo alto de la carne y sus lágrimas
  cuelgan por delante de la carne

#### Scenario: Queso en un piso
- **WHEN** un queso está quieto en un piso
- **THEN** su loncha queda sobre el suelo del piso y sus lágrimas cuelgan por
  delante del borde de la plataforma
