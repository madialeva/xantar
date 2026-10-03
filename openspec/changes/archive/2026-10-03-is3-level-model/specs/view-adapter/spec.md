# Spec Delta

## ADDED Requirements

### Requirement: Segmentos de ingrediente
La vista SHALL dibujar cada ingrediente con sus segmentos (2, 3 o 4 según el nivel) y SHALL dibujar los
segmentos pisados más bajos que los no pisados. Al caer, aterrizar o reiniciarse
el tablero, el dibujo SHALL reflejar el estado de los segmentos de la simulación
sin decidir por sí misma qué segmentos están pisados.

#### Scenario: Pisar un segmento
- **WHEN** la simulación informa de que un segmento está pisado
- **THEN** la vista lo dibuja más bajo que los demás segmentos del ingrediente

#### Scenario: Aterrizaje
- **WHEN** un ingrediente aterriza y sus segmentos vuelven a estar sin pisar
- **THEN** la vista dibuja todos los segmentos a la misma altura

### Requirement: Laberinto a partir del nivel cargado
La vista SHALL dibujar plataformas, escaleras y platos a partir del nivel cargado
y no de constantes, de modo que cualquier nivel válido se dibuje correctamente.

#### Scenario: Nivel con plataformas irregulares
- **WHEN** se carga un nivel con plataformas de longitudes distintas y escaleras
  en columnas distintas por piso
- **THEN** la vista dibuja cada plataforma, escalera y plato en su posición
