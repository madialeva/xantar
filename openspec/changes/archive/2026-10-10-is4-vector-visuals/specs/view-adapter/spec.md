# Spec Delta

## MODIFIED Requirements

### Requirement: Eventos a efectos
La vista SHALL reaccionar a los eventos de simulación para producir los efectos
visuales y de interfaz del juego: destello de cámara al perder una vida, nube de
pimienta, actualización de la puntuación, pimientas, vidas y nivel en los
paneles laterales, y pantallas de fin de nivel y fin de partida con
confirmación mediante Enter. Además SHALL producir un adorno breve al pisar un
segmento, al aterrizar un ingrediente, al aplastar un enemigo y al completar
una hamburguesa. Todos los efectos SHALL dibujarse con los gráficos del tema
activo.

#### Scenario: Perder una vida
- **WHEN** la simulación emite el evento de chef golpeado
- **THEN** la vista muestra el destello de cámara, el chef pasa a la animación
  de golpeado y el contador de vidas del panel se actualiza

#### Scenario: Fin de partida
- **WHEN** el estado pasa a `gameOver`
- **THEN** la vista muestra la pantalla de fin de partida sobre el tablero y,
  al pulsar Enter, solicita una partida nueva

#### Scenario: Aplastar un enemigo
- **WHEN** la simulación emite el evento de enemigo aplastado
- **THEN** la vista muestra un efecto de aplastamiento en la posición del
  evento, aunque el enemigo ya no esté activo

### Requirement: Segmentos de ingrediente
La vista SHALL dibujar cada ingrediente con sus segmentos (2, 3 o 4 según el
nivel), cada uno con el gráfico del tema que corresponde a su posición
(extremo izquierdo, tramo central o extremo derecho), y SHALL dibujar los
segmentos pisados más bajos que los no pisados. Al caer, aterrizar o
reiniciarse el tablero, el dibujo SHALL reflejar el estado de los segmentos de
la simulación sin decidir por sí misma qué segmentos están pisados.

#### Scenario: Pisar un segmento
- **WHEN** la simulación informa de que un segmento está pisado
- **THEN** la vista lo dibuja más bajo que los demás segmentos del ingrediente

#### Scenario: Aterrizaje
- **WHEN** un ingrediente aterriza y sus segmentos vuelven a estar sin pisar
- **THEN** la vista dibuja todos los segmentos a la misma altura

### Requirement: Laberinto a partir del nivel cargado
La vista SHALL dibujar plataformas, escaleras, cruces y platos a partir del
nivel cargado y no de constantes, con el gráfico que el tema activo asigna al
id de cada pieza, de modo que cualquier nivel válido se dibuje correctamente
con cualquier tema. Los extremos de cada tramo de plataforma y de cada plato
SHALL dibujarse con su remate.

#### Scenario: Nivel con plataformas irregulares
- **WHEN** se carga un nivel con plataformas de longitudes distintas y escaleras
  en columnas distintas por piso
- **THEN** la vista dibuja cada plataforma, escalera y plato en su posición

#### Scenario: Mismo nivel con otro tema
- **WHEN** se carga el nivel clásico con el tema alternativo
- **THEN** las piezas ocupan exactamente las mismas casillas que con el tema
  por defecto
