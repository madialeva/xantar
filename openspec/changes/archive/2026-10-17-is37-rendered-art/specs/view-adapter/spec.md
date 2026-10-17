## MODIFIED Requirements

### Requirement: Eventos a efectos
La vista SHALL reaccionar a los eventos de simulación para producir los efectos
visuales y de interfaz del juego: destello de cámara al perder una vida, nube de
pimienta, actualización de la puntuación, pimientas, vidas y nivel en los
paneles laterales, mensaje de preparado durante `ready`, mensaje de nivel
completado durante `levelClear` y pantalla de fin de partida. Además SHALL
producir un adorno breve al pisar un segmento, al aterrizar un ingrediente, al
aplastar un enemigo y al completar una hamburguesa. Todos los efectos SHALL
dibujarse con los gráficos del juego y todos los textos SHALL mostrarse en el
idioma activo.

#### Scenario: Perder una vida
- **WHEN** la simulación emite el evento de chef golpeado
- **THEN** la vista muestra el destello de cámara, el chef mantiene la
  animación de golpeado mientras dura `dying` y el contador de vidas del panel
  se actualiza

#### Scenario: Preparado
- **WHEN** la fase pasa a `ready`
- **THEN** la vista muestra el mensaje de preparado sobre el tablero hasta que
  la fase pasa a `playing`

#### Scenario: Fin de partida
- **WHEN** la fase pasa a `gameOver`
- **THEN** la vista muestra la pantalla de fin de partida con la puntuación
  final y, al confirmar, vuelve al menú principal

#### Scenario: Aplastar un enemigo
- **WHEN** la simulación emite el evento de enemigo aplastado
- **THEN** la vista muestra un efecto de aplastamiento en la posición del
  evento, aunque el enemigo ya no esté activo

### Requirement: Segmentos de ingrediente
La vista SHALL dibujar cada ingrediente con sus segmentos (2, 3 o 4 según el
nivel), cada uno con el gráfico que corresponde a su posición (extremo
izquierdo, tramo central o extremo derecho), y SHALL dibujar los segmentos
pisados más bajos que los no pisados. Al caer, aterrizar o reiniciarse el
tablero, el dibujo SHALL reflejar el estado de los segmentos de la simulación
sin decidir por sí misma qué segmentos están pisados.

#### Scenario: Pisar un segmento
- **WHEN** la simulación informa de que un segmento está pisado
- **THEN** la vista lo dibuja más bajo que los demás segmentos del ingrediente

#### Scenario: Aterrizaje
- **WHEN** un ingrediente aterriza y sus segmentos vuelven a estar sin pisar
- **THEN** la vista dibuja todos los segmentos a la misma altura

### Requirement: Laberinto a partir del nivel cargado
La vista SHALL dibujar plataformas, escaleras, cruces y platos a partir del
nivel cargado y no de constantes, con el gráfico asignado al id de cada pieza,
de modo que cualquier nivel válido se dibuje correctamente. Los extremos de cada
tramo de plataforma y de cada plato SHALL dibujarse con su remate.

#### Scenario: Nivel con plataformas irregulares
- **WHEN** se carga un nivel con plataformas de longitudes distintas y escaleras
  en columnas distintas por piso
- **THEN** la vista dibuja cada plataforma, escalera y plato en su posición

#### Scenario: Mismo nivel con otro tema
- **WHEN** se carga un documento de nivel antiguo que declara un tema
- **THEN** las piezas ocupan exactamente las mismas casillas y se dibujan igual
  que sin ese campo

## ADDED Requirements

### Requirement: Apilado en el plato según el grosor
La vista SHALL colocar cada ingrediente que va hacia un plato, o que ya está en
él, a una altura sobre el plato igual a la suma de los grosores visibles de los
ingredientes que tiene debajo en ese mismo plato, siendo el grosor visible un
valor fijo de cada tipo de ingrediente que corresponde a su arte. En el plato,
cada ingrediente SHALL dibujarse por encima de los que tiene debajo. La
simulación SHALL NOT verse afectada.

#### Scenario: Hamburguesa completa
- **WHEN** en un plato están, de abajo arriba, el pan de abajo, la carne, la
  lechuga y el pan de arriba
- **THEN** cada uno se dibuja apoyado sobre el anterior, sin huecos entre
  ellos, y el pan de arriba tapa la parte de atrás de la lechuga

#### Scenario: Otro plato
- **WHEN** un ingrediente cae en un plato vacío mientras otro plato tiene ya
  tres ingredientes
- **THEN** el ingrediente se dibuja apoyado directamente sobre su plato
