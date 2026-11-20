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
  con el aspecto de su tipo: dos perritos, dos cebollas y un huevo

#### Scenario: Misma pantalla otra vez
- **WHEN** en Fácil empieza el segundo tablero de una pantalla
- **THEN** la vista muestra el mismo laberinto, con los ingredientes en su
  posición inicial
